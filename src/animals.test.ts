import { describe, expect, it } from "vitest";
import {
  type WelfareResult,
  calculateWelfare,
  canPlaceAnimal,
  createAnimalLayout,
  getAnimalAt,
  placeAnimal,
  removeAnimal,
} from "./animals";
import { createZooLayout, placeObject } from "./zoo";

function needFor(welfare: WelfareResult, need: string) {
  return welfare.needs.find((n) => n.need === need)!;
}

describe("placing animals", () => {
  it("allows placing an animal on a habitat tile", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    placeObject(zoo, { col: 2, row: 2 }, "habitat");

    expect(canPlaceAnimal(zoo, animals, { col: 2, row: 2 })).toBe(true);
    expect(placeAnimal(zoo, animals, { col: 2, row: 2 }, "lion")).toBe(true);
    expect(getAnimalAt(animals, { col: 2, row: 2 })).toBe("lion");
  });

  it("prevents placing an animal on a non-habitat tile", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    placeObject(zoo, { col: 2, row: 2 }, "path");

    expect(canPlaceAnimal(zoo, animals, { col: 2, row: 2 })).toBe(false);
    expect(placeAnimal(zoo, animals, { col: 2, row: 2 }, "lion")).toBe(false);
  });

  it("prevents placing two animals on the same tile", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    placeObject(zoo, { col: 2, row: 2 }, "habitat");
    placeAnimal(zoo, animals, { col: 2, row: 2 }, "lion");

    expect(placeAnimal(zoo, animals, { col: 2, row: 2 }, "tortoise")).toBe(false);
    expect(getAnimalAt(animals, { col: 2, row: 2 })).toBe("lion");
  });

  it("removes a placed animal", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    placeObject(zoo, { col: 2, row: 2 }, "habitat");
    placeAnimal(zoo, animals, { col: 2, row: 2 }, "lion");

    expect(removeAnimal(animals, { col: 2, row: 2 })).toBe(true);
    expect(getAnimalAt(animals, { col: 2, row: 2 })).toBeUndefined();
  });
});

describe("calculateWelfare", () => {
  it("returns undefined for a tile without an animal", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    expect(calculateWelfare(zoo, animals, { col: 0, row: 0 })).toBeUndefined();
  });

  it("scores low welfare for a cramped, bare habitat missing every need", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "lion");

    const welfare = calculateWelfare(zoo, animals, { col: 0, row: 0 })!;
    expect(needFor(welfare, "space").actual).toBe(1);
    expect(needFor(welfare, "water").actual).toBe(0);
    expect(welfare.score).toBeLessThan(50);
  });

  it("scores full welfare when every need is met", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();

    // A 1x4 enclosure has room on all four sides for every bordering need.
    // Tortoise needs: space 4, vegetation 2, water 1, shelter 2, enrichment 1.
    placeObject(zoo, { col: 2, row: 3 }, "habitat");
    placeObject(zoo, { col: 3, row: 3 }, "habitat");
    placeObject(zoo, { col: 4, row: 3 }, "habitat");
    placeObject(zoo, { col: 5, row: 3 }, "habitat");
    placeObject(zoo, { col: 2, row: 2 }, "vegetation");
    placeObject(zoo, { col: 3, row: 2 }, "vegetation");
    placeObject(zoo, { col: 4, row: 2 }, "shelter");
    placeObject(zoo, { col: 5, row: 2 }, "shelter");
    placeObject(zoo, { col: 2, row: 4 }, "water");
    placeObject(zoo, { col: 3, row: 4 }, "enrichment");
    placeAnimal(zoo, animals, { col: 2, row: 3 }, "tortoise");

    const welfare = calculateWelfare(zoo, animals, { col: 2, row: 3 })!;
    expect(needFor(welfare, "space").actual).toBe(4);
    expect(needFor(welfare, "vegetation").actual).toBe(2);
    expect(needFor(welfare, "shelter").actual).toBe(2);
    expect(needFor(welfare, "water").actual).toBe(1);
    expect(needFor(welfare, "enrichment").actual).toBe(1);
    expect(welfare.score).toBe(100);
  });

  it("only counts habitat tiles connected to the animal's enclosure", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();

    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "lion");
    // Disconnected habitat tile elsewhere on the grid must not count.
    placeObject(zoo, { col: 5, row: 5 }, "habitat");

    const welfare = calculateWelfare(zoo, animals, { col: 0, row: 0 })!;
    expect(needFor(welfare, "space").actual).toBe(1);
  });

  it("weighs needs differently per species", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();

    // Same bare 1-tile habitat for a lion and a tortoise: their overall
    // score should differ because they weigh space/shelter/water differently.
    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeObject(zoo, { col: 5, row: 5 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "lion");
    placeAnimal(zoo, animals, { col: 5, row: 5 }, "tortoise");

    const lionWelfare = calculateWelfare(zoo, animals, { col: 0, row: 0 })!;
    const tortoiseWelfare = calculateWelfare(zoo, animals, { col: 5, row: 5 })!;

    expect(lionWelfare.score).not.toBe(tortoiseWelfare.score);
  });

  it("improves welfare when a missing need is added", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "lion");
    const before = calculateWelfare(zoo, animals, { col: 0, row: 0 })!;

    placeObject(zoo, { col: 1, row: 0 }, "water");
    const after = calculateWelfare(zoo, animals, { col: 0, row: 0 })!;

    expect(needFor(after, "water").actual).toBe(1);
    expect(after.score).toBeGreaterThan(before.score);
  });
});
