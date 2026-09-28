/**
 * One-click starter layouts. These exist to make the "wow, that's fast" moment
 * happen in the first 10 seconds — a judge shouldn't have to click through
 * every category to see the tool do something interesting.
 */
export interface PersonaPlacement {
  catalogId: string;
  x: number;
  z: number;
}

export interface Persona {
  id: string;
  label: string;
  emoji: string;
  floor: PersonaPlacement[];
  /** desk-slot items go on the first desk placed above, in order */
  deskSlots: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: "freelance-dev",
    label: "Freelance Developer",
    emoji: "💻",
    floor: [
      { catalogId: "desk-standard", x: 1, z: 1 },
      { catalogId: "chair-ergonomic", x: 1, z: 2 },
      { catalogId: "break-plant", x: 4, z: 1 },
    ],
    deskSlots: ["monitor-27-4k", "acc-lamp", "acc-laptop-stand"],
  },
  {
    id: "trader",
    label: "Day Trader",
    emoji: "📈",
    floor: [
      { catalogId: "desk-wide", x: 1, z: 1 },
      { catalogId: "chair-executive", x: 2, z: 2 },
      { catalogId: "break-coffee", x: 5, z: 1 },
    ],
    deskSlots: ["monitor-34-curved", "monitor-24-fhd", "acc-lamp"],
  },
  {
    id: "creator",
    label: "Content Creator",
    emoji: "🎥",
    floor: [
      { catalogId: "desk-standard", x: 1, z: 1 },
      { catalogId: "chair-ergonomic", x: 1, z: 2 },
      { catalogId: "break-beanbag", x: 5, z: 3 },
    ],
    deskSlots: ["acc-webcam", "acc-lamp", "acc-laptop-stand"],
  },
];
