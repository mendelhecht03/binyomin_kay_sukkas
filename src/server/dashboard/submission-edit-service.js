import { updateSubmissionRecord } from "../storage/submission-repository.js";

const CUSTOMER_LIMITS = { name: 200, email: 320, phone: 100 };
const LOCATION_LIMITS = { address: 1000, city: 200, state: 120, zip: 30, neighborhood: 200 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalid(message, field) {
  const error = new Error(message);
  error.code = "INVALID_SUBMISSION_VALUES";
  error.field = field;
  throw error;
}
function cleanText(value, limit, field) {
  if (typeof value !== "string") invalid("Edited text responses must be text.", field);
  const cleaned = value.trim();
  if (cleaned.length > limit) invalid(`The edited ${field} response is too long.`, field);
  return cleaned;
}

function cleanAnswer(value, field) {
  if (Array.isArray(value)) {
    if (value.length > 50) invalid("A response cannot contain more than 50 choices.", field);
    return value.map((item) => cleanText(item, 500, field)).filter(Boolean);
  }
  if (typeof value === "string") return cleanText(value, 10000, field);
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  invalid("This edited response has an unsupported value.", field);
}

function cleanGroup(value, limits, groupName) {
  if (value == null) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`The edited ${groupName} details could not be read.`, groupName);
  const cleaned = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (!Object.prototype.hasOwnProperty.call(limits, key)) invalid(`The edited ${groupName} details contain an unknown field.`, `${groupName}.${key}`);
    cleaned[key] = cleanText(fieldValue, limits[key], `${groupName}.${key}`);
  }
  return cleaned;
}

function validateAndCleanChanges(changes) {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) invalid("No editable submission responses were supplied.", "changes");
  const unknownGroups = Object.keys(changes).filter((key) => !["customer", "location", "answers"].includes(key));
  if (unknownGroups.length) invalid("The submission update contains an unknown section.", unknownGroups[0]);
  const customer = cleanGroup(changes.customer, CUSTOMER_LIMITS, "customer");
  const location = cleanGroup(changes.location, LOCATION_LIMITS, "location");
  if (customer.email && !EMAIL_PATTERN.test(customer.email)) invalid("Enter a valid email address.", "customer.email");
  if (customer.phone && !/^[\d\s()+.\-#xext]+$/i.test(customer.phone)) invalid("Enter a valid phone number.", "customer.phone");

  const rawAnswers = changes.answers == null ? {} : changes.answers;
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) invalid("The edited responses could not be read.", "answers");
  if (Object.keys(rawAnswers).length > 200) invalid("Too many response fields were submitted at once.", "answers");
  const answers = {};
  for (const [key, value] of Object.entries(rawAnswers)) {
    if (!/^[A-Za-z0-9_-]{1,120}$/.test(key)) invalid("An edited response field could not be identified.", key);
    answers[key] = cleanAnswer(value, key);
  }
  if (!Object.keys(customer).length && !Object.keys(location).length && !Object.keys(answers).length) {
    invalid("Make at least one change before saving.", "changes");
  }
  return { customer, location, answers };
}

export async function editDashboardSubmission({ env, type, id, changes, origin, logger = console }) {
  try {
    const cleanedChanges = validateAndCleanChanges(changes);
    const submission = await updateSubmissionRecord({ env, type, id, changes: cleanedChanges, origin });
    return { ok: true, submission, message: "The submission changes were saved." };
  } catch (error) {
    const expectedErrors = {
      INVALID_SUBMISSION_UPDATE: [400, "The submission update could not be identified."],
      INVALID_SUBMISSION_VALUES: [400, error?.message || "Check the edited values and try again."],
      UNKNOWN_SUBMISSION_FIELD: [400, "One of the edited response fields no longer exists. Refresh and try again."],
      INVALID_TESTIMONIAL_CONTENT: [400, "A testimonial must keep a reviewer name, publication consent, and at least 20 characters of testimonial text."],
      SUBMISSION_NOT_FOUND: [404, "The submission was not found. Refresh the dashboard and try again."],
      DATABASE_NOT_CONFIGURED: [503, "The submissions database has not been configured yet."],
    };
    if (expectedErrors[error?.code]) {
      const [status, message] = expectedErrors[error.code];
      return { ok: false, status, code: error.code, field: error?.field, message };
    }
    logger.error("dashboard.submission_edit.failed", {
      errorName: String(error?.name || "Error").slice(0, 80),
      errorMessage: String(error?.message || "Unknown edit failure").replace(/[\r\n]+/g, " ").slice(0, 240),
    });
    return { ok: false, status: 502, code: "SUBMISSION_EDIT_FAILED", message: "The submission changes could not be saved." };
  }
}
