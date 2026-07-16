const commonSteps = [
  {
    title: "Send the basics",
    text: "Share the type of work, useful measurements, timing, and photos when they help explain the space.",
  },
  {
    title: "Review the request",
    text: "Benyamin can follow up to confirm the scope, availability, and price before anything is scheduled.",
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
    secondaryAction: { label: "Open the Sukka Builder", href: "/sukka-builder/" },
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
    secondaryAction: { label: "View the gallery", href: "/gallery/" },
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
    secondaryAction: { label: "View the gallery", href: "/gallery/" },
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
    title: "Tree trimming for clearer outdoor spaces.",
    metaTitle: "Tree Trimming",
    description:
      "Describe the tree trimming, access, and cleanup details for your outdoor space.",
    summary:
      "Describe the branches or area that need attention, how the tree can be reached, and what cleanup you are asking about. Clear photos are especially helpful for an initial review.",
    heroPlaceholder: "Tree-trimming photo coming soon",
    primaryAction: { label: "Ask about tree trimming", href: "/contact/" },
    secondaryAction: { label: "View the gallery", href: "/gallery/" },
    highlights: [
      {
        title: "Begin with clear photos",
        text: "Include the full tree, the branches in question, and the space below them.",
      },
      {
        title: "Explain access",
        text: "Mention gates, narrow passages, nearby structures, or other access details.",
      },
      {
        title: "Discuss cleanup",
        text: "Include your cleanup expectations when describing the requested work.",
      },
    ],
    requestItems: [
      "Wide and close photos of the tree",
      "The branches or area you want reviewed",
      "Access to the yard or work area",
      "Cleanup expectations and preferred timing",
    ],
    mediaPlaceholders: [
      "Before trimming",
      "After trimming",
      "Cleanup example",
    ],
    steps: commonSteps,
  },
  "eruv-work": {
    slug: "eruv-work",
    eyebrow: "Eruv work",
    title: "Eruv checking, setup, repair, and maintenance.",
    metaTitle: "Eruv Work",
    description:
      "Ask about eruv checking, setup, repair, or maintenance and share the relevant details.",
    summary:
      "Requests may include checking, setup, repair, or maintenance. Share the exact location, the condition you have noticed, and any instructions or requirements relevant to the work.",
    heroPlaceholder: "Eruv work photo coming soon",
    primaryAction: { label: "Ask about eruv work", href: "/contact/" },
    secondaryAction: { label: "View the gallery", href: "/gallery/" },
    highlights: [
      {
        title: "Describe the exact need",
        text: "Explain whether the request concerns checking, setup, repair, or maintenance.",
      },
      {
        title: "Include reference photos",
        text: "Clear close and wide photos help identify the location and condition.",
      },
      {
        title: "Share requirements",
        text: "Include any local instructions or other requirements when making the request.",
      },
    ],
    requestItems: [
      "The exact location of the work",
      "A clear description of the issue or request",
      "Close and wide reference photos",
      "Any relevant instructions, contacts, or timing needs",
    ],
    mediaPlaceholders: [
      "Eruv line detail",
      "Repair example",
      "Maintenance work",
    ],
    steps: commonSteps,
  },
};

export const services = Object.values(servicesBySlug);
