const commonSteps = [
  {
    title: "Send the basics",
    text: "Share the type of work, useful measurements, timing, and photos when they help explain the space.",
  },
  {
    title: "Review the request",
    text: "BK Sukkah can follow up to confirm the scope, availability, and price before anything is scheduled.",
  },
  {
    title: "Agree on the next step",
    text: "Once the details are clear, decide whether and when to move ahead with the work.",
  },
];

export const servicesBySlug = {
  "sukkah-rentals": {
    slug: "sukkah-rentals",
    eyebrow: "Sukkah rentals",
    title: "A practical rental option for Sukkos.",
    metaTitle: "Sukkah Rentals",
    description:
      "Ask about sukkah rental availability, sizing, delivery, setup, and takedown.",
    summary:
      "Ask about seasonal rental options, available sizes, delivery, setup, and takedown. Exact choices and pricing are confirmed directly before scheduling.",
    heroPlaceholder: "Rental sukkah photo coming soon",
    primaryAction: { label: "Ask about rentals", href: "/contact/" },
    secondaryAction: { label: "Builds", href: "/sukka-builder/" },
    highlights: [
      {
        title: "Check availability first",
        text: "Rental options depend on timing and the details of each request.",
      },
      {
        title: "Share useful measurements",
        text: "Approximate length, width, and photos help start a clearer conversation.",
      },
      {
        title: "Include the full request",
        text: "Mention whether you are asking about delivery, setup, takedown, or a combination.",
      },
    ],
    requestItems: [
      "Approximate sukkah size",
      "The address and a description of the setup area",
      "Preferred setup and takedown timing",
      "Photos of the space, especially when access is tight",
    ],
    mediaPlaceholders: [
      "Rental sukkah exterior",
      "Rental sukkah interior",
      "Delivery and setup example",
    ],
    steps: commonSteps,
  },
  "custom-sukkahs": {
    slug: "custom-sukkahs",
    eyebrow: "Custom sukkahs",
    title: "A sukkah shaped around your space.",
    metaTitle: "Custom Sukkahs",
    description:
      "Discuss a custom sukkah for an unusual size, roofline, or outdoor space.",
    summary:
      "Custom requests can account for unusual dimensions, rooflines, access, and other site conditions. Start by sharing the space and what you hope to build.",
    heroPlaceholder: "Custom sukkah photo coming soon",
    primaryAction: { label: "Discuss a custom sukkah", href: "/contact/" },
    highlights: [
      {
        title: "Start with the space",
        text: "Measurements and clear photos help explain unusual dimensions or obstacles.",
      },
      {
        title: "Describe the goal",
        text: "Share the size, materials, features, and setup you have in mind.",
      },
      {
        title: "Confirm the scope",
        text: "The final plan and price should be clear before work is scheduled.",
      },
    ],
    requestItems: [
      "Length, width, and any height restrictions",
      "Photos of the full area and nearby access",
      "The sukkah type or materials you are considering",
      "Preferred timing and any important site details",
    ],
    mediaPlaceholders: [
      "Completed custom sukkah",
      "Site measurements and access",
      "Before-and-after example",
    ],
    steps: commonSteps,
  },
  pergolas: {
    slug: "pergolas",
    eyebrow: "Pergolas",
    title: "Pergola work for outdoor shade and structure.",
    metaTitle: "Pergolas",
    description:
      "Ask about a pergola build, repair, or improvement for an outdoor space.",
    summary:
      "Share whether you are considering a new pergola, a repair, or another improvement to an outdoor shade structure. Photos and measurements make the request easier to review.",
    heroPlaceholder: "Pergola project photo coming soon",
    primaryAction: { label: "Ask about pergola work", href: "/contact/" },
    highlights: [
      {
        title: "New work or repair",
        text: "Explain whether the request is for a new structure or an existing pergola.",
      },
      {
        title: "Measurements matter",
        text: "Approximate dimensions provide a useful starting point for the conversation.",
      },
      {
        title: "Show the surroundings",
        text: "Wide photos help show access, nearby walls, trees, and other site conditions.",
      },
    ],
    requestItems: [
      "Whether the pergola is new or already standing",
      "Approximate dimensions",
      "Photos of the structure and surrounding area",
      "The change or result you are looking for",
    ],
    mediaPlaceholders: [
      "Completed pergola",
      "Pergola repair detail",
      "Outdoor shade example",
    ],
    steps: commonSteps,
  },
  "tree-trimming": {
    slug: "tree-trimming",
    eyebrow: "Tree trimming",
    title: "Make room for a kosher sukkah site.",
    metaTitle: "Tree Trimming",
    description:
      "Tree trimming for a location where branches or a full tree can make a sukkah site unsuitable.",
    summary:
      "If a tree makes a planned sukkah location unsuitable for a kosher sukkah, we can help assess the trimming work—from small branches and big branches to full trees. Contact today.",
    heroNote: "A clear site comes first.",
    showMedia: false,
    primaryAction: { label: "Contact today", href: "/contact/" },
    highlights: [
      {
        title: "Small branches",
        text: "Remove smaller growth that reaches into the planned sukkah area or affects the usable space.",
      },
      {
        title: "Big branches",
        text: "Plan the careful trimming needed when larger limbs change the space, access, or placement.",
      },
      {
        title: "Full trees",
        text: "Discuss the site when a whole tree needs attention before the sukkah location can be considered.",
      },
    ],
    requestItems: [
      "The planned sukkah location",
      "Which branches or trees need attention",
      "The access and clearance around the site",
      "Any rabbinic guidance already provided",
    ],
    mediaPlaceholders: [],
    steps: [
      { title: "Share the location", text: "Tell us where the sukkah is planned and what currently makes the space unsuitable." },
      { title: "Review the trimming", text: "We can discuss the scale of the work, access, and practical clearance around the site." },
      { title: "Confirm the next step", text: "Contact today to review timing and the work needed before the sukkah placement is finalized." },
    ],
  },
  "eruv-work": {
    slug: "eruv-work",
    eyebrow: "Eruv work",
    title: "When the sukkah is outside the eruv.",
    metaTitle: "Eruv Work",
    description:
      "Practical eruv work for sukkah locations that are not enclosed by an eruv.",
    summary:
      "A sukkah that is not enclosed by an eruv needs careful attention to the site and its requirements. We work with highly qualified rabbonim and carry out the practical work to a high standard.",
    heroNote: "Guided by qualified rabbinic direction.",
    showMedia: false,
    primaryAction: { label: "Contact today", href: "/contact/" },
    highlights: [
      {
        title: "Start with the location",
        text: "The exact sukkah site and its surroundings help frame the practical eruv question.",
      },
      {
        title: "Work with rabbonim",
        text: "We work with highly qualified rabbonim so the practical plan follows the direction for the community.",
      },
      {
        title: "A high standard",
        text: "The work is approached carefully, with attention to the details that affect the finished site.",
      },
    ],
    requestItems: [
      "The exact sukkah location",
      "The current eruv or enclosure situation",
      "Any rabbinic direction already provided",
      "The timing and access details for the work",
    ],
    mediaPlaceholders: [],
    steps: [
      { title: "Share the site", text: "Tell us where the sukkah is planned and what you know about the current eruv boundary." },
      { title: "Review the guidance", text: "We coordinate the practical work around the direction provided by highly qualified rabbonim." },
      { title: "Complete the work carefully", text: "The goal is a clear, high-standard result that respects the requirements for the site." },
    ],
  },
};

export const services = Object.values(servicesBySlug);
