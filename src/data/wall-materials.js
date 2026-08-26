export const wallMaterials = Object.freeze([
  {
    name: "Reinforced polyethylene",
    description: "A woven utility tarp with a finished hem and metal grommets.",
    image: "/assets/images/material-reinforced-polyethylene.jpg",
    alt: "Close view of reinforced woven polyethylene tarp material with metal grommets",
  },
  {
    name: "Two-tone canvas walls",
    description: "A completed canvas-wall sukkah with a framed doorway.",
    image: "/assets/images/material-two-tone-canvas-walls.jpg",
    alt: "Completed sukkah with two-tone canvas walls and a framed entrance",
  },
  {
    name: "Woven polyethylene",
    description: "A tightly woven wall material with reinforced corners and grommets.",
    image: "/assets/images/material-woven-polyethylene.jpg",
    alt: "Close view of woven polyethylene material with a reinforced corner and grommet",
  },
  {
    name: "Reinforced canvas",
    description: "A dense canvas weave with stitched hems and a metal grommet.",
    image: "/assets/images/material-reinforced-canvas.jpg",
    alt: "Close view of reinforced canvas with stitched hems and a metal grommet",
  },
  {
    name: "Heavy-duty vinyl",
    description: "A smooth coated wall material with reinforced edges.",
    image: "/assets/images/material-heavy-duty-vinyl.jpg",
    alt: "Close view of smooth heavy-duty vinyl wall material with a reinforced edge",
  },
  {
    name: "Knitted mesh",
    description: "An open knitted screen material that allows filtered light and airflow.",
    image: "/assets/images/material-knitted-mesh.jpg",
    alt: "Close view of open knitted mesh material with a metal grommet",
  },
  {
    name: "Windowed fabric walls",
    description: "Fabric wall panels with framed window and doorway details.",
    image: "/assets/images/material-window-panel-walls.jpg",
    alt: "Fabric sukkah walls with framed window and doorway details",
  },
  {
    name: "Wood lattice panels",
    description: "Open crossed-wood panels that provide airflow and partial screening.",
    image: "/assets/images/material-wood-lattice-panel.jpg",
    alt: "Close view of open crossed-wood lattice wall panels",
  },
]);

export const wallMaterialOptions = Object.freeze([
  ...wallMaterials.map(({ name }) => name),
  "Not sure yet",
]);
