import type { GameState } from "./simulation";

export const RUN_LENGTH_YEARS = 5;
export const CONSERVATION_SUCCESS_THRESHOLD = 20;

export type RunStatus = "in-progress" | "success" | "failure";

// A run ends once the player has played through every year of the run.
export function isRunComplete(state: GameState): boolean {
  return state.year > RUN_LENGTH_YEARS;
}

// A finished run succeeds if the zoo stayed solvent and made a meaningful
// contribution to conservation.
export function evaluateRun(state: GameState): RunStatus {
  if (!isRunComplete(state)) {
    return "in-progress";
  }
  const success = state.money >= 0 && state.conservation >= CONSERVATION_SUCCESS_THRESHOLD;
  return success ? "success" : "failure";
}
