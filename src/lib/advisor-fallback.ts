import type { AdvisorSuggestion } from "./types";

/**
 * Deterministic keyword-based advisor used whenever the AI call is
 * unavailable (no API key, free-tier quota exhausted, network error). This
 * keeps the "AI advisor" feature demoable even without any credentials —
 * it just won't be as nuanced as the real model.
 */
export function fallbackAdvise(prompt: string): AdvisorSuggestion {
  const p = prompt.toLowerCase();

  if (/(trad|finance|stock|chart)/.test(p)) {
    return {
      message:
        "For multi-chart trading you'll want maximum screen real estate: a wide desk with a curved ultrawide plus a second monitor, and a chair you can sit in all day.",
      suggestedItemIds: ["desk-wide", "chair-executive", "monitor-34-curved", "monitor-24-fhd", "acc-lamp"],
    };
  }

  if (/(video|content|stream|podcast|call|camera)/.test(p)) {
    return {
      message:
        "For calls and content, prioritize how you look and sound: a webcam, a lamp for even lighting, and a laptop stand to get the camera angle right.",
      suggestedItemIds: ["desk-standard", "chair-ergonomic", "acc-webcam", "acc-lamp", "acc-laptop-stand"],
    };
  }

  if (/(back|posture|pain|ergonom|health)/.test(p)) {
    return {
      message:
        "Comfort first: an adjustable-height desk so you can alternate sitting and standing, paired with a proper ergonomic chair.",
      suggestedItemIds: ["desk-standard", "chair-ergonomic", "acc-lamp"],
    };
  }

  if (/(code|develop|program|software|engineer)/.test(p)) {
    return {
      message:
        "A solid dev setup: a 4K monitor for more vertical space, a comfortable chair, and a keyboard you'll enjoy typing on all day.",
      suggestedItemIds: ["desk-standard", "chair-ergonomic", "monitor-27-4k", "acc-keyboard", "acc-lamp"],
    };
  }

  return {
    message:
      "Here's a solid all-around starting point — a standard adjustable desk, an ergonomic chair, and a monitor to get you going.",
    suggestedItemIds: ["desk-standard", "chair-ergonomic", "monitor-24-fhd"],
  };
}
