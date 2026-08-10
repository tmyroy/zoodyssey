import type { GridCell } from "./grid";
import { type ZooLayout, getObjectAt } from "./zoo";

export type AnimalSpeciesId = "lion" | "elephant" | "tortoise";

export interface AnimalSpecies {
  id: AnimalSpeciesId;
  name: string;
  minHabitatSize: number;
  minVegetation: number;
}

export const ANIMAL_SPECIES: Record<AnimalSpeciesId, AnimalSpecies> = {
  lion: { id: "lion", name: "Lion", minHabitatSize: 6, minVegetation: 2 },
  elephant: { id: "elephant", name: "Elephant", minHabitatSize: 10, minVegetation: 3 },
  tortoise: { id: "tortoise", name: "Tortoise", minHabitatSize: 4, minVegetation: 1 },
};

export interface AnimalLayout {
  animals: Map<string, AnimalSpeciesId>;
}

export interface WelfareResult {
  score: number;
  habitatSize: number;
  vegetationCount: number;
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

function countBorderingVegetation(zoo: ZooLayout, enclosure: GridCell[]): number {
  const enclosureKeys = new Set(enclosure.map(cellKey));
  const vegetationCells = new Set<string>();

  for (const cell of enclosure) {
    for (const neighbor of neighborsOf(cell)) {
      const key = cellKey(neighbor);
      if (enclosureKeys.has(key)) {
        continue;
      }
      if (getObjectAt(zoo, neighbor) === "vegetation") {
        vegetationCells.add(key);
      }
    }
  }

  return vegetationCells.size;
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
  const vegetationCount = countBorderingVegetation(zoo, enclosure);

  const spaceScore = needScore(enclosure.length, species.minHabitatSize);
  const vegetationScore = needScore(vegetationCount, species.minVegetation);
  const score = Math.round((spaceScore + vegetationScore) / 2);

  return { score, habitatSize: enclosure.length, vegetationCount };
}
