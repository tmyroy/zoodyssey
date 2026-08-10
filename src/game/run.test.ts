import { describe, expect, it } from "vitest";
import { RUN_LENGTH_YEARS, evaluateRun, isRunComplete } from "./run";
import { createInitialGameState } from "./simulation";

describe("isRunComplete", () => {
  it("is not complete while years remain", () => {
    const state = createInitialGameState();
    expect(isRunComplete(state)).toBe(false);
  });

  it("is complete once every year of the run has been played", () => {
    const state = { ...createInitialGameState(), year: RUN_LENGTH_YEARS + 1 };
    expect(isRunComplete(state)).toBe(true);
  });
});

describe("evaluateRun", () => {
  it("is in-progress before the run ends", () => {
    const state = createInitialGameState();
    expect(evaluateRun(state)).toBe("in-progress");
  });

  it("succeeds when the run ends solvent with enough conservation impact", () => {
    const state = {
      year: RUN_LENGTH_YEARS + 1,
      money: 100,
      research: 10,
      conservation: 25,
    };
    expect(evaluateRun(state)).toBe("success");
  });

  it("fails when the zoo goes bankrupt even with high conservation", () => {
    const state = {
      year: RUN_LENGTH_YEARS + 1,
      money: -50,
      research: 10,
      conservation: 25,
    };
    expect(evaluateRun(state)).toBe("failure");
  });

  it("fails when conservation impact never reached the success threshold", () => {
    const state = {
      year: RUN_LENGTH_YEARS + 1,
      money: 100,
      research: 10,
      conservation: 5,
    };
    expect(evaluateRun(state)).toBe("failure");
  });
});
