import { describe, expect, it } from "vitest";
import {
  CARD_POOL,
  YEAR_ZERO_OFFER_SIZE,
  YEAR_ZERO_PICK_LIMIT,
  availableCards,
  createDraftState,
  generateOffer,
  isFeatureUnlocked,
  isSpeciesUnlocked,
  pickCard,
  startDraft,
  startYearZeroDraft,
} from "./cards";

function fixedRandom(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("draft state", () => {
  it("starts with no unlocked cards and every card available", () => {
    const state = createDraftState();
    expect(state.unlockedCardIds.size).toBe(0);
    expect(availableCards(state)).toHaveLength(CARD_POOL.length);
  });

  it("has a card pool larger than the original 7", () => {
    expect(CARD_POOL.length).toBeGreaterThan(7);
  });

  it("has a unique id for every card", () => {
    const ids = CARD_POOL.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("basic tiles are always available even before any cards are drafted", () => {
    const state = createDraftState();
    expect(isFeatureUnlocked(state, "path")).toBe(true);
    expect(isFeatureUnlocked(state, "habitat")).toBe(true);
    expect(isFeatureUnlocked(state, "vegetation")).toBe(false);
  });

  it("no species are unlocked before any animal card is drafted", () => {
    const state = createDraftState();
    expect(isSpeciesUnlocked(state, "lion")).toBe(false);
  });
});

describe("generateOffer", () => {
  it("offers up to 3 cards from the available pool", () => {
    const state = createDraftState();
    const offer = generateOffer(state, fixedRandom(0));
    expect(offer.length).toBe(3);
  });

  it("never offers a card that has already been unlocked", () => {
    let state = createDraftState();
    state = pickCard({ ...state, offer: [CARD_POOL[0]] }, CARD_POOL[0].id);

    const offer = generateOffer(state, fixedRandom(0, 0.5, 0.9));
    expect(offer.find((card) => card.id === CARD_POOL[0].id)).toBeUndefined();
  });

  it("offers nothing once the whole pool has been unlocked", () => {
    let state = createDraftState();
    for (const card of CARD_POOL) {
      state = pickCard({ ...state, offer: [card] }, card.id);
    }
    expect(generateOffer(state)).toHaveLength(0);
  });
});

describe("pickCard", () => {
  it("unlocks the chosen card and clears the offer", () => {
    const state = startDraft(createDraftState(), fixedRandom(0));
    const chosen = state.offer[0];

    const next = pickCard(state, chosen.id);

    expect(next.unlockedCardIds.has(chosen.id)).toBe(true);
    expect(next.offer).toHaveLength(0);
  });

  it("unlocks the corresponding species or feature", () => {
    const state = createDraftState();
    const withOffer = { ...state, offer: [CARD_POOL.find((c) => c.id === "animal-lion")!] };
    const next = pickCard(withOffer, "animal-lion");
    expect(isSpeciesUnlocked(next, "lion")).toBe(true);
  });

  it("is a no-op when the card id is not in the current offer", () => {
    const state = startDraft(createDraftState(), fixedRandom(0));
    const next = pickCard(state, "not-a-real-card");
    expect(next).toEqual(state);
  });

  it("does not mutate the previous state", () => {
    const state = startDraft(createDraftState(), fixedRandom(0));
    const before = state.unlockedCardIds.size;
    pickCard(state, state.offer[0].id);
    expect(state.unlockedCardIds.size).toBe(before);
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
    expect(state.unlockedCardIds.has(first.id)).toBe(true);

    state = pickCard(state, second.id);
    expect(state.offer.length).toBe(YEAR_ZERO_OFFER_SIZE - 2);
    expect(state.unlockedCardIds.has(second.id)).toBe(true);

    state = pickCard(state, third.id);
    expect(state.unlockedCardIds.size).toBe(YEAR_ZERO_PICK_LIMIT);
  });

  it("ends the draft after the pick limit is reached", () => {
    let state = startYearZeroDraft(createDraftState(), fixedRandom(0));
    for (let i = 0; i < YEAR_ZERO_PICK_LIMIT; i++) {
      state = pickCard(state, state.offer[0].id);
    }
    expect(state.offer).toHaveLength(0);
    expect(state.unlockedCardIds.size).toBe(YEAR_ZERO_PICK_LIMIT);
  });

  it("leaves the normal per-year draft picking exactly one card", () => {
    const state = startDraft(createDraftState(), fixedRandom(0));
    const next = pickCard(state, state.offer[0].id);
    expect(next.offer).toHaveLength(0);
    expect(next.unlockedCardIds.size).toBe(1);
  });
});
