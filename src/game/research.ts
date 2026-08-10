import type { GameState } from "./simulation";

export type UpgradeId = "improved-feeding" | "marketing-campaign" | "conservation-program";

export interface Upgrade {
  id: UpgradeId;
  name: string;
  description: string;
  cost: number;
}

// A deliberately small set of research-purchasable improvements.
export const UPGRADES: Upgrade[] = [
  {
    id: "improved-feeding",
    name: "Improved Feeding",
    description: "Reduces animal upkeep costs.",
    cost: 8,
  },
  {
    id: "marketing-campaign",
    name: "Marketing Campaign",
    description: "Attracts more visitors per animal.",
    cost: 10,
  },
  {
    id: "conservation-program",
    name: "Conservation Program",
    description: "Increases conservation gained per animal.",
    cost: 12,
  },
];

export interface ResearchState {
  purchasedUpgrades: Set<UpgradeId>;
}

export function createResearchState(): ResearchState {
  return { purchasedUpgrades: new Set() };
}

export function isUpgradePurchased(state: ResearchState, id: UpgradeId): boolean {
  return state.purchasedUpgrades.has(id);
}

export function canPurchaseUpgrade(
  state: ResearchState,
  game: GameState,
  upgrade: Upgrade,
): boolean {
  return !isUpgradePurchased(state, upgrade.id) && game.research >= upgrade.cost;
}

export interface PurchaseResult {
  research: ResearchState;
  game: GameState;
}

// Spends research to unlock an upgrade, if affordable and not already owned.
export function purchaseUpgrade(
  state: ResearchState,
  game: GameState,
  upgradeId: UpgradeId,
): PurchaseResult {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade || !canPurchaseUpgrade(state, game, upgrade)) {
    return { research: state, game };
  }

  const purchasedUpgrades = new Set(state.purchasedUpgrades);
  purchasedUpgrades.add(upgradeId);

  return {
    research: { purchasedUpgrades },
    game: { ...game, research: game.research - upgrade.cost },
  };
}
