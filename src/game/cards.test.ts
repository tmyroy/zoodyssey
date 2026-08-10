import { describe, expect, it } from "vitest";
import {
  CARD_POOL,
  YEAR_ZERO_OFFER_SIZE,
  YEAR_ZERO_PICK_LIMIT,
  availableCards,
  canPlayCard,
  createDraftState,
  generateOffer,
  pickCard,
  playCard,
  startDraft,
  startYearZeroDraft,
} from "./cards";
import { createInitialGameState } from "./simulation";

function fixedRandom(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

const UNIQUE_CARD = CARD_POOL.find((c) => !c.repeatable)!;
const REPEATABLE_CARD = CARD_POOL.find((c) => c.repeatable)!;

describe("draft state", () => {
  it("starts with an empty hand and every card available", () => {
    const state = createDraftState();
    expect(state.hand).toHaveLength(0);
    expect(availableCards(state)).toHaveLength(CARD_POOL.length);
  });

  it("has a card pool larger than the original 7", () => {
    expect(CARD_POOL.length).toBeGreaterThan(7);
  });

  it("has a unique id for every card", () => {
    const ids = CARD_POOL.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every card a positive cost and a repeatable flag", () => {
    for (const card of CARD_POOL) {
      expect(card.cost).toBeGreaterThan(0);
      expect(typeof card.repeatable).toBe("boolean");
    }
  });
});

describe("generateOffer", () => {
  it("offers up to 3 cards from the available pool", () => {
    const state = createDraftState();
    const offer = generateOffer(state, fixedRandom(0));
    expect(offer.length).toBe(3);
  });

  it("never offers a unique card that has already been drafted", () => {
    let state = createDraftState();
    state = pickCard({ ...state, offer: [UNIQUE_CARD] }, UNIQUE_CARD.id);

    const offer = generateOffer(state, fixedRandom(0, 0.5, 0.9));
    expect(offer.find((card) => card.id === UNIQUE_CARD.id)).toBeUndefined();
  });

  it("keeps offering a repeatable card after it has been drafted", () => {
    let state = createDraftState();
    state = pickCard({ ...state, offer: [REPEATABLE_CARD] }, REPEATABLE_CARD.id);

    expect(availableCards(state).some((card) => card.id === REPEATABLE_CARD.id)).toBe(true);
  });

  it("offers nothing once every unique card has been drafted", () => {
    let state = createDraftState();
    for (const card of CARD_POOL.filter((c) => !c.repeatable)) {
      state = pickCard({ ...state, offer: [card] }, card.id);
    }

    const remaining = availableCards(state);
    expect(remaining.every((card) => card.repeatable)).toBe(true);
    expect(remaining.length).toBe(CARD_POOL.filter((c) => c.repeatable).length);
  });
});

describe("pickCard", () => {
  it("adds the chosen card to hand and clears the offer", () => {
    const state = startDraft(createDraftState(), fixedRandom(0));
    const chosen = state.offer[0];

    const next = pickCard(state, chosen.id);

    expect(next.hand.map((c) => c.id)).toContain(chosen.id);
    expect(next.offer).toHaveLength(0);
  });

  it("marks a unique card as drafted so it won't be offered again", () => {
    const state = createDraftState();
    const withOffer = { ...state, offer: [UNIQUE_CARD] };
    const next = pickCard(withOffer, UNIQUE_CARD.id);
    expect(next.draftedUniqueCardIds.has(UNIQUE_CARD.id)).toBe(true);
  });

  it("does not mark a repeatable card as drafted", () => {
    const state = createDraftState();
    const withOffer = { ...state, offer: [REPEATABLE_CARD] };
    const next = pickCard(withOffer, REPEATABLE_CARD.id);
    expect(next.draftedUniqueCardIds.has(REPEATABLE_CARD.id)).toBe(false);
  });

  it("is a no-op when the card id is not in the current offer", () => {
    const state = startDraft(createDraftState(), fixedRandom(0));
    const next = pickCard(state, "not-a-real-card");
    expect(next).toEqual(state);
  });

  it("does not mutate the previous state", () => {
    const state = startDraft(createDraftState(), fixedRandom(0));
    const before = state.hand.length;
    pickCard(state, state.offer[0].id);
    expect(state.hand.length).toBe(before);
  });
});

describe("canPlayCard / playCard", () => {
  it("cannot play a card that is not in hand", () => {
    const state = createDraftState();
    const game = createInitialGameState();
    expect(canPlayCard(state, game, UNIQUE_CARD.id)).toBe(false);
  });

  it("cannot play a card that is too expensive", () => {
    const state = { ...createDraftState(), hand: [UNIQUE_CARD] };
    const game = { ...createInitialGameState(), money: UNIQUE_CARD.cost - 1 };
    expect(canPlayCard(state, game, UNIQUE_CARD.id)).toBe(false);
  });

  it("can play an affordable card that is in hand", () => {
    const state = { ...createDraftState(), hand: [UNIQUE_CARD] };
    const game = { ...createInitialGameState(), money: UNIQUE_CARD.cost };
    expect(canPlayCard(state, game, UNIQUE_CARD.id)).toBe(true);
  });

  it("deducts the cost and removes the card from hand when played", () => {
    const state = { ...createDraftState(), hand: [UNIQUE_CARD] };
    const game = { ...createInitialGameState(), money: 20 };

    const result = playCard(state, game, UNIQUE_CARD.id);

    expect(result.playedCard?.id).toBe(UNIQUE_CARD.id);
    expect(result.game.money).toBe(20 - UNIQUE_CARD.cost);
    expect(result.draft.hand).toHaveLength(0);
  });

  it("is a no-op and returns a null playedCard when unaffordable", () => {
    const state = { ...createDraftState(), hand: [UNIQUE_CARD] };
    const game = { ...createInitialGameState(), money: 0 };

    const result = playCard(state, game, UNIQUE_CARD.id);

    expect(result.playedCard).toBeNull();
    expect(result.game.money).toBe(0);
    expect(result.draft.hand).toHaveLength(1);
  });

  it("only removes one instance when multiple copies are in hand", () => {
    const state = { ...createDraftState(), hand: [REPEATABLE_CARD, REPEATABLE_CARD] };
    const game = { ...createInitialGameState(), money: 20 };

    const result = playCard(state, game, REPEATABLE_CARD.id);

    expect(result.draft.hand).toHaveLength(1);
  });

  it("does not mutate the previous draft or game state", () => {
    const state = { ...createDraftState(), hand: [UNIQUE_CARD] };
    const game = { ...createInitialGameState(), money: 20 };

    playCard(state, game, UNIQUE_CARD.id);

    expect(state.hand).toHaveLength(1);
    expect(game.money).toBe(20);
  });
});

describe("startYearZeroDraft", () => {
  it("offers more cards than a normal year's draft", () => {
    const yearZero = startYearZeroDraft(createDraftState(), fixedRandom(0));
    const normalYear = startDraft(createDraftState(), fixedRandom(0));
    expect(yearZero.offer.length).toBe(YEAR_ZERO_OFFER_SIZE);
    expect(yearZero.offer.length).toBeGreaterThan(normalYear.offer.length);
  });

  it("allows picking multiple cards from the same offer", () => {
    let state = startYearZeroDraft(createDraftState(), fixedRandom(0));
    const [first, second, third] = state.offer;

    state = pickCard(state, first.id);
    expect(state.offer.length).toBe(YEAR_ZERO_OFFER_SIZE - 1);
    expect(state.hand.map((c) => c.id)).toContain(first.id);

    state = pickCard(state, second.id);
    expect(state.offer.length).toBe(YEAR_ZERO_OFFER_SIZE - 2);
    expect(state.hand.map((c) => c.id)).toContain(second.id);

    state = pickCard(state, third.id);
    expect(state.hand).toHaveLength(YEAR_ZERO_PICK_LIMIT);
  });

  it("ends the draft after the pick limit is reached", () => {
    let state = startYearZeroDraft(createDraftState(), fixedRandom(0));
    for (let i = 0; i < YEAR_ZERO_PICK_LIMIT; i++) {
      state = pickCard(state, state.offer[0].id);
    }
    expect(state.offer).toHaveLength(0);
    expect(state.hand).toHaveLength(YEAR_ZERO_PICK_LIMIT);
  });

  it("leaves the normal per-year draft picking exactly one card", () => {
    const state = startDraft(createDraftState(), fixedRandom(0));
    const next = pickCard(state, state.offer[0].id);
    expect(next.offer).toHaveLength(0);
    expect(next.hand).toHaveLength(1);
  });
});
