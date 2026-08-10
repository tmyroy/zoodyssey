import type { AnimalSpeciesId } from "./animals";
import type { ZooObjectType } from "./zoo";

export type CardType = "animal" | "feature";

export type UnlockableFeature = Exclude<ZooObjectType, "path" | "habitat">;

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  unlocks: AnimalSpeciesId | UnlockableFeature;
}

// Path and habitat tiles are basic zoo infrastructure and are always
// available; everything else must be discovered through the card draft.
export const CARD_POOL: Card[] = [
  { id: "animal-lion", type: "animal", name: "Lion", description: "Unlocks the lion.", unlocks: "lion" },
  {
    id: "animal-elephant",
    type: "animal",
    name: "Elephant",
    description: "Unlocks the elephant.",
    unlocks: "elephant",
  },
  {
    id: "animal-tortoise",
    type: "animal",
    name: "Tortoise",
    description: "Unlocks the tortoise.",
    unlocks: "tortoise",
  },
  {
    id: "feature-vegetation",
    type: "feature",
    name: "Vegetation",
    description: "Unlocks vegetation tiles.",
    unlocks: "vegetation",
  },
  {
    id: "feature-water",
    type: "feature",
    name: "Water Feature",
    description: "Unlocks water tiles.",
    unlocks: "water",
  },
  {
    id: "feature-shelter",
    type: "feature",
    name: "Shelter",
    description: "Unlocks shelter tiles.",
    unlocks: "shelter",
  },
  {
    id: "feature-enrichment",
    type: "feature",
    name: "Enrichment",
    description: "Unlocks enrichment tiles.",
    unlocks: "enrichment",
  },
];

const OFFER_SIZE = 3;

export interface DraftState {
  unlockedCardIds: Set<string>;
  offer: Card[];
}

export function createDraftState(): DraftState {
  return { unlockedCardIds: new Set(), offer: [] };
}

export function availableCards(state: DraftState): Card[] {
  return CARD_POOL.filter((card) => !state.unlockedCardIds.has(card.id));
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateOffer(state: DraftState, random: () => number = Math.random): Card[] {
  return shuffle(availableCards(state), random).slice(0, OFFER_SIZE);
}

// Starts a new year's draft by rolling a fresh offer from the remaining pool.
// Returns the same offer (empty) once every card has been discovered.
export function startDraft(state: DraftState, random: () => number = Math.random): DraftState {
  return { unlockedCardIds: state.unlockedCardIds, offer: generateOffer(state, random) };
}

export function pickCard(state: DraftState, cardId: string): DraftState {
  const card = state.offer.find((c) => c.id === cardId);
  if (!card) {
    return state;
  }

  const unlockedCardIds = new Set(state.unlockedCardIds);
  unlockedCardIds.add(card.id);
  return { unlockedCardIds, offer: [] };
}

export function isSpeciesUnlocked(state: DraftState, species: AnimalSpeciesId): boolean {
  return state.unlockedCardIds.has(`animal-${species}`);
}

export function isFeatureUnlocked(state: DraftState, feature: ZooObjectType): boolean {
  if (feature === "path" || feature === "habitat") {
    return true;
  }
  return state.unlockedCardIds.has(`feature-${feature}`);
}
