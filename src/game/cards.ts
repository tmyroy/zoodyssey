import type { AnimalSpeciesId } from "./animals";
import cardData from "./cards.json";
import type { GameState } from "./simulation";
import type { ZooObjectType } from "./zoo";

export type CardType = "animal" | "feature";

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  unlocks: AnimalSpeciesId | ZooObjectType;
  // Money cost to play the card from hand.
  cost: number;
  // Repeatable cards can be drafted more than once across a run; unique
  // cards (most animals, facilities) can only ever be drafted once.
  repeatable: boolean;
}

// Card content lives in cards.json so it can be edited without touching game logic.
export const CARD_POOL: Card[] = cardData as Card[];

const OFFER_SIZE = 3;
const PICK_LIMIT = 1;

// Year 0 runs once at the start of a run: a bigger offer, multiple picks,
// so the player starts a run with a real opening hand instead of one card.
export const YEAR_ZERO_OFFER_SIZE = 6;
export const YEAR_ZERO_PICK_LIMIT = 3;

export interface DraftState {
  // Cards drafted but not yet played. Repeatable cards may appear more than once.
  hand: Card[];
  // Unique cards already drafted, excluded from future offers. Repeatable
  // cards are never added here, so they can keep being offered/drafted.
  draftedUniqueCardIds: Set<string>;
  offer: Card[];
  // How many more cards can still be picked from the current offer.
  picksRemaining: number;
}

export function createDraftState(): DraftState {
  return { hand: [], draftedUniqueCardIds: new Set(), offer: [], picksRemaining: 0 };
}

export function availableCards(state: DraftState): Card[] {
  return CARD_POOL.filter((card) => card.repeatable || !state.draftedUniqueCardIds.has(card.id));
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
// The offer is empty once every unique card has been discovered.
export function startDraft(state: DraftState, random: () => number = Math.random): DraftState {
  return {
    hand: state.hand,
    draftedUniqueCardIds: state.draftedUniqueCardIds,
    offer: generateOffer(state, random, OFFER_SIZE),
    picksRemaining: PICK_LIMIT,
  };
}

// Starts the one-time Year 0 draft: a larger offer the player picks
// multiple cards from before Year 1 begins.
export function startYearZeroDraft(state: DraftState, random: () => number = Math.random): DraftState {
  return {
    hand: state.hand,
    draftedUniqueCardIds: state.draftedUniqueCardIds,
    offer: generateOffer(state, random, YEAR_ZERO_OFFER_SIZE),
    picksRemaining: YEAR_ZERO_PICK_LIMIT,
  };
}

// Adds the chosen card to the player's hand. If picks remain and cards are
// still on offer, the draft continues with the card removed from the offer;
// otherwise the offer clears and the draft ends.
export function pickCard(state: DraftState, cardId: string): DraftState {
  const card = state.offer.find((c) => c.id === cardId);
  if (!card) {
    return state;
  }

  const hand = [...state.hand, card];
  const draftedUniqueCardIds = card.repeatable
    ? state.draftedUniqueCardIds
    : new Set(state.draftedUniqueCardIds).add(card.id);

  const remainingOffer = state.offer.filter((c) => c.id !== cardId);
  const picksRemaining = state.picksRemaining - 1;
  const draftContinues = picksRemaining > 0 && remainingOffer.length > 0;

  return {
    hand,
    draftedUniqueCardIds,
    offer: draftContinues ? remainingOffer : [],
    picksRemaining: draftContinues ? picksRemaining : 0,
  };
}

export function canPlayCard(state: DraftState, game: GameState, cardId: string): boolean {
  const card = state.hand.find((c) => c.id === cardId);
  return card !== undefined && game.money >= card.cost;
}

export interface PlayCardResult {
  draft: DraftState;
  game: GameState;
  // The played card, or null if it wasn't in hand or couldn't be afforded
  // (the caller should treat that as a no-op).
  playedCard: Card | null;
}

// Spends money to play a card out of hand. The caller is responsible for
// turning the returned card into the actual zoo object (placed tile/animal)
// once it knows placement will succeed.
export function playCard(state: DraftState, game: GameState, cardId: string): PlayCardResult {
  const index = state.hand.findIndex((c) => c.id === cardId);
  const card = index === -1 ? undefined : state.hand[index];
  if (!card || game.money < card.cost) {
    return { draft: state, game, playedCard: null };
  }

  const hand = [...state.hand.slice(0, index), ...state.hand.slice(index + 1)];
  return {
    draft: { ...state, hand },
    game: { ...game, money: game.money - card.cost },
    playedCard: card,
  };
}
