import { describe, expect, it } from "vitest";
import {
  calculateWelfare,
  canPlaceAnimal,
  createAnimalLayout,
  getAnimalAt,
  placeAnimal,
  removeAnimal,
} from "./animals";
import { createZooLayout, placeObject } from "./zoo";

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

  it("scores low welfare for a cramped, bare habitat", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "lion");

    const welfare = calculateWelfare(zoo, animals, { col: 0, row: 0 });
    expect(welfare?.habitatSize).toBe(1);
    expect(welfare?.vegetationCount).toBe(0);
    expect(welfare?.score).toBeLessThan(50);
  });

  it("scores full welfare when space and vegetation needs are met", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();

    // Tortoise needs 4 habitat tiles and 1 bordering vegetation tile.
    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeObject(zoo, { col: 1, row: 0 }, "habitat");
    placeObject(zoo, { col: 0, row: 1 }, "habitat");
    placeObject(zoo, { col: 1, row: 1 }, "habitat");
    placeObject(zoo, { col: 2, row: 0 }, "vegetation");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "tortoise");

    const welfare = calculateWelfare(zoo, animals, { col: 0, row: 0 });
    expect(welfare?.habitatSize).toBe(4);
    expect(welfare?.vegetationCount).toBe(1);
    expect(welfare?.score).toBe(100);
  });

  it("only counts habitat tiles connected to the animal's enclosure", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();

    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "lion");
    // Disconnected habitat tile elsewhere on the grid must not count.
    placeObject(zoo, { col: 5, row: 5 }, "habitat");

    const welfare = calculateWelfare(zoo, animals, { col: 0, row: 0 });
    expect(welfare?.habitatSize).toBe(1);
  });

  it("improves welfare when the habitat is expanded", () => {
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "lion");
    const before = calculateWelfare(zoo, animals, { col: 0, row: 0 })!;

    for (let col = 1; col < 6; col++) {
      placeObject(zoo, { col, row: 0 }, "habitat");
    }
    const after = calculateWelfare(zoo, animals, { col: 0, row: 0 })!;

    expect(after.score).toBeGreaterThan(before.score);
  });
});
