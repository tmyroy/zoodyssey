import { describe, expect, it } from "vitest";
import { createAnimalLayout } from "./animals";
import { createDraftState, pickCard, startDraft } from "./cards";
import { createResearchState } from "./research";
import { RUN_LENGTH_YEARS, evaluateRun, isRunComplete } from "./run";
import { applyYearResult, createInitialGameState, simulateYear } from "./simulation";
import { createZooLayout, placeObject } from "./zoo";

// Exercises the full discover -> build -> simulate -> evaluate -> repeat loop
// end to end through the pure game-logic layer, the same sequence MainScene
// drives. Guards against the run stalling, throwing, or producing
// out-of-range results anywhere across a complete playthrough.
describe("a full run", () => {
  it("can be played from year 1 to run completion without errors", () => {
    let game = createInitialGameState();
    let draft = createDraftState();
    const research = createResearchState();
    const zoo = createZooLayout(8, 8);
    const animals = createAnimalLayout();

    let yearsPlayed = 0;

    while (!isRunComplete(game)) {
      draft = startDraft(draft, () => 0);
      if (draft.offer.length > 0) {
        draft = pickCard(draft, draft.offer[0].id);
      }

      if (yearsPlayed < 8) {
        placeObject(zoo, { col: yearsPlayed, row: 0 }, "habitat");
      }

      const result = simulateYear(game, zoo, animals, research);
      expect(result.visitors).toBeGreaterThanOrEqual(0);
      expect(result.averageWelfare).toBeGreaterThanOrEqual(0);
      expect(result.averageWelfare).toBeLessThanOrEqual(100);
      expect(Number.isFinite(result.income)).toBe(true);

      game = applyYearResult(game, result);
      yearsPlayed++;
      expect(yearsPlayed).toBeLessThanOrEqual(RUN_LENGTH_YEARS + 1);
    }

    expect(yearsPlayed).toBe(RUN_LENGTH_YEARS);
    expect(["success", "failure"]).toContain(evaluateRun(game));

    // The player can then start a fresh run from scratch.
    const newRun = createInitialGameState();
    expect(newRun).toEqual(createInitialGameState());
    expect(isRunComplete(newRun)).toBe(false);
  });
});
