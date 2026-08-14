import { configurationError, googleErrorFromResponse } from "./errors.js";

const FORMS_API = "https://forms.googleapis.com/v1/forms";
const metadataCache = new Map();
const METADATA_TTL_MS = 15 * 60 * 1000;

function collectQuestions(items = [], questions = new Map()) {
  for (const item of items) {
    const question = item.questionItem?.question;
    if (question?.questionId) {
      questions.set(question.questionId, {
        questionId: question.questionId,
        itemId: item.itemId || "",
        title: item.title || "Untitled question",
      });
    }

    for (const groupedQuestion of item.questionGroupItem?.questions || []) {
      if (groupedQuestion.questionId) {
        questions.set(groupedQuestion.questionId, {
          questionId: groupedQuestion.questionId,
          itemId: item.itemId || "",
          title: groupedQuestion.rowQuestion?.title || item.title || "Untitled question",
        });
      }
    }

    if (Array.isArray(item.items)) collectQuestions(item.items, questions);
  }
  return questions;
}

function validateFormId(source, formId) {
  const value = String(formId || "").trim();
  if (!value || value.startsWith("1FAIpQL")) {
    throw configurationError(
      source,
      `The private ${source} Google Form ID is missing or uses a public responder ID.`,
    );
  }
  return value;
}

export function parseFieldMap(source, rawValue) {
  try {
    const parsed = JSON.parse(String(rawValue || ""));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Invalid map");
    return parsed;
  } catch {
    throw configurationError(source, `The ${source} Google Form field map is missing or invalid.`);
  }
}

export class GoogleFormsProvider {
  constructor({ source, formId, accessToken, fetchImpl = fetch, now = Date.now }) {
    this.source = source;
    this.formId = validateFormId(source, formId);
    this.accessToken = accessToken;
    this.fetchImpl = fetchImpl;
    this.now = now;
  }

  async request(path, params = {}) {
    const url = new URL(`${FORMS_API}/${encodeURIComponent(this.formId)}${path}`);
    for (const [name, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
    }
    const response = await this.fetchImpl(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!response.ok) throw googleErrorFromResponse(this.source, response);
    return response.json();
  }

  async getFormMetadata() {
    const cached = metadataCache.get(this.formId);
    if (cached && cached.expiresAt > this.now()) return cached.value;

    const form = await this.request("");
    const value = {
      title: form.info?.title || form.info?.documentTitle || this.source,
      questions: collectQuestions(form.items),
    };
    metadataCache.set(this.formId, { value, expiresAt: this.now() + METADATA_TTL_MS });
    return value;
  }

  async listResponses({ pageSize = 50, pageToken } = {}) {
    const result = await this.request("/responses", {
      pageSize: Math.max(1, Math.min(Number(pageSize) || 50, 200)),
      pageToken,
    });
    return {
      items: result.responses || [],
      nextCursor: result.nextPageToken || undefined,
    };
  }

  async getResponse(responseId) {
    if (!responseId) throw configurationError(this.source, "A Google Form response ID is required.");
    return this.request(`/responses/${encodeURIComponent(responseId)}`);
  }
}

export function clearFormsMetadataCacheForTests() {
  metadataCache.clear();
}
