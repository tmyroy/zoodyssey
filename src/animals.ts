import type { GridCell } from "./grid";
import { type ZooLayout, type ZooObjectType, getObjectAt } from "./zoo";

export type AnimalSpeciesId = "lion" | "elephant" | "tortoise";

export type NeedKey = "space" | "vegetation" | "water" | "shelter" | "enrichment";

export type HabitatNeeds = Record<NeedKey, number>;

export interface AnimalSpecies {
  id: AnimalSpeciesId;
  name: string;
  // Minimum amount of each need for a fully satisfied habitat.
  requirements: HabitatNeeds;
  // Relative importance of each need to this species' overall welfare (weights sum to 100).
  weights: HabitatNeeds;
}

export const ANIMAL_SPECIES: Record<AnimalSpeciesId, AnimalSpecies> = {
  lion: {
    id: "lion",
    name: "Lion",
    requirements: { space: 6, vegetation: 1, water: 1, shelter: 2, enrichment: 2 },
    weights: { space: 35, vegetation: 10, water: 15, shelter: 20, enrichment: 20 },
  },
  elephant: {
    id: "elephant",
    name: "Elephant",
    requirements: { space: 10, vegetation: 2, water: 3, shelter: 1, enrichment: 2 },
    weights: { space: 30, vegetation: 15, water: 30, shelter: 10, enrichment: 15 },
  },
  tortoise: {
    id: "tortoise",
    name: "Tortoise",
    requirements: { space: 4, vegetation: 2, water: 1, shelter: 2, enrichment: 1 },
    weights: { space: 20, vegetation: 20, water: 10, shelter: 35, enrichment: 15 },
  },
};

// Tile type that satisfies each need, other than "space" which is the habitat enclosure itself.
const NEED_OBJECT_TYPE: Record<Exclude<NeedKey, "space">, ZooObjectType> = {
  vegetation: "vegetation",
  water: "water",
  shelter: "shelter",
  enrichment: "enrichment",
};

export interface AnimalLayout {
  animals: Map<string, AnimalSpeciesId>;
}

export interface NeedBreakdown {
  need: NeedKey;
  required: number;
  actual: number;
  weight: number;
  score: number;
}

export interface WelfareResult {
  score: number;
  needs: NeedBreakdown[];
}

function cellKey(cell: GridCell): string {
  return `${cell.col},${cell.row}`;
}

function neighborsOf(cell: GridCell): GridCell[] {
  return [
    { col: cell.col + 1, row: cell.row },
    { col: cell.col - 1, row: cell.row },
    { col: cell.col, row: cell.row + 1 },
    { col: cell.col, row: cell.row - 1 },
  ];
}

export function createAnimalLayout(): AnimalLayout {
  return { animals: new Map() };
}

export function getAnimalAt(layout: AnimalLayout, cell: GridCell): AnimalSpeciesId | undefined {
  return layout.animals.get(cellKey(cell));
}

export function canPlaceAnimal(zoo: ZooLayout, animals: AnimalLayout, cell: GridCell): boolean {
  return getObjectAt(zoo, cell) === "habitat" && !animals.animals.has(cellKey(cell));
}

export function placeAnimal(
  zoo: ZooLayout,
  animals: AnimalLayout,
  cell: GridCell,
  species: AnimalSpeciesId,
): boolean {
  if (!canPlaceAnimal(zoo, animals, cell)) {
    return false;
  }
  animals.animals.set(cellKey(cell), species);
  return true;
}

export function removeAnimal(animals: AnimalLayout, cell: GridCell): boolean {
  return animals.animals.delete(cellKey(cell));
}

// The contiguous group of habitat tiles the animal can roam, found via flood fill.
function getHabitatEnclosure(zoo: ZooLayout, start: GridCell): GridCell[] {
  const visited = new Set<string>();
  const stack: GridCell[] = [start];
  const enclosure: GridCell[] = [];

  while (stack.length > 0) {
    const cell = stack.pop()!;
    const key = cellKey(cell);
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    if (getObjectAt(zoo, cell) !== "habitat") {
      continue;
    }
    enclosure.push(cell);

    for (const neighbor of neighborsOf(cell)) {
      if (!visited.has(cellKey(neighbor))) {
        stack.push(neighbor);
      }
    }
  }

  return enclosure;
}

function countBorderingType(zoo: ZooLayout, enclosure: GridCell[], type: ZooObjectType): number {
  const enclosureKeys = new Set(enclosure.map(cellKey));
  const matchingCells = new Set<string>();

  for (const cell of enclosure) {
    for (const neighbor of neighborsOf(cell)) {
      const key = cellKey(neighbor);
      if (enclosureKeys.has(key)) {
        continue;
      }
      if (getObjectAt(zoo, neighbor) === type) {
        matchingCells.add(key);
      }
    }
  }

  return matchingCells.size;
}

function needScore(actual: number, required: number): number {
  if (required <= 0) {
    return 100;
  }
  return Math.min(100, (actual / required) * 100);
}

export function calculateWelfare(
  zoo: ZooLayout,
  animals: AnimalLayout,
  cell: GridCell,
): WelfareResult | undefined {
  const speciesId = getAnimalAt(animals, cell);
  if (!speciesId) {
    return undefined;
  }

  const species = ANIMAL_SPECIES[speciesId];
  const enclosure = getHabitatEnclosure(zoo, cell);

  const actuals: HabitatNeeds = {
    space: enclosure.length,
    vegetation: countBorderingType(zoo, enclosure, NEED_OBJECT_TYPE.vegetation),
    water: countBorderingType(zoo, enclosure, NEED_OBJECT_TYPE.water),
    shelter: countBorderingType(zoo, enclosure, NEED_OBJECT_TYPE.shelter),
    enrichment: countBorderingType(zoo, enclosure, NEED_OBJECT_TYPE.enrichment),
  };

  const needs: NeedBreakdown[] = (Object.keys(actuals) as NeedKey[]).map((need) => ({
    need,
    required: species.requirements[need],
    actual: actuals[need],
    weight: species.weights[need],
    score: needScore(actuals[need], species.requirements[need]),
  }));

  const totalWeight = needs.reduce((sum, n) => sum + n.weight, 0);
  const weightedScore =
    totalWeight === 0 ? 100 : needs.reduce((sum, n) => sum + n.score * n.weight, 0) / totalWeight;

  return { score: Math.round(weightedScore), needs };
}
