import { neighborhoods, states } from "../../data/form-options.js";

const FIELD_TYPES = new Set([
  "text", "email", "phone", "date", "textarea", "select", "radio", "checkboxes", "photos",
]);
const OPTION_FIELD_TYPES = new Set(["select", "radio", "checkboxes"]);
const CONDITION_OPERATORS = new Set(["equals", "includes"]);
const STEP_ICONS = new Set([
  "contact", "location", "timing", "sukkah", "site", "final",
  "phone", "home", "ruler", "tools", "message", "photo",
]);

const stateOptions = states.map(([code, name]) => `${name} (${code})`);
const neighborhoodOptions = [...neighborhoods, "Other"];

export const DEFAULT_CUSTOM_SUKKAH_FORM = {
  id: "custom-sukkah",
  slug: "custom-sukkah",
  title: "Custom Sukkah request",
  description: "Tell us about your space and the custom sukkah you have in mind.",
  submitLabel: "Request a custom quote",
  successTitle: "Your request was sent.",
  successMessage: "BK Sukkah will review the details and follow up with you.",
  steps: [
    {
      id: "contact",
      title: "Contact",
      icon: "contact",
      fields: [
        { id: "name", type: "text", label: "Name", required: true, autocomplete: "name" },
        { id: "phone", type: "phone", label: "Phone number", required: true, autocomplete: "tel" },
        { id: "email", type: "email", label: "Email address", required: false, autocomplete: "email" },
      ],
    },
    {
      id: "location",
      title: "Location",
      icon: "location",
      fields: [
        { id: "addressLine1", type: "text", label: "Street address", required: true, autocomplete: "address-line1" },
        { id: "city", type: "text", label: "City", required: true, autocomplete: "address-level2" },
        {
          id: "state", type: "select", label: "State", required: true,
          options: ["New York", "New Jersey", "Connecticut", "Other"],
        },
        {
          id: "newJerseyDetails", type: "textarea", label: "Tell us more about this New Jersey location", required: true,
          placeholder: "Share the town, neighborhood, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "state", operator: "equals", value: "New Jersey" },
        },
        { id: "postalCode", type: "text", label: "Zip code", required: true, autocomplete: "postal-code" },
        {
          id: "setting", type: "select", label: "Where will the sukkah be built?", required: true,
          options: ["Backyard", "Porch", "Courtyard", "Rooftop", "Other"],
        },
        {
          id: "settingOther", type: "text", label: "Describe the location", required: true,
          condition: { fieldId: "setting", operator: "equals", value: "Other" },
        },
        { id: "estimatedSize", type: "text", label: "Approximate size", required: true, placeholder: "For example, 10 × 12 ft" },
        { id: "sitePhotos", type: "photos", label: "Photos of the space", required: false, helpText: "Optional · Up to three JPG, PNG, or HEIC photos" },
      ],
    },
    {
      id: "project",
      title: "Your project",
      icon: "sukkah",
      fields: [
        {
          id: "framePreference", type: "radio", label: "Which frame are you considering?", required: true,
          options: ["Wood", "Metal", "Not sure"],
        },
        {
          id: "wallPreferences", type: "checkboxes", label: "Which wall options interest you?", required: false,
          options: ["Flexible covering", "Framed panels", "Wood lattice", "Horizontal siding", "Other", "Not sure"],
        },
        {
          id: "wallPreferencesOther", type: "text", label: "Tell us about the other wall option", required: true,
          condition: { fieldId: "wallPreferences", operator: "includes", value: "Other" },
        },
        {
          id: "features", type: "checkboxes", label: "Features you may want", required: false,
          options: ["Lighting", "Door or gate", "Windows or clear panels", "Furniture", "Greenery or decor", "Floor covering"],
        },
        { id: "projectNotes", type: "textarea", label: "Anything else we should know?", required: false, placeholder: "Share timing, access, design ideas, or special requests." },
      ],
    },
    { id: "review", title: "Review and send", icon: "final", fields: [] },
  ],
};

export const DEFAULT_PERGOLA_FORM = {
  id: "pergolas",
  slug: "pergolas",
  title: "Pergola request",
  description: "Tell us about the outdoor structure, shade, and finish you have in mind.",
  submitLabel: "Request a pergola quote",
  successTitle: "Your pergola request was sent.",
  successMessage: "BK Sukkah will review the details and follow up with you.",
  steps: [
    {
      id: "contact", title: "Contact", icon: "contact", fields: [
        { id: "name", type: "text", label: "Name", required: true, autocomplete: "name" },
        { id: "phone", type: "phone", label: "Phone number", required: true, autocomplete: "tel" },
        { id: "email", type: "email", label: "Email address", required: false, autocomplete: "email" },
      ],
    },
    {
      id: "location", title: "Location", icon: "location", fields: [
        { id: "addressLine1", type: "text", label: "Street address", required: true, autocomplete: "address-line1" },
        { id: "city", type: "text", label: "City", required: true, autocomplete: "address-level2" },
        { id: "state", type: "select", label: "State", required: true, autocomplete: "address-level1", options: stateOptions },
        {
          id: "newJerseyDetails", type: "textarea", label: "Tell us more about this New Jersey location", required: true,
          placeholder: "Share the town, neighborhood, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "state", operator: "equals", value: "New Jersey (NJ)" },
        },
        {
          id: "floridaDetails", type: "textarea", label: "Tell us more about this Florida location", required: true,
          placeholder: "Share the city, neighborhood, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "state", operator: "equals", value: "Florida (FL)" },
        },
        { id: "postalCode", type: "text", label: "Zip code", required: true, autocomplete: "postal-code" },
        { id: "neighborhood", type: "select", label: "Neighborhood", required: true, options: neighborhoodOptions },
        {
          id: "losAngelesDetails", type: "textarea", label: "Tell us more about this Los Angeles location", required: true,
          placeholder: "Share the neighborhood, city area, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "neighborhood", operator: "equals", value: "Los Angeles" },
        },
        { id: "neighborhoodOther", type: "text", label: "Other neighborhood", required: true, condition: { fieldId: "neighborhood", operator: "equals", value: "Other" } },
        { id: "estimatedSize", type: "text", label: "Approximate pergola size", required: true, placeholder: "For example, 12 × 16 ft" },
        { id: "setting", type: "select", label: "Where will the pergola be built?", required: true, options: ["Backyard", "Porch or deck", "Courtyard", "Rooftop or terrace", "Side yard", "Driveway", "Other"] },
        { id: "settingOther", type: "text", label: "Describe the location", required: true, condition: { fieldId: "setting", operator: "equals", value: "Other" } },
        { id: "siteDescription", type: "textarea", label: "Tell us about the site", required: false, placeholder: "Share access, nearby walls, grade changes, trees, or other site details." },
        { id: "sitePhotos", type: "photos", label: "Photos of the space", required: false, helpText: "Optional · Up to three JPG, PNG, or HEIC photos" },
      ],
    },
    {
      id: "structure", title: "Your structure", icon: "home", fields: [
        { id: "projectType", type: "radio", label: "What are you planning?", required: true, options: ["A new pergola", "An addition or conversion", "A repair or refresh", "Not sure yet"] },
        { id: "connection", type: "radio", label: "How should the pergola connect to the site?", required: true, options: ["Freestanding", "Attached to the house", "Partly attached and partly freestanding", "Surface-mounted without new ground excavation", "Not sure yet"] },
        { id: "framePreference", type: "radio", label: "Which frame direction interests you?", required: true, options: ["Wood", "Metal", "A combination", "Not sure yet"] },
        { id: "roofPreferences", type: "checkboxes", label: "Which roof or shade options interest you?", required: false, helpText: "Select everything that sounds useful.", options: ["Open slats", "Bamboo schach", "Fabric canopy", "Retractable tarp or shade", "Solid weather cover", "Custom roof detail", "Not sure yet"] },
        { id: "screenPreferences", type: "checkboxes", label: "Would you like screening or side details?", required: false, options: ["Open sides", "Wood slats", "Metal panels", "Fabric or cloth", "Lattice", "Clear panels", "Privacy screens", "Custom artwork or graphic panels", "Other"] },
        { id: "screenPreferencesOther", type: "text", label: "Tell us about the other side detail", required: true, condition: { fieldId: "screenPreferences", operator: "includes", value: "Other" } },
      ],
    },
    {
      id: "finishing", title: "Finishing touches", icon: "tools", fields: [
        { id: "features", type: "checkboxes", label: "Which additions should we consider?", required: false, options: ["Lighting", "Electrical outlets", "Fan or heater", "Curtains or shades", "Gate or door", "Built-in seating", "Counter or serving area", "Planters or greenery", "Storage", "Custom artwork", "Other"] },
        { id: "featuresOther", type: "text", label: "Tell us about another addition", required: true, condition: { fieldId: "features", operator: "includes", value: "Other" } },
        { id: "finishPreference", type: "checkboxes", label: "Which finish details matter to you?", required: false, options: ["Natural wood look", "Painted or stained color", "Powder-coated metal", "Low-maintenance materials", "Match the house", "Not sure yet"] },
        { id: "projectNotes", type: "textarea", label: "Anything else we should know?", required: false, placeholder: "Share design references, artwork ideas, access concerns, or special requests." },
      ],
    },
    {
      id: "timing", title: "Timing", icon: "timing", fields: [
        { id: "preferredStartDate", type: "date", label: "Preferred project start date", required: false },
        { id: "timingNotes", type: "text", label: "Timing notes", required: false, placeholder: "Any seasonal or scheduling preferences" },
      ],
    },
    { id: "review", title: "Review and send", icon: "final", fields: [
      { id: "comments", type: "textarea", label: "Comments or questions", required: false, placeholder: "Add any details that did not fit above." },
    ] },
  ],
};

export const DEFAULT_BUILD_FORM = {
  id: "builds",
  slug: "builds",
  title: "Build request",
  description: "Share your sukkah setup, location, timing, and site details.",
  submitLabel: "Request a quote",
  successTitle: "Your request was sent.",
  successMessage: "BK Sukkah will review the details and follow up with you.",
  steps: [
    {
      id: "contact", title: "Contact", icon: "contact", fields: [
        { id: "name", type: "text", label: "Name", required: true, autocomplete: "name" },
        { id: "phone", type: "phone", label: "Phone number", required: true, autocomplete: "tel" },
        { id: "email", type: "email", label: "Email address", required: false, autocomplete: "email" },
      ],
    },
    {
      id: "location", title: "Location", icon: "location", fields: [
        { id: "addressLine1", type: "text", label: "Street address", required: true, autocomplete: "address-line1" },
        { id: "city", type: "text", label: "City", required: true, autocomplete: "address-level2" },
        { id: "state", type: "select", label: "State", required: true, autocomplete: "address-level1", options: stateOptions },
        {
          id: "newJerseyDetails", type: "textarea", label: "Tell us more about this New Jersey location", required: true,
          placeholder: "Share the town, neighborhood, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "state", operator: "equals", value: "New Jersey (NJ)" },
        },
        {
          id: "floridaDetails", type: "textarea", label: "Tell us more about this Florida location", required: true,
          placeholder: "Share the city, neighborhood, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "state", operator: "equals", value: "Florida (FL)" },
        },
        { id: "postalCode", type: "text", label: "Zip code", required: true, autocomplete: "postal-code" },
        { id: "neighborhood", type: "select", label: "Neighborhood", required: true, options: neighborhoodOptions },
        {
          id: "losAngelesDetails", type: "textarea", label: "Tell us more about this Los Angeles location", required: true,
          placeholder: "Share the neighborhood, city area, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "neighborhood", operator: "equals", value: "Los Angeles" },
        },
        { id: "neighborhoodOther", type: "text", label: "Other neighborhood", required: true, condition: { fieldId: "neighborhood", operator: "equals", value: "Other" } },
        { id: "estimatedSize", type: "text", label: "Approximate sukkah size", required: true, placeholder: "For example, 10 × 12 ft" },
        { id: "siteDescription", type: "textarea", label: "Where will the sukkah be built?", required: false, placeholder: "Backyard, patio, driveway, rooftop, balcony, etc." },
        { id: "sitePhotos", type: "photos", label: "Photos of the space", required: false, helpText: "Optional · Up to three JPG, PNG, or HEIC photos" },
      ],
    },
    {
      id: "timing", title: "Timing", icon: "timing", fields: [
        { id: "buildDate", type: "date", label: "Preferred setup date", required: true },
        { id: "takeDownDate", type: "date", label: "Preferred takedown date", required: true },
        { id: "timingNotes", type: "text", label: "Timing notes", required: false, placeholder: "Any timing preferences or scheduling details" },
      ],
    },
    {
      id: "requested-work", title: "Requested work", icon: "site", fields: [
        { id: "service", type: "checkboxes", label: "What do you need help with?", required: true, helpText: "Select everything that applies.", options: ["Bring out of storage", "Build", "Take down", "Bring to storage", "Other"] },
        { id: "serviceOther", type: "text", label: "Other requested work", required: true, condition: { fieldId: "service", operator: "includes", value: "Other" } },
        { id: "bringToStorageDate", type: "date", label: "Bring-to-storage date", required: true, condition: { fieldId: "service", operator: "includes", value: "Bring to storage" } },
        { id: "extraLabor", type: "checkboxes", label: "Special access or extra labor", required: false, helpText: "For example, a rooftop sukkah or unusual access.", options: ["Yes"] },
        { id: "extraServiceDetails", type: "textarea", label: "What extra help is needed?", required: true, condition: { fieldId: "extraLabor", operator: "includes", value: "Yes" } },
      ],
    },
    {
      id: "sukkah", title: "Your sukkah", icon: "sukkah", fields: [
        { id: "sukkahType", type: "select", label: "Sukkah type", required: true, options: ["Canvas", "Canvas Bingo", "Snap / panel", "Wood boards with bolts", "Schach and beams only", "Other"] },
        { id: "sukkahTypeOther", type: "text", label: "Other sukkah type", required: true, condition: { fieldId: "sukkahType", operator: "equals", value: "Other" } },
        { id: "schach", type: "checkboxes", label: "Schach type", required: true, helpText: "Select one or more options.", options: ["Bamboo mat", "Bamboo sticks", "Evergreen", "Other"] },
        { id: "schachOther", type: "text", label: "Other schach type", required: true, condition: { fieldId: "schach", operator: "includes", value: "Other" } },
        { id: "addOns", type: "checkboxes", label: "Optional add-ons", required: false, options: ["Different style lighting", "Evergreen schach", "Pressure wash area day before", "Other"] },
        { id: "addOnsOther", type: "text", label: "Other add-on", required: true, condition: { fieldId: "addOns", operator: "includes", value: "Other" } },
      ],
    },
    {
      id: "review", title: "Review and send", icon: "final", fields: [
        { id: "referral", type: "text", label: "How did you hear about us?", required: true },
        { id: "comments", type: "textarea", label: "Comments or questions", required: false, placeholder: "Add any details that did not fit above." },
      ],
    },
  ],
};

export const DEFAULT_RENTAL_FORM = {
  id: "rentals",
  slug: "rentals",
  title: "Sukkah rental request",
  description: "Share a few details and we’ll follow up with availability and pricing.",
  submitLabel: "Request availability",
  successTitle: "Your rental request was sent.",
  successMessage: "BK Sukkah will review the details and follow up with you.",
  steps: [
    {
      id: "contact", title: "Contact", icon: "contact", fields: [
        { id: "name", type: "text", label: "Name", required: true, autocomplete: "name" },
        { id: "phone", type: "phone", label: "Phone number", required: true, autocomplete: "tel" },
        { id: "email", type: "email", label: "Email address", required: false, autocomplete: "email" },
      ],
    },
    {
      id: "location", title: "Location", icon: "location", fields: [
        { id: "addressLine1", type: "text", label: "Street address", required: true, autocomplete: "address-line1" },
        { id: "city", type: "text", label: "City", required: true, autocomplete: "address-level2" },
        { id: "state", type: "select", label: "State", required: true, autocomplete: "address-level1", options: stateOptions },
        {
          id: "newJerseyDetails", type: "textarea", label: "Tell us more about this New Jersey location", required: true,
          placeholder: "Share the town, neighborhood, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "state", operator: "equals", value: "New Jersey (NJ)" },
        },
        {
          id: "floridaDetails", type: "textarea", label: "Tell us more about this Florida location", required: true,
          placeholder: "Share the city, neighborhood, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "state", operator: "equals", value: "Florida (FL)" },
        },
        { id: "postalCode", type: "text", label: "Zip code", required: true, autocomplete: "postal-code" },
        { id: "neighborhood", type: "select", label: "Neighborhood", required: true, options: neighborhoodOptions },
        {
          id: "losAngelesDetails", type: "textarea", label: "Tell us more about this Los Angeles location", required: true,
          placeholder: "Share the neighborhood, city area, or any nearby landmarks that will help us plan.",
          condition: { fieldId: "neighborhood", operator: "equals", value: "Los Angeles" },
        },
        { id: "neighborhoodOther", type: "text", label: "Other neighborhood", required: true, condition: { fieldId: "neighborhood", operator: "equals", value: "Other" } },
        { id: "estimatedSize", type: "text", label: "Approximate sukkah size", required: true, placeholder: "For example, 10 × 12 ft" },
        { id: "siteDescription", type: "textarea", label: "Where will the sukkah be built?", required: false, placeholder: "Backyard, patio, driveway, rooftop, balcony, etc." },
        { id: "sitePhotos", type: "photos", label: "Photos of the space", required: false, helpText: "Optional · Up to three JPG, PNG, or HEIC photos" },
      ],
    },
    {
      id: "timing", title: "Timing", icon: "timing", fields: [
        { id: "buildDay", type: "date", label: "Preferred setup date", required: true },
        { id: "takeDownDay", type: "date", label: "Preferred takedown date", required: true },
        { id: "timingNotes", type: "text", label: "Timing notes", required: false, placeholder: "Any timing preferences or scheduling details" },
      ],
    },
    {
      id: "extras", title: "Extras", icon: "sukkah", fields: [
        { id: "tarpStyle", type: "radio", label: "Which tarp style would you like to discuss?", required: true, helpText: "Choose a direction from the rental examples above.", options: ["White", "Blue", "Beige woven", "Soft fabric", "Not sure yet"] },
        { id: "addOns", type: "checkboxes", label: "Additional services", required: false, options: ["Different style lighting", "Furniture", "Evergreen schach", "Pressure wash area day before", "Other"] },
        { id: "furnitureDetails", type: "textarea", label: "Which furniture and chairs would you like?", required: true, placeholder: "For example, folding chairs for 12 guests and one table.", condition: { fieldId: "addOns", operator: "includes", value: "Furniture" } },
        { id: "addOnsOther", type: "text", label: "Other service", required: true, placeholder: "Tell us what you need", condition: { fieldId: "addOns", operator: "includes", value: "Other" } },
      ],
    },
    {
      id: "review", title: "Review and send", icon: "final", fields: [
        { id: "comments", type: "textarea", label: "Comments or special requests", required: true },
        { id: "questions", type: "textarea", label: "Your question", required: false },
      ],
    },
  ],
};

function cloneSchema(schema) {
  return JSON.parse(JSON.stringify(schema));
}

export const DEFAULT_PURCHASE_FORM = (() => {
  const form = cloneSchema(DEFAULT_RENTAL_FORM);
  form.id = "purchases";
  form.slug = "purchases";
  form.title = "Buy";
  form.description = "Tell us what you are looking to purchase and we’ll follow up with availability and pricing.";
  form.submitLabel = "Request a purchase quote";
  form.successTitle = "Your purchase request was sent.";
  form.steps = form.steps.map((step) => {
    if (step.id === "timing") {
      return {
        ...step,
        title: "Delivery and setup",
        fields: [
          { id: "deliveryDate", type: "date", label: "Preferred delivery or setup date", required: true },
          { id: "timingNotes", type: "text", label: "Timing notes", required: false, placeholder: "Any delivery, setup, or scheduling preferences" },
        ],
      };
    }
    if (step.id === "extras") {
      return {
        ...step,
        id: "options",
        title: "Purchase options",
        fields: [
          {
            id: "sukkahType", type: "select", label: "What type of sukkah are you looking to purchase?", required: true,
            options: ["Canvas", "Canvas Bingo", "Snap / panel", "Wood boards with bolts", "Schach and beams only", "Not sure yet", "Other"],
          },
          { id: "sukkahTypeOther", type: "text", label: "Tell us about the sukkah type you have in mind", required: true, condition: { fieldId: "sukkahType", operator: "equals", value: "Other" } },
          { id: "framePreference", type: "radio", label: "Which frame material interests you?", required: true, options: ["Wood", "Metal", "Not sure yet"] },
          { id: "schach", type: "checkboxes", label: "Which schach options interest you?", required: true, helpText: "Select everything you would like us to consider.", options: ["Bamboo mat", "Bamboo sticks", "Evergreen", "Not sure yet"] },
          { id: "addOns", type: "checkboxes", label: "Which additions should we include in the conversation?", required: false, options: ["Different style lighting", "Furniture", "Evergreen schach", "Floor covering", "Storage", "Other"] },
          { id: "furnitureDetails", type: "textarea", label: "Which furniture and chairs would you like?", required: true, placeholder: "For example, folding chairs for 12 guests and one table.", condition: { fieldId: "addOns", operator: "includes", value: "Furniture" } },
          { id: "addOnsOther", type: "text", label: "Tell us about another addition", required: true, placeholder: "Tell us what you need", condition: { fieldId: "addOns", operator: "includes", value: "Other" } },
        ],
      };
    }
    if (step.id === "review") {
      return {
        ...step,
        fields: [
          { id: "comments", type: "textarea", label: "Comments or special requests", required: false, placeholder: "Add any details that did not fit above." },
          { id: "questions", type: "textarea", label: "Your question", required: false, placeholder: "What would you like to know about purchasing a sukkah?" },
        ],
      };
    }
    return step;
  });
  return form;
})();

export const DEFAULT_MANAGED_FORMS = Object.freeze([
  DEFAULT_BUILD_FORM,
  DEFAULT_RENTAL_FORM,
  DEFAULT_CUSTOM_SUKKAH_FORM,
  DEFAULT_PERGOLA_FORM,
  DEFAULT_PURCHASE_FORM,
]);

function clean(value, maximum = 4000) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, maximum);
}

function cleanId(value, fallback = "") {
  const id = clean(value, 80).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return id || fallback;
}

function cleanSlug(value) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function defaultStepIcon(stepId, title) {
  const value = `${stepId} ${title}`.toLowerCase();
  if (value.includes("contact")) return "contact";
  if (value.includes("location")) return "location";
  if (value.includes("timing") || value.includes("date")) return "timing";
  if (value.includes("review") || value.includes("final")) return "final";
  if (value.includes("sukkah") || value.includes("project") || value.includes("extra")) return "sukkah";
  return "site";
}

function normalizeCondition(condition, knownIds, sourceTypes) {
  if (!condition || typeof condition !== "object") return undefined;
  const fieldId = cleanId(condition.fieldId);
  const operator = clean(condition.operator, 20);
  const value = clean(condition.value, 200);
  if (!knownIds.has(fieldId) || !CONDITION_OPERATORS.has(operator) || !value) return undefined;
  const sourceType = sourceTypes.get(fieldId);
  if (operator === "includes" && sourceType !== "checkboxes") return undefined;
  if (operator === "equals" && sourceType === "checkboxes") return undefined;
  return { fieldId, operator, value };
}

export function normalizeFormSchema(input, { allowMissingIdentity = false } = {}) {
  if (!input || typeof input !== "object") return { ok: false, message: "The form definition could not be read." };
  const id = cleanId(input.id);
  const slug = cleanSlug(input.slug);
  const title = clean(input.title, 120);
  if ((!id && !allowMissingIdentity) || !slug || !title) {
    return { ok: false, message: "Every form needs a name and URL." };
  }
  if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > 12) {
    return { ok: false, message: "A form must have between 1 and 12 steps." };
  }

  const allFieldIds = new Set();
  const sourceTypes = new Map();
  const rawFields = input.steps.flatMap((step) => Array.isArray(step?.fields) ? step.fields : []);
  if (rawFields.length > 80) return { ok: false, message: "A form can contain no more than 80 fields." };
  for (const field of rawFields) {
    const fieldId = cleanId(field?.id);
    if (!fieldId || allFieldIds.has(fieldId)) return { ok: false, message: "Every question needs a unique internal name." };
    allFieldIds.add(fieldId);
    sourceTypes.set(fieldId, clean(field?.type, 30));
  }

  const knownIds = new Set();
  const stepIds = new Set();
  const steps = [];
  for (let stepIndex = 0; stepIndex < input.steps.length; stepIndex += 1) {
    const rawStep = input.steps[stepIndex] || {};
    const stepId = cleanId(rawStep.id, `step-${stepIndex + 1}`);
    const stepTitle = clean(rawStep.title, 100);
    if (!stepTitle || stepIds.has(stepId)) return { ok: false, message: "Every step needs a unique name." };
    stepIds.add(stepId);
    const fields = [];
    for (const rawField of Array.isArray(rawStep.fields) ? rawStep.fields : []) {
      const type = clean(rawField.type, 30);
      const label = clean(rawField.label, 180);
      if (!FIELD_TYPES.has(type) || !label) return { ok: false, message: "Every question needs a supported type and label." };
      const field = {
        id: cleanId(rawField.id), type, label, required: Boolean(rawField.required),
        ...(clean(rawField.helpText, 500) ? { helpText: clean(rawField.helpText, 500) } : {}),
        ...(clean(rawField.placeholder, 300) ? { placeholder: clean(rawField.placeholder, 300) } : {}),
        ...(clean(rawField.autocomplete, 80) ? { autocomplete: clean(rawField.autocomplete, 80) } : {}),
      };
      if (OPTION_FIELD_TYPES.has(type)) {
        const options = [...new Set((Array.isArray(rawField.options) ? rawField.options : [])
          .map((option) => clean(option, 160)).filter(Boolean))];
        if (options.length < 1 || options.length > 40) return { ok: false, message: `“${label}” needs between 1 and 40 unique options.` };
        field.options = options;
      }
      const condition = normalizeCondition(rawField.condition, knownIds, sourceTypes);
      if (rawField.condition && !condition) return { ok: false, message: `The display rule for “${label}” is incomplete.` };
      if (condition?.fieldId === field.id) return { ok: false, message: `“${label}” cannot depend on itself.` };
      if (condition) field.condition = condition;
      fields.push(field);
      knownIds.add(field.id);
    }
    const icon = clean(rawStep.icon, 30);
    steps.push({ id: stepId, title: stepTitle, icon: STEP_ICONS.has(icon) ? icon : defaultStepIcon(stepId, stepTitle), fields });
  }

  return {
    ok: true,
    schema: {
      id: id || slug,
      slug,
      title,
      description: clean(input.description, 500),
      submitLabel: clean(input.submitLabel, 80) || "Send request",
      successTitle: clean(input.successTitle, 120) || "Your request was sent.",
      successMessage: clean(input.successMessage, 500) || "We will review the details and follow up with you.",
      steps,
    },
  };
}

export function fieldIsVisible(field, answers) {
  if (!field.condition) return true;
  const answer = answers[field.condition.fieldId];
  if (field.condition.operator === "includes") return Array.isArray(answer) && answer.includes(field.condition.value);
  return String(answer ?? "") === field.condition.value;
}

export const SUPPORTED_FORM_FIELD_TYPES = Object.freeze([...FIELD_TYPES]);
export const SUPPORTED_FORM_STEP_ICONS = Object.freeze([...STEP_ICONS]);
