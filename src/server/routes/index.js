import { getFormDefinitionByEndpoint } from "../forms/registry.js";
import { handleBuildSubmission } from "./build-submissions.js";
import { handleRentalSubmission } from "./rental-submissions.js";
import { handleTestimonialSubmission } from "./testimonial-submissions.js";

const handlers = {
  build: handleBuildSubmission,
  rental: handleRentalSubmission,
  testimonial: handleTestimonialSubmission,
};

export function submissionHandlerForPath(pathname) {
  const definition = getFormDefinitionByEndpoint(pathname);
  return definition ? handlers[definition.type] : undefined;
}
