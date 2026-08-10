import { describe, expect, it } from "vitest";
import {
  canPlaceObject,
  canRemoveObject,
  createZooLayout,
  getObjectAt,
  placeObject,
  removeObject,
} from "./zoo";

describe("zoo layout", () => {
  it("starts empty", () => {
    const layout = createZooLayout(8, 8);
    expect(getObjectAt(layout, { col: 0, row: 0 })).toBeUndefined();
  });

  it("places an object on an empty tile", () => {
    const layout = createZooLayout(8, 8);
    const placed = placeObject(layout, { col: 2, row: 3 }, "path");
    expect(placed).toBe(true);
    expect(getObjectAt(layout, { col: 2, row: 3 })).toBe("path");
  });

  it("prevents placing on an already occupied tile", () => {
    const layout = createZooLayout(8, 8);
    placeObject(layout, { col: 2, row: 3 }, "path");
    const placed = placeObject(layout, { col: 2, row: 3 }, "vegetation");
    expect(placed).toBe(false);
    expect(getObjectAt(layout, { col: 2, row: 3 })).toBe("path");
  });

  it("prevents placing outside the grid bounds", () => {
    const layout = createZooLayout(8, 8);
    expect(canPlaceObject(layout, { col: -1, row: 0 })).toBe(false);
    expect(canPlaceObject(layout, { col: 8, row: 0 })).toBe(false);
    expect(placeObject(layout, { col: 8, row: 0 }, "habitat")).toBe(false);
  });

  it("removes an object from an occupied tile", () => {
    const layout = createZooLayout(8, 8);
    placeObject(layout, { col: 1, row: 1 }, "habitat");
    expect(canRemoveObject(layout, { col: 1, row: 1 })).toBe(true);
    const removed = removeObject(layout, { col: 1, row: 1 });
    expect(removed).toBe(true);
    expect(getObjectAt(layout, { col: 1, row: 1 })).toBeUndefined();
  });

  it("prevents removing from an empty tile", () => {
    const layout = createZooLayout(8, 8);
    expect(canRemoveObject(layout, { col: 4, row: 4 })).toBe(false);
    expect(removeObject(layout, { col: 4, row: 4 })).toBe(false);
  });

  it("allows placing again after removal", () => {
    const layout = createZooLayout(8, 8);
    placeObject(layout, { col: 5, row: 5 }, "path");
    removeObject(layout, { col: 5, row: 5 });
    expect(placeObject(layout, { col: 5, row: 5 }, "vegetation")).toBe(true);
    expect(getObjectAt(layout, { col: 5, row: 5 })).toBe("vegetation");
  });
});
