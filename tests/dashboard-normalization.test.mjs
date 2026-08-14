import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFormResponse,
  normalizeTestimonialRow,
} from "../src/server/dashboard/normalizers.js";

const metadata = {
  questions: new Map([
    ["q-name", { title: "Name" }],
    ["q-phone", { title: "Best phone number" }],
    ["q-size", { title: "Estimated size" }],
    ["q-work", { title: "Requested work" }],
    ["q-unknown", { title: "A future question" }],
  ]),
};

function textAnswer(...values) {
  return { textAnswers: { answers: values.map((value) => ({ value })) } };
}

test("normalizes a Builds response by stable question ID", () => {
  const result = normalizeFormResponse({
    type: "build",
    metadata,
    fieldMap: { name: "q-name", phone: "q-phone", estimatedSize: "q-size", service: "q-work" },
    response: {
      responseId: "build-1",
      createTime: "2026-08-13T19:42:18Z",
      answers: {
        "q-name": textAnswer("Mendel Hecht"),
        "q-phone": textAnswer("347-555-0100"),
        "q-size": textAnswer("10 × 12 ft"),
        "q-work": textAnswer("Setup", "Takedown"),
      },
    },
  });

  assert.equal(result.type, "build");
  assert.equal(result.customer.name, "Mendel Hecht");
  assert.deepEqual(result.answers.service, ["Setup", "Takedown"]);
  assert.match(result.summary, /10 × 12 ft/);
});

test("normalizes a Rentals response with missing optional fields", () => {
  const result = normalizeFormResponse({
    type: "rental",
    metadata,
    fieldMap: { name: "q-name", estimatedSize: "q-size" },
    response: {
      responseId: "rental-1",
      lastSubmittedTime: "2026-08-13T20:00:00Z",
      answers: { "q-name": textAnswer("Rental Customer"), "q-size": textAnswer("12 × 16 ft") },
    },
  });

  assert.equal(result.customer.name, "Rental Customer");
  assert.equal(result.answers.estimatedSize, "12 × 16 ft");
  assert.equal(result.location, undefined);
});

test("preserves an unknown new form question without crashing", () => {
  const result = normalizeFormResponse({
    type: "build",
    metadata,
    fieldMap: { name: "q-name" },
    response: {
      responseId: "build-2",
      createTime: "2026-08-13T21:00:00Z",
      answers: { "q-name": textAnswer("Customer"), "q-unknown": textAnswer("New answer") },
    },
  });

  assert.equal(result.details.some((detail) => detail.label === "A future question"), true);
  assert.equal(result.answers["q-unknown"], undefined);
});

test("normalizes a Testimonials Sheet row", () => {
  const result = normalizeTestimonialRow({
    headers: ["Submitted at", "Submission ID", "Status", "Name", "Organization", "Verification contact", "Testimonial", "Publication consent", "Source page"],
    row: {
      rowNumber: 2,
      values: ["2026-08-13T22:00:00Z", "review-1", "Pending review", "Reviewer", "Community", "review@example.com", "A helpful and careful team.", "yes", "https://example.com/"],
    },
  });

  assert.equal(result.type, "testimonial");
  assert.equal(result.customer.email, "review@example.com");
  assert.equal(result.answers.status, "Pending review");
});
