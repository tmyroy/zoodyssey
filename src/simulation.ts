import { type AnimalLayout, calculateWelfare, listAnimals } from "./animals";
import type { ZooLayout } from "./zoo";

export interface GameState {
  year: number;
  money: number;
  research: number;
  conservation: number;
}

export interface YearResult {
  year: number;
  visitors: number;
  income: number;
  averageWelfare: number;
  researchGained: number;
  conservationGained: number;
}

export const STARTING_MONEY = 500;

const VISITORS_PER_ANIMAL = 15;
const TICKET_PRICE = 12;
const UPKEEP_PER_ANIMAL = 20;
const RESEARCH_PER_ANIMAL = 2;
const CONSERVATION_PER_ANIMAL = 2;

export function createInitialGameState(): GameState {
  return { year: 1, money: STARTING_MONEY, research: 0, conservation: 0 };
}

function averageWelfareScore(zoo: ZooLayout, animals: AnimalLayout): number {
  const placements = listAnimals(animals);
  if (placements.length === 0) {
    return 0;
  }

  const total = placements.reduce((sum, placement) => {
    const welfare = calculateWelfare(zoo, animals, placement.cell);
    return sum + (welfare?.score ?? 0);
  }, 0);

  return total / placements.length;
}

// Simulates the current year without mutating state, so results can be
// reviewed before the player chooses to advance to the next year.
export function simulateYear(state: GameState, zoo: ZooLayout, animals: AnimalLayout): YearResult {
  const animalCount = listAnimals(animals).length;
  const welfare = averageWelfareScore(zoo, animals);
  const welfareFactor = welfare / 100;

  const visitors = Math.round(animalCount * VISITORS_PER_ANIMAL * welfareFactor);
  const income = visitors * TICKET_PRICE - animalCount * UPKEEP_PER_ANIMAL;
  const researchGained = Math.round(animalCount * RESEARCH_PER_ANIMAL * welfareFactor);
  const conservationGained = Math.round(animalCount * CONSERVATION_PER_ANIMAL * welfareFactor);

  return {
    year: state.year,
    visitors,
    income,
    averageWelfare: Math.round(welfare),
    researchGained,
    conservationGained,
  };
}

// Applies a reviewed year result and advances the game to the next year.
export function applyYearResult(state: GameState, result: YearResult): GameState {
  return {
    year: state.year + 1,
    money: state.money + result.income,
    research: state.research + result.researchGained,
    conservation: state.conservation + result.conservationGained,
  };
}
