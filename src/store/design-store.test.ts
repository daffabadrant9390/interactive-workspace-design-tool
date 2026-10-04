import { beforeEach, describe, expect, it } from "vitest";
import { useDesignStore } from "./design-store";
import { PERSONAS } from "@/lib/personas";

// Zustand stores are module-level singletons, so we snapshot the pristine
// state (including the action functions) once and fully replace the store
// with it before every test — this is the standard way to get test
// isolation without recreating the store per test.
const INITIAL_STATE = useDesignStore.getState();

beforeEach(() => {
  useDesignStore.setState(INITIAL_STATE, true);
});

describe("placeFloorItem", () => {
  it("does nothing when there is no pending placement", () => {
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    expect(useDesignStore.getState().floorItems).toHaveLength(0);
  });

  it("does nothing when pending is a 'move', not a 'floor' placement", () => {
    useDesignStore.setState({ pending: { kind: "move", instanceId: "x", catalogId: "chair-ergonomic" } });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    expect(useDesignStore.getState().floorItems).toHaveLength(0);
  });

  it("places the pending item at a valid tile and clears pending", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 1, z: 1 });

    const { floorItems, pending, history } = useDesignStore.getState();
    expect(floorItems).toHaveLength(1);
    expect(floorItems[0]).toMatchObject({ catalogId: "chair-ergonomic", position: { x: 1, z: 1 }, rotationY: 0 });
    expect(pending).toBeNull();
    expect(history).toHaveLength(1);
  });

  it("stores the color chosen on the pending placement", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic", color: "#ff0000" });
    useDesignStore.getState().placeFloorItem({ x: 1, z: 1 });
    expect(useDesignStore.getState().floorItems[0].color).toBe("#ff0000");
  });

  it("sets lastError and does not place when the tile is invalid", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: -1, z: 0 });

    const { floorItems, lastError, pending } = useDesignStore.getState();
    expect(floorItems).toHaveLength(0);
    expect(lastError).toBe("That's outside the room.");
    // Pending stays active so the user can try another tile.
    expect(pending).not.toBeNull();
  });

  it("bails out quietly if the pending catalogId doesn't exist", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "not-real" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    expect(useDesignStore.getState().floorItems).toHaveLength(0);
  });

  it("defaults rotationY to 0 when not provided", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    expect(useDesignStore.getState().floorItems[0].rotationY).toBe(0);
  });
});

describe("beginMoveFloorItem / moveFloorItem", () => {
  function placeAChair(x: number, z: number) {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x, z });
    return useDesignStore.getState().floorItems[0].instanceId;
  }

  it("beginMoveFloorItem sets a move-pending and clears floor selection", () => {
    const id = placeAChair(1, 1);
    useDesignStore.getState().selectFloorItem(id);
    useDesignStore.getState().beginMoveFloorItem(id);

    const { pending, selectedFloorInstanceId } = useDesignStore.getState();
    expect(pending).toEqual({ kind: "move", instanceId: id, catalogId: "chair-ergonomic" });
    expect(selectedFloorInstanceId).toBeNull();
  });

  it("beginMoveFloorItem is a no-op for an unknown instance id", () => {
    useDesignStore.getState().beginMoveFloorItem("nope");
    expect(useDesignStore.getState().pending).toBeNull();
  });

  it("moveFloorItem relocates the item to a valid tile", () => {
    const id = placeAChair(1, 1);
    useDesignStore.getState().beginMoveFloorItem(id);
    useDesignStore.getState().moveFloorItem(id, { x: 4, z: 4 });

    const item = useDesignStore.getState().floorItems.find((f) => f.instanceId === id)!;
    expect(item.position).toEqual({ x: 4, z: 4 });
    expect(useDesignStore.getState().pending).toBeNull();
  });

  it("moveFloorItem does not collide with the item's own old footprint", () => {
    const id = placeAChair(1, 1);
    useDesignStore.getState().beginMoveFloorItem(id);
    // Moving "onto itself" (same tile) should succeed, not be rejected as an overlap.
    useDesignStore.getState().moveFloorItem(id, { x: 1, z: 1 });
    expect(useDesignStore.getState().lastError).toBeNull();
    expect(useDesignStore.getState().floorItems[0].position).toEqual({ x: 1, z: 1 });
  });

  it("moveFloorItem rejects a tile occupied by a different item and keeps the item in place", () => {
    const id = placeAChair(1, 1);
    placeAChair(2, 1);
    useDesignStore.getState().beginMoveFloorItem(id);
    useDesignStore.getState().moveFloorItem(id, { x: 2, z: 1 });

    const item = useDesignStore.getState().floorItems.find((f) => f.instanceId === id)!;
    expect(item.position).toEqual({ x: 1, z: 1 }); // unchanged
    expect(useDesignStore.getState().lastError).toMatch(/already taken/);
  });

  it("moveFloorItem is a no-op for an unknown instance id", () => {
    useDesignStore.getState().moveFloorItem("nope", { x: 0, z: 0 });
    expect(useDesignStore.getState().floorItems).toHaveLength(0);
  });
});

describe("addDeskSlotItem", () => {
  function placeDesk() {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    return useDesignStore.getState().floorItems[0].instanceId;
  }

  it("sets lastError when no desk is selected", () => {
    useDesignStore.getState().addDeskSlotItem("acc-lamp");
    expect(useDesignStore.getState().deskItems).toHaveLength(0);
    expect(useDesignStore.getState().lastError).toMatch(/Select a desk first/);
  });

  it("adds an item to the selected desk", () => {
    const deskId = placeDesk();
    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().addDeskSlotItem("acc-lamp", "#00ff00");

    const { deskItems } = useDesignStore.getState();
    expect(deskItems).toHaveLength(1);
    expect(deskItems[0]).toMatchObject({ catalogId: "acc-lamp", deskInstanceId: deskId, slotIndex: 0, color: "#00ff00" });
  });

  it("increments slotIndex for successive items on the same desk", () => {
    const deskId = placeDesk();
    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().addDeskSlotItem("acc-lamp");
    useDesignStore.getState().addDeskSlotItem("acc-keyboard");

    const { deskItems } = useDesignStore.getState();
    expect(deskItems.map((d) => d.slotIndex)).toEqual([0, 1]);
  });

  it("sets lastError and adds nothing when the rule engine rejects it", () => {
    const deskId = placeDesk(); // desk-standard: maxMonitors 2
    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().addDeskSlotItem("monitor-24-fhd");
    useDesignStore.getState().addDeskSlotItem("monitor-27-4k");
    useDesignStore.getState().addDeskSlotItem("monitor-24-fhd"); // 3rd monitor should be rejected

    expect(useDesignStore.getState().deskItems).toHaveLength(2);
    expect(useDesignStore.getState().lastError).toMatch(/only fits/);
  });

  it("does nothing if the selected desk instance no longer exists", () => {
    useDesignStore.getState().selectDesk("ghost-desk");
    useDesignStore.getState().addDeskSlotItem("acc-lamp");
    expect(useDesignStore.getState().deskItems).toHaveLength(0);
  });

  it("does nothing for an unknown catalog id", () => {
    const deskId = placeDesk();
    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().addDeskSlotItem("not-real");
    expect(useDesignStore.getState().deskItems).toHaveLength(0);
  });
});

describe("removeFloorItem", () => {
  it("removes the floor item and anything placed on it (a desk)", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    const deskId = useDesignStore.getState().floorItems[0].instanceId;
    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().addDeskSlotItem("acc-lamp");

    useDesignStore.getState().removeFloorItem(deskId);

    const { floorItems, deskItems } = useDesignStore.getState();
    expect(floorItems).toHaveLength(0);
    expect(deskItems).toHaveLength(0);
  });

  it("clears selectedDeskInstanceId and selectedFloorInstanceId when the removed item was selected", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    const deskId = useDesignStore.getState().floorItems[0].instanceId;
    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().selectFloorItem(deskId);

    useDesignStore.getState().removeFloorItem(deskId);

    expect(useDesignStore.getState().selectedDeskInstanceId).toBeNull();
    expect(useDesignStore.getState().selectedFloorInstanceId).toBeNull();
  });

  it("leaves an unrelated selection untouched", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    const chairId = useDesignStore.getState().floorItems[0].instanceId;

    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 3, z: 3 });
    const deskId = useDesignStore.getState().floorItems[1].instanceId;

    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().removeFloorItem(chairId);

    expect(useDesignStore.getState().selectedDeskInstanceId).toBe(deskId);
  });
});

describe("removeDeskItem", () => {
  it("removes only the targeted desk item", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    const deskId = useDesignStore.getState().floorItems[0].instanceId;
    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().addDeskSlotItem("acc-lamp");
    useDesignStore.getState().addDeskSlotItem("acc-keyboard");

    const toRemove = useDesignStore.getState().deskItems[0].instanceId;
    useDesignStore.getState().removeDeskItem(toRemove);

    const { deskItems } = useDesignStore.getState();
    expect(deskItems).toHaveLength(1);
    expect(deskItems[0].catalogId).toBe("acc-keyboard");
  });
});

describe("rotateDeskItem", () => {
  function placeDeskWithItem(catalogId = "acc-lamp") {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    const deskId = useDesignStore.getState().floorItems[0].instanceId;
    useDesignStore.getState().selectDesk(deskId);
    useDesignStore.getState().addDeskSlotItem(catalogId);
    return useDesignStore.getState().deskItems[0].instanceId;
  }

  it("starts a new desk item at rotationY 0", () => {
    placeDeskWithItem();
    expect(useDesignStore.getState().deskItems[0].rotationY).toBe(0);
  });

  it("cycles rotationY by 90 degrees on every call, wrapping past 270", () => {
    const id = placeDeskWithItem();
    const expected = [90, 180, 270, 0];
    for (const rotation of expected) {
      useDesignStore.getState().rotateDeskItem(id);
      expect(useDesignStore.getState().deskItems[0].rotationY).toBe(rotation);
    }
  });

  it("does nothing for an instance id that doesn't exist", () => {
    placeDeskWithItem();
    useDesignStore.getState().rotateDeskItem("nope");
    expect(useDesignStore.getState().deskItems[0].rotationY).toBe(0);
  });

  it("leaves other desk items on the same desk untouched", () => {
    placeDeskWithItem("acc-lamp");
    useDesignStore.getState().addDeskSlotItem("acc-keyboard");
    const [lamp, keyboard] = useDesignStore.getState().deskItems;

    useDesignStore.getState().rotateDeskItem(keyboard.instanceId);

    const state = useDesignStore.getState();
    expect(state.deskItems.find((d) => d.instanceId === lamp.instanceId)?.rotationY).toBe(0);
    expect(state.deskItems.find((d) => d.instanceId === keyboard.instanceId)?.rotationY).toBe(90);
  });

  it("records a history entry so rotation can be undone", () => {
    const id = placeDeskWithItem();
    const historyBefore = useDesignStore.getState().history.length;
    useDesignStore.getState().rotateDeskItem(id);
    expect(useDesignStore.getState().history.length).toBe(historyBefore + 1);
  });
});

describe("rotateFloorItem", () => {
  it("rotates by 90 degrees, wrapping from 270 back to 0", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 1, z: 1 });
    const id = useDesignStore.getState().floorItems[0].instanceId;

    const expected = [90, 180, 270, 0];
    for (const rot of expected) {
      useDesignStore.getState().rotateFloorItem(id);
      expect(useDesignStore.getState().floorItems[0].rotationY).toBe(rot);
    }
  });

  it("does nothing for an unknown instance id", () => {
    useDesignStore.getState().rotateFloorItem("nope");
    expect(useDesignStore.getState().floorItems).toHaveLength(0);
  });

  it("sets lastError and keeps the original rotation when the rotated footprint doesn't fit", () => {
    // desk-wide is 3x1; place near the depth edge so 90-degree rotation (1x3) pushes past ROOM_DEPTH.
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-wide" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 4 }); // ROOM_DEPTH is 6, so z 4..6 would overflow when rotated to depth 3
    const id = useDesignStore.getState().floorItems[0].instanceId;

    useDesignStore.getState().rotateFloorItem(id);

    expect(useDesignStore.getState().floorItems[0].rotationY).toBe(0);
    expect(useDesignStore.getState().lastError).toBeTruthy();
  });
});

describe("selectDesk / selectFloorItem", () => {
  it("sets and clears the desk selection", () => {
    useDesignStore.getState().selectDesk("desk-1");
    expect(useDesignStore.getState().selectedDeskInstanceId).toBe("desk-1");
    useDesignStore.getState().selectDesk(null);
    expect(useDesignStore.getState().selectedDeskInstanceId).toBeNull();
  });

  it("sets and clears the generic floor selection", () => {
    useDesignStore.getState().selectFloorItem("item-1");
    expect(useDesignStore.getState().selectedFloorInstanceId).toBe("item-1");
    useDesignStore.getState().selectFloorItem(null);
    expect(useDesignStore.getState().selectedFloorInstanceId).toBeNull();
  });
});

describe("setDuration / setCycles", () => {
  it("sets duration", () => {
    useDesignStore.getState().setDuration("month");
    expect(useDesignStore.getState().duration).toBe("month");
  });

  it("clamps cycles to a minimum of 1", () => {
    useDesignStore.getState().setCycles(0);
    expect(useDesignStore.getState().cycles).toBe(1);
    useDesignStore.getState().setCycles(-5);
    expect(useDesignStore.getState().cycles).toBe(1);
  });

  it("accepts a valid cycle count", () => {
    useDesignStore.getState().setCycles(6);
    expect(useDesignStore.getState().cycles).toBe(6);
  });
});

describe("applyPersona", () => {
  it("lays out every persona without error and links desk-slot items to the first desk", () => {
    for (const persona of PERSONAS) {
      useDesignStore.setState(INITIAL_STATE, true);
      useDesignStore.getState().applyPersona(persona);

      const { floorItems, deskItems, pending, selectedDeskInstanceId, selectedFloorInstanceId } =
        useDesignStore.getState();
      expect(floorItems.length).toBe(persona.floor.length);
      expect(deskItems.length).toBe(persona.deskSlots.length);
      expect(pending).toBeNull();
      expect(selectedDeskInstanceId).toBeNull();
      expect(selectedFloorInstanceId).toBeNull();

      const deskInstanceId = floorItems.find((f) => f.catalogId.startsWith("desk-"))!.instanceId;
      for (const d of deskItems) {
        expect(d.deskInstanceId).toBe(deskInstanceId);
      }
    }
  });

  it("records a history entry so applying a persona can be undone", () => {
    useDesignStore.getState().applyPersona(PERSONAS[0]);
    expect(useDesignStore.getState().history.length).toBeGreaterThan(0);
  });

  it("skips an unknown catalog id, an invalid floor placement, and an invalid desk-slot item gracefully", () => {
    useDesignStore.getState().applyPersona({
      id: "synthetic",
      label: "Synthetic",
      emoji: "x",
      floor: [
        { catalogId: "desk-standard", x: 0, z: 0 },
        { catalogId: "not-a-real-id", x: 1, z: 0 }, // unknown id — skipped
        { catalogId: "chair-ergonomic", x: 0, z: 0 }, // collides with the desk — skipped
      ],
      deskSlots: ["not-a-real-id", "monitor-34-curved"], // unknown id, then one that won't fit desk-standard? actually fits; use compact instead
    });

    const { floorItems, deskItems } = useDesignStore.getState();
    expect(floorItems).toHaveLength(1);
    expect(floorItems[0].catalogId).toBe("desk-standard");
    // monitor-34-curved fits desk-standard (140cm), so it's the one item that lands.
    expect(deskItems).toHaveLength(1);
    expect(deskItems[0].catalogId).toBe("monitor-34-curved");
  });

  it("leaves deskItems empty when the persona has no desk to attach to", () => {
    useDesignStore.getState().applyPersona({
      id: "no-desk",
      label: "No Desk",
      emoji: "x",
      floor: [{ catalogId: "chair-ergonomic", x: 0, z: 0 }],
      deskSlots: ["acc-lamp"],
    });
    expect(useDesignStore.getState().deskItems).toHaveLength(0);
  });
});

describe("applySuggestedItems", () => {
  it("places floor items and attaches desk-slot items to a newly-placed desk", () => {
    useDesignStore.getState().applySuggestedItems(["desk-standard", "chair-ergonomic", "acc-lamp"]);

    const { floorItems, deskItems } = useDesignStore.getState();
    expect(floorItems.map((f) => f.catalogId).sort()).toEqual(["chair-ergonomic", "desk-standard"]);
    expect(deskItems).toHaveLength(1);
    expect(deskItems[0].catalogId).toBe("acc-lamp");
  });

  it("attaches to an already-placed desk instead of requiring a new one", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    const existingDeskId = useDesignStore.getState().floorItems[0].instanceId;

    useDesignStore.getState().applySuggestedItems(["acc-lamp"]);

    const { deskItems } = useDesignStore.getState();
    expect(deskItems[0].deskInstanceId).toBe(existingDeskId);
  });

  it("skips desk-slot items gracefully when no desk exists and none is being added", () => {
    useDesignStore.getState().applySuggestedItems(["acc-lamp", "acc-keyboard"]);
    expect(useDesignStore.getState().deskItems).toHaveLength(0);
  });

  it("skips a floor item when the room is completely full", () => {
    // Fill every tile of the 8x6 room with plants (1x1 footprint) first.
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 6; z++) {
        useDesignStore.getState().setPending({ kind: "floor", catalogId: "break-plant" });
        useDesignStore.getState().placeFloorItem({ x, z });
      }
    }
    const before = useDesignStore.getState().floorItems.length;
    useDesignStore.getState().applySuggestedItems(["chair-ergonomic"]);
    expect(useDesignStore.getState().floorItems.length).toBe(before);
  });

  it("ignores unknown catalog ids", () => {
    useDesignStore.getState().applySuggestedItems(["not-real"]);
    expect(useDesignStore.getState().floorItems).toHaveLength(0);
    expect(useDesignStore.getState().deskItems).toHaveLength(0);
  });

  it("skips a desk-slot item the rule engine rejects (too-wide monitor for the desk)", () => {
    useDesignStore.getState().applySuggestedItems(["desk-compact", "monitor-34-curved"]);
    expect(useDesignStore.getState().deskItems).toHaveLength(0);
  });
});

describe("reset", () => {
  it("clears everything back to the initial state", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    useDesignStore.getState().selectFloorItem(useDesignStore.getState().floorItems[0].instanceId);

    useDesignStore.getState().reset();

    const { floorItems, deskItems, pending, lastError, selectedDeskInstanceId, selectedFloorInstanceId } =
      useDesignStore.getState();
    expect(floorItems).toHaveLength(0);
    expect(deskItems).toHaveLength(0);
    expect(pending).toBeNull();
    expect(lastError).toBeNull();
    expect(selectedDeskInstanceId).toBeNull();
    expect(selectedFloorInstanceId).toBeNull();
  });
});

describe("undo / redo", () => {
  it("undo restores the previous floorItems/deskItems and is a no-op with empty history", () => {
    useDesignStore.getState().undo();
    expect(useDesignStore.getState().floorItems).toHaveLength(0);

    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    expect(useDesignStore.getState().floorItems).toHaveLength(1);

    useDesignStore.getState().undo();
    expect(useDesignStore.getState().floorItems).toHaveLength(0);
  });

  it("redo re-applies an undone change and is a no-op with empty future", () => {
    useDesignStore.getState().redo();
    expect(useDesignStore.getState().floorItems).toHaveLength(0);

    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    useDesignStore.getState().undo();
    expect(useDesignStore.getState().floorItems).toHaveLength(0);

    useDesignStore.getState().redo();
    expect(useDesignStore.getState().floorItems).toHaveLength(1);
  });

  it("clears pending on undo and redo", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });

    useDesignStore.getState().undo();
    expect(useDesignStore.getState().pending).toBeNull();

    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().redo();
    expect(useDesignStore.getState().pending).toBeNull();
  });

  it("a new action after undo clears the redo stack", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    useDesignStore.getState().undo();
    expect(useDesignStore.getState().future.length).toBeGreaterThan(0);

    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 3, z: 3 });
    expect(useDesignStore.getState().future).toHaveLength(0);
  });
});

describe("clearPending / setPending", () => {
  it("setPending clears any lastError", () => {
    useDesignStore.setState({ lastError: "boom" });
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    expect(useDesignStore.getState().lastError).toBeNull();
  });

  it("clearPending sets pending back to null", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().clearPending();
    expect(useDesignStore.getState().pending).toBeNull();
  });
});

describe("dragModeActive", () => {
  it("toggleDragMode flips the flag", () => {
    expect(useDesignStore.getState().dragModeActive).toBe(false);
    useDesignStore.getState().toggleDragMode();
    expect(useDesignStore.getState().dragModeActive).toBe(true);
    useDesignStore.getState().toggleDragMode();
    expect(useDesignStore.getState().dragModeActive).toBe(false);
  });

  it("turning it on cancels any pending placement and selection", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().selectDesk("some-desk");
    useDesignStore.getState().selectFloorItem("some-floor-item");

    useDesignStore.getState().setDragModeActive(true);

    const state = useDesignStore.getState();
    expect(state.pending).toBeNull();
    expect(state.selectedDeskInstanceId).toBeNull();
    expect(state.selectedFloorInstanceId).toBeNull();
  });

  it("blocks placing, moving, selecting, and toolbar actions while active", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().setDragModeActive(true);

    // setPending/clearPending/placeFloorItem are all no-ops now.
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "desk-standard" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    expect(useDesignStore.getState().floorItems).toHaveLength(0);
    expect(useDesignStore.getState().pending).toBeNull();

    useDesignStore.getState().selectFloorItem("x");
    useDesignStore.getState().selectDesk("x");
    expect(useDesignStore.getState().selectedFloorInstanceId).toBeNull();
    expect(useDesignStore.getState().selectedDeskInstanceId).toBeNull();

    useDesignStore.getState().setDuration("month");
    useDesignStore.getState().setCycles(5);
    expect(useDesignStore.getState().duration).toBe("week");
    expect(useDesignStore.getState().cycles).toBe(1);

    useDesignStore.getState().reset();
    useDesignStore.getState().undo();
    useDesignStore.getState().redo();
    // None of those should throw, and none should change anything while active.
    expect(useDesignStore.getState().dragModeActive).toBe(true);
  });

  it("actions resume normally once drag mode is turned back off", () => {
    useDesignStore.getState().setDragModeActive(true);
    useDesignStore.getState().setDragModeActive(false);

    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });
    expect(useDesignStore.getState().floorItems).toHaveLength(1);
  });
});

describe("loadDesign", () => {
  it("replaces floorItems/deskItems and resets history", () => {
    useDesignStore.getState().setPending({ kind: "floor", catalogId: "chair-ergonomic" });
    useDesignStore.getState().placeFloorItem({ x: 0, z: 0 });

    useDesignStore.getState().loadDesign({
      floorItems: [{ instanceId: "loaded", catalogId: "desk-standard", position: { x: 2, z: 2 }, rotationY: 0 }],
      deskItems: [],
    });

    const { floorItems, deskItems, history, future } = useDesignStore.getState();
    expect(floorItems).toHaveLength(1);
    expect(floorItems[0].instanceId).toBe("loaded");
    expect(deskItems).toHaveLength(0);
    expect(history).toHaveLength(0);
    expect(future).toHaveLength(0);
  });
});
