const definitions = [
  {
    type: "custom",
    sourceKey: "customSukkahs",
    label: "Custom Sukkahs",
    singularLabel: "Custom Sukkah",
    endpoint: "/api/form-submissions/custom-sukkah",
  },
  {
    type: "pergola",
    sourceKey: "pergolas",
    label: "Pergolas",
    singularLabel: "Pergola",
    endpoint: "/api/form-submissions/pergolas",
  },
  {
    type: "build",
    sourceKey: "builds",
    label: "Builds",
    singularLabel: "Build",
    endpoint: "/api/sukkah-submissions",
  },
  {
    type: "rental",
    sourceKey: "rentals",
    label: "Rentals",
    singularLabel: "Rental",
    endpoint: "/api/rental-submissions",
  },
  {
    type: "testimonial",
    sourceKey: "testimonials",
    label: "Testimonials",
    singularLabel: "Testimonial",
    endpoint: "/api/testimonial-submissions",
  },
];

export const FORM_DEFINITIONS = Object.freeze(definitions.map((definition) => Object.freeze(definition)));
export const FORM_TYPES = new Set(FORM_DEFINITIONS.map((definition) => definition.type));

export function getFormDefinition(type) {
  return FORM_DEFINITIONS.find((definition) => definition.type === type);
}

export function getFormDefinitionByEndpoint(endpoint) {
  return FORM_DEFINITIONS.find((definition) => definition.endpoint === endpoint);
}
