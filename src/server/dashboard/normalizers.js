function clean(value) {
  return String(value == null ? "" : value).trim();
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  const text = clean(value);
  return text ? [text] : [];
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => {
    if (Array.isArray(item)) return item.length > 0;
    return clean(item) !== "";
  }));
}

function answerValue(answer) {
  const text = (answer?.textAnswers?.answers || []).map((item) => clean(item.value)).filter(Boolean);
  if (text.length === 1) return text[0];
  if (text.length > 1) return text;

  const files = (answer?.fileUploadAnswers?.answers || []).map((file) => clean(file.fileName)).filter(Boolean);
  if (files.length === 1) return files[0];
  return files;
}

function invertFieldMap(fieldMap) {
  return new Map(Object.entries(fieldMap).map(([field, questionId]) => [String(questionId), field]));
}

function safeTimestamp(value) {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function detailKey(label, index) {
  const slug = clean(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? `other.${slug}` : `other.answer-${index + 1}`;
}

function parsePhotoLinks(value) {
  const matches = asArray(value).join("\n").match(/https?:\/\/[^\s,]+/g) || [];
  return matches.map((url, index) => ({ url, label: `Site photo ${index + 1}` }));
}

function buildSummary(type, answers) {
  if (type === "build") {
    return [answers.service || answers.requestedWork || "Build request", answers.estimatedSize]
      .flatMap(asArray).filter(Boolean).join(" · ");
  }
  return [answers.estimatedSize || "Rental request", answers.buildDay || answers.setupDate]
    .flatMap(asArray).filter(Boolean).join(" · ");
}

export function normalizeFormResponse({ type, response, metadata, fieldMap }) {
  const mappedByQuestion = invertFieldMap(fieldMap);
  const answers = {};
  const details = [];

  Object.entries(response.answers || {}).forEach(([questionId, answer], index) => {
    const value = answerValue(answer);
    if (!asArray(value).length) return;
    const field = mappedByQuestion.get(questionId);
    const title = metadata.questions.get(questionId)?.title || "Additional answer";
    const key = field || detailKey(title, index);
    if (field) answers[field] = value;
    details.push({ key, label: title, value });
  });

  const customer = compactObject({
    name: answers.name,
    firstName: answers.firstName,
    lastName: answers.lastName,
    phone: answers.phone,
    email: answers.email || response.respondentEmail,
  });
  const location = compactObject({
    address: answers.address || answers.addressLine1,
    city: answers.city,
    state: answers.state,
    zip: answers.postalCode || answers.zip,
    neighborhood: answers.neighborhoodOther || answers.neighborhood,
  });
  const photos = parsePhotoLinks(answers.photoLinks || answers.photos);

  return {
    id: clean(response.responseId),
    type,
    submittedAt: safeTimestamp(response.lastSubmittedTime || response.createTime),
    customer,
    ...(Object.keys(location).length ? { location } : {}),
    summary: buildSummary(type, answers),
    answers: compactObject(answers),
    details,
    ...(photos.length ? { photos } : {}),
    source: { provider: "google-form", key: type === "build" ? "builds" : "rentals" },
  };
}

export function normalizeTestimonialRow({ headers, row }) {
  const values = Object.fromEntries(headers.map((header, index) => [clean(header), clean(row.values[index])]));
  const contact = values["Verification contact"] || "";
  const testimonial = values.Testimonial || "";
  const answers = compactObject({
    organization: values.Organization,
    verificationContact: contact,
    testimonial,
    publicationConsent: values["Publication consent"],
    status: values.Status,
    sourcePage: values["Source page"],
  });

  return {
    id: values["Submission ID"] || `testimonial-row-${row.rowNumber}`,
    type: "testimonial",
    submittedAt: safeTimestamp(values["Submitted at"]),
    customer: compactObject({
      name: values.Name,
      email: contact.includes("@") ? contact : "",
      phone: contact && !contact.includes("@") ? contact : "",
    }),
    summary: testimonial.length > 110 ? `${testimonial.slice(0, 107)}…` : testimonial || "Testimonial",
    answers,
    details: Object.entries(answers).map(([key, value]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
      value,
    })),
    source: { provider: "google-sheet", key: "testimonials" },
  };
}

export function matchesDashboardSearch(record, query) {
  const needle = clean(query).toLowerCase();
  if (!needle) return true;
  return [
    record.customer?.name,
    record.customer?.firstName,
    record.customer?.lastName,
    record.customer?.email,
    record.customer?.phone,
    record.location?.neighborhood,
    record.location?.city,
    record.summary,
  ].filter(Boolean).join(" ").toLowerCase().includes(needle);
}
