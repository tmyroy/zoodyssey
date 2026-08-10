import { describe, expect, it } from "vitest";
import { createAnimalLayout, placeAnimal } from "./animals";
import { createResearchState, purchaseUpgrade } from "./research";
import { STARTING_MONEY, applyYearResult, createInitialGameState, simulateYear } from "./simulation";
import { createZooLayout, placeObject } from "./zoo";

describe("createInitialGameState", () => {
  it("starts at year 1 with the starting resources", () => {
    const state = createInitialGameState();
    expect(state).toEqual({ year: 1, money: STARTING_MONEY, research: 0, conservation: 0 });
  });
});

describe("simulateYear", () => {
  it("produces no visitors or gains for an empty zoo", () => {
    const state = createInitialGameState();
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    const research = createResearchState();

    const result = simulateYear(state, zoo, animals, research);

    expect(result.visitors).toBe(0);
    expect(result.income).toBe(0);
    expect(result.averageWelfare).toBe(0);
    expect(result.researchGained).toBe(0);
    expect(result.conservationGained).toBe(0);
  });

  it("attracts more visitors and gains as animal welfare improves", () => {
    const state = createInitialGameState();
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    const research = createResearchState();
    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "lion");

    const poorResult = simulateYear(state, zoo, animals, research);

    // Fully satisfy the lion's needs by expanding its habitat and amenities.
    for (let col = 1; col < 6; col++) {
      placeObject(zoo, { col, row: 0 }, "habitat");
    }
    placeObject(zoo, { col: 0, row: 1 }, "water");
    placeObject(zoo, { col: 1, row: 1 }, "shelter");
    placeObject(zoo, { col: 2, row: 1 }, "enrichment");
    placeObject(zoo, { col: 3, row: 1 }, "vegetation");

    const goodResult = simulateYear(state, zoo, animals, research);

    expect(goodResult.averageWelfare).toBeGreaterThan(poorResult.averageWelfare);
    expect(goodResult.visitors).toBeGreaterThan(poorResult.visitors);
    expect(goodResult.researchGained).toBeGreaterThan(poorResult.researchGained);
    expect(goodResult.conservationGained).toBeGreaterThan(poorResult.conservationGained);
  });

  it("does not mutate the game state", () => {
    const state = createInitialGameState();
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    const research = createResearchState();

    simulateYear(state, zoo, animals, research);

    expect(state).toEqual({ year: 1, money: STARTING_MONEY, research: 0, conservation: 0 });
  });

  it("applies purchased upgrades to visitors, upkeep, and conservation", () => {
    const state = { ...createInitialGameState(), research: 100 };
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();

    // Fully satisfy the tortoise's needs so welfare (and visitors) are non-zero.
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

    const baseline = simulateYear(state, zoo, animals, createResearchState());

    let research = createResearchState();
    research = purchaseUpgrade(research, state, "marketing-campaign").research;
    research = purchaseUpgrade(research, state, "improved-feeding").research;
    research = purchaseUpgrade(research, state, "conservation-program").research;

    const upgraded = simulateYear(state, zoo, animals, research);

    expect(upgraded.visitors).toBeGreaterThan(baseline.visitors);
    expect(upgraded.income).toBeGreaterThan(baseline.income);
    expect(upgraded.conservationGained).toBeGreaterThan(baseline.conservationGained);
  });
});

describe("applyYearResult", () => {
  it("advances the year and accumulates resources", () => {
    const state = createInitialGameState();
    const result = {
      year: 1,
      visitors: 100,
      income: 250,
      averageWelfare: 80,
      researchGained: 5,
      conservationGained: 3,
    };

    const nextState = applyYearResult(state, result);

    expect(nextState).toEqual({
      year: 2,
      money: STARTING_MONEY + 250,
      research: 5,
      conservation: 3,
    });
  });

  it("persists accumulated resources across multiple years", () => {
    let state = createInitialGameState();
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();
    const research = createResearchState();
    placeObject(zoo, { col: 0, row: 0 }, "habitat");
    placeAnimal(zoo, animals, { col: 0, row: 0 }, "tortoise");

    for (let i = 0; i < 3; i++) {
      const result = simulateYear(state, zoo, animals, research);
      state = applyYearResult(state, result);
    }

    expect(state.year).toBe(4);
    expect(state.research).toBeGreaterThanOrEqual(0);
    expect(state.conservation).toBeGreaterThanOrEqual(0);
  });
});
