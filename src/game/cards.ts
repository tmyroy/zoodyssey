import type { AnimalSpeciesId } from "./animals";
import cardData from "./cards.json";
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
// Card content lives in cards.json so it can be edited without touching game logic.
export const CARD_POOL: Card[] = cardData as Card[];

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
