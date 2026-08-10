import { describe, expect, it } from "vitest";
import {
  UPGRADES,
  canPurchaseUpgrade,
  createResearchState,
  isUpgradePurchased,
  purchaseUpgrade,
} from "./research";
import { createInitialGameState } from "./simulation";

describe("research state", () => {
  it("starts with no upgrades purchased", () => {
    const state = createResearchState();
    for (const upgrade of UPGRADES) {
      expect(isUpgradePurchased(state, upgrade.id)).toBe(false);
    }
  });
});

describe("canPurchaseUpgrade", () => {
  it("is false when research is insufficient", () => {
    const research = createResearchState();
    const game = { ...createInitialGameState(), research: 0 };
    expect(canPurchaseUpgrade(research, game, UPGRADES[0])).toBe(false);
  });

  it("is true when research covers the cost", () => {
    const research = createResearchState();
    const game = { ...createInitialGameState(), research: UPGRADES[0].cost };
    expect(canPurchaseUpgrade(research, game, UPGRADES[0])).toBe(true);
  });

  it("is false once already purchased", () => {
    const game = { ...createInitialGameState(), research: 100 };
    const { research } = purchaseUpgrade(createResearchState(), game, UPGRADES[0].id);
    expect(canPurchaseUpgrade(research, game, UPGRADES[0])).toBe(false);
  });
});

describe("purchaseUpgrade", () => {
  it("deducts the cost and marks the upgrade purchased", () => {
    const research = createResearchState();
    const game = { ...createInitialGameState(), research: 20 };

    const result = purchaseUpgrade(research, game, UPGRADES[0].id);

    expect(isUpgradePurchased(result.research, UPGRADES[0].id)).toBe(true);
    expect(result.game.research).toBe(20 - UPGRADES[0].cost);
  });

  it("is a no-op when research is insufficient", () => {
    const research = createResearchState();
    const game = { ...createInitialGameState(), research: 0 };

    const result = purchaseUpgrade(research, game, UPGRADES[0].id);

    expect(isUpgradePurchased(result.research, UPGRADES[0].id)).toBe(false);
    expect(result.game.research).toBe(0);
  });

  it("does not mutate the previous state", () => {
    const research = createResearchState();
    const game = { ...createInitialGameState(), research: 20 };

    purchaseUpgrade(research, game, UPGRADES[0].id);

    expect(research.purchasedUpgrades.size).toBe(0);
    expect(game.research).toBe(20);
  });
});
