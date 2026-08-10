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
    id: "animal-giraffe",
    type: "animal",
    name: "Giraffe",
    description: "Unlocks the giraffe.",
    unlocks: "giraffe",
  },
  {
    id: "animal-penguin",
    type: "animal",
    name: "Penguin",
    description: "Unlocks the penguin.",
    unlocks: "penguin",
  },
  {
    id: "animal-bear",
    type: "animal",
    name: "Bear",
    description: "Unlocks the bear.",
    unlocks: "bear",
  },
  {
    id: "animal-zebra",
    type: "animal",
    name: "Zebra",
    description: "Unlocks the zebra.",
    unlocks: "zebra",
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
const PICK_LIMIT = 1;

// Year 0 runs once at the start of a run: a bigger offer, multiple picks,
// so the player starts a run with a real opening hand instead of one card.
export const YEAR_ZERO_OFFER_SIZE = 6;
export const YEAR_ZERO_PICK_LIMIT = 3;

export interface DraftState {
  unlockedCardIds: Set<string>;
  offer: Card[];
  // How many more cards can still be picked from the current offer.
  picksRemaining: number;
}

export function createDraftState(): DraftState {
  return { unlockedCardIds: new Set(), offer: [], picksRemaining: 0 };
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

export function generateOffer(
  state: DraftState,
  random: () => number = Math.random,
  offerSize: number = OFFER_SIZE,
): Card[] {
  return shuffle(availableCards(state), random).slice(0, offerSize);
}

// Starts a new year's draft by rolling a fresh offer from the remaining pool.
// The offer is empty once every card has been discovered.
export function startDraft(state: DraftState, random: () => number = Math.random): DraftState {
  return {
    unlockedCardIds: state.unlockedCardIds,
    offer: generateOffer(state, random, OFFER_SIZE),
    picksRemaining: PICK_LIMIT,
  };
}

// Starts the one-time Year 0 draft: a larger offer the player picks
// multiple cards from before Year 1 begins.
export function startYearZeroDraft(state: DraftState, random: () => number = Math.random): DraftState {
  return {
    unlockedCardIds: state.unlockedCardIds,
    offer: generateOffer(state, random, YEAR_ZERO_OFFER_SIZE),
    picksRemaining: YEAR_ZERO_PICK_LIMIT,
  };
}

// Unlocks the chosen card. If picks remain and cards are still on offer,
// the draft continues with the card removed from the offer; otherwise the
// offer clears and the draft ends.
export function pickCard(state: DraftState, cardId: string): DraftState {
  const card = state.offer.find((c) => c.id === cardId);
  if (!card) {
    return state;
  }

  const unlockedCardIds = new Set(state.unlockedCardIds);
  unlockedCardIds.add(card.id);

  const remainingOffer = state.offer.filter((c) => c.id !== cardId);
  const picksRemaining = state.picksRemaining - 1;
  const draftContinues = picksRemaining > 0 && remainingOffer.length > 0;

  return {
    unlockedCardIds,
    offer: draftContinues ? remainingOffer : [],
    picksRemaining: draftContinues ? picksRemaining : 0,
  };
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
