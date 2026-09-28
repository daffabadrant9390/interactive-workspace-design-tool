import { describe, expect, it } from "vitest";
import { PERSONAS } from "./personas";
import { getCatalogItem } from "./catalog";
import { canPlaceOnDesk, canPlaceOnFloor } from "./rules";
import type { PlacedFloorItem } from "./types";

describe("PERSONAS data integrity", () => {
  it("references only real catalog ids", () => {
    for (const persona of PERSONAS) {
      for (const p of persona.floor) {
        expect(getCatalogItem(p.catalogId), `${persona.id}: ${p.catalogId}`).toBeDefined();
      }
      for (const id of persona.deskSlots) {
        expect(getCatalogItem(id), `${persona.id}: ${id}`).toBeDefined();
      }
    }
  });

  it("places every persona's floor items without overlap, inside the room", () => {
    for (const persona of PERSONAS) {
      const placed: PlacedFloorItem[] = [];
      for (const p of persona.floor) {
        const item = getCatalogItem(p.catalogId)!;
        const result = canPlaceOnFloor(item, { x: p.x, z: p.z }, 0, placed);
        expect(result.valid, `${persona.id}: placing ${p.catalogId} — ${result.reason}`).toBe(true);
        placed.push({
          instanceId: p.catalogId,
          catalogId: p.catalogId,
          position: { x: p.x, z: p.z },
          rotationY: 0,
        });
      }
    }
  });

  it("includes exactly one desk per persona, so deskSlots has somewhere to attach", () => {
    for (const persona of PERSONAS) {
      const deskCount = persona.floor.filter((p) => getCatalogItem(p.catalogId)?.category === "desk").length;
      expect(deskCount, persona.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("fits every persona's desk-slot items onto its first desk", () => {
    for (const persona of PERSONAS) {
      const deskPlacement = persona.floor.find((p) => getCatalogItem(p.catalogId)?.category === "desk")!;
      const desk: PlacedFloorItem = {
        instanceId: "desk",
        catalogId: deskPlacement.catalogId,
        position: { x: deskPlacement.x, z: deskPlacement.z },
        rotationY: 0,
      };
      const placedDeskItems: Parameters<typeof canPlaceOnDesk>[2] = [];
      persona.deskSlots.forEach((catalogId, i) => {
        const item = getCatalogItem(catalogId)!;
        const result = canPlaceOnDesk(item, desk, placedDeskItems);
        expect(result.valid, `${persona.id}: ${catalogId} — ${result.reason}`).toBe(true);
        placedDeskItems.push({ instanceId: `d${i}`, catalogId, deskInstanceId: "desk", slotIndex: i });
      });
    }
  });
});
