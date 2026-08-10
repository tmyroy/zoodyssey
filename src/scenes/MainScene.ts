import Phaser from "phaser";
import {
  type AnimalLayout,
  type AnimalSpeciesId,
  type WelfareResult,
  ANIMAL_SPECIES,
  calculateWelfare,
  canPlaceAnimal,
  createAnimalLayout,
  getAnimalAt,
  placeAnimal,
  removeAnimal,
} from "../game/animals";
import {
  type Card,
  type DraftState,
  createDraftState,
  pickCard,
  playCard,
  startDraft,
  startYearZeroDraft,
} from "../game/cards";
import { type GridCell, CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, createGridCells, getCellAtPosition } from "../game/grid";
import { drawAnimalIcon, drawTileIcon } from "./icons";
import {
  type ResearchState,
  type UpgradeId,
  UPGRADES,
  canPurchaseUpgrade,
  createResearchState,
  isUpgradePurchased,
  purchaseUpgrade,
} from "../game/research";
import { RUN_LENGTH_YEARS, type RunStatus, evaluateRun, isRunComplete } from "../game/run";
import {
  type GameState,
  type YearResult,
  applyYearResult,
  createInitialGameState,
  simulateYear,
} from "../game/simulation";
import {
  type ZooLayout,
  type ZooObjectType,
  canPlaceObject,
  createZooLayout,
  getObjectAt,
  placeObject,
  removeObject,
} from "../game/zoo";

// What's currently selected to place on the grid: a specific hand card
// (by id), erase mode, or nothing.
type Selection = string | "erase" | null;
type Phase = "draft" | "build" | "results" | "run-complete";

// Layout: a side menu of tools sits left of the grid, a top bar shows status
// and the resource HUD, and a bottom bar shows either draft cards or the
// current details panel plus a single action button.
export const SIDE_MENU_WIDTH = 170;
export const TOP_BAR_HEIGHT = 40;
export const BOTTOM_BAR_HEIGHT = 150;
export const GRID_ORIGIN_X = SIDE_MENU_WIDTH;
export const GRID_ORIGIN_Y = TOP_BAR_HEIGHT;
export const CANVAS_WIDTH = SIDE_MENU_WIDTH + GRID_WIDTH * CELL_SIZE;
export const CANVAS_HEIGHT = TOP_BAR_HEIGHT + GRID_HEIGHT * CELL_SIZE + BOTTOM_BAR_HEIGHT;

const BUTTON_HEIGHT = 28;
const BUTTON_GAP = 4;
const SECTION_GAP = 10;

const OBJECT_COLORS: Record<ZooObjectType, number> = {
  path: 0xc2b280,
  vegetation: 0x1f7a1f,
  habitat: 0x8b5a2b,
  water: 0x2a6fb0,
  shelter: 0x7a6a58,
  enrichment: 0xb35fc2,
};

const ANIMAL_COLORS: Record<AnimalSpeciesId, number> = {
  lion: 0xe0a030,
  elephant: 0x8f8f9a,
  tortoise: 0x5aa06a,
  giraffe: 0xd9b13c,
  penguin: 0x2f3a4a,
  bear: 0x6b4a35,
  zebra: 0xe8e8e8,
};

interface Button {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  swatch?: Phaser.GameObjects.Rectangle;
}

export class MainScene extends Phaser.Scene {
  private layout!: ZooLayout;
  private animals!: AnimalLayout;
  private gameState!: GameState;
  private draftState!: DraftState;
  private researchState!: ResearchState;
  private phase: Phase = "draft";
  private isYearZeroDraft = false;
  private lastResult: YearResult | null = null;
  private selection: Selection = null;
  private paused = false;

  private objectsGraphics!: Phaser.GameObjects.Graphics;
  private animalsGraphics!: Phaser.GameObjects.Graphics;
  private welfareTexts: Phaser.GameObjects.Text[] = [];

  private topBarText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private detailsText!: Phaser.GameObjects.Text;
  private actionButton!: Button;
  private eraseButton!: Button;
  private draftCardButtons: Button[] = [];
  private handCardButtons: Button[] = [];
  private handSectionY = 0;
  private upgradeButtons = new Map<UpgradeId, Button>();

  private pauseOverlay!: Phaser.GameObjects.Rectangle;
  private pausePanel!: Phaser.GameObjects.Rectangle;
  private pauseTitle!: Phaser.GameObjects.Text;
  private pauseMenuButtons: Button[] = [];

  constructor() {
    super("MainScene");
  }

  create(): void {
    this.drawGrid();
    this.objectsGraphics = this.add.graphics();
    this.animalsGraphics = this.add.graphics();

    this.topBarText = this.add.text(8, 8, "", {
      fontSize: "14px",
      color: "#ffffff",
      wordWrap: { width: CANVAS_WIDTH - 270 },
    });

    this.hudText = this.add.text(CANVAS_WIDTH - 180, 4, "", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 4, y: 2 },
      align: "right",
    });

    this.createButton(CANVAS_WIDTH - 258, 4, 70, 28, "Pause", () => this.togglePause());

    const detailsWidth = GRID_WIDTH * CELL_SIZE - 150 - 24;
    this.detailsText = this.add.text(GRID_ORIGIN_X + 8, GRID_ORIGIN_Y + GRID_HEIGHT * CELL_SIZE + 10, "", {
      fontSize: "12px",
      color: "#ffffff",
      lineSpacing: 4,
      wordWrap: { width: detailsWidth },
    });

    this.actionButton = this.createButton(
      GRID_ORIGIN_X + GRID_WIDTH * CELL_SIZE - 158,
      GRID_ORIGIN_Y + GRID_HEIGHT * CELL_SIZE + 10,
      150,
      BOTTOM_BAR_HEIGHT - 20,
      "",
      () => this.handleEnter(),
    );

    this.buildSideMenu();
    this.buildPauseMenu();
    this.bindKeyboard();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer.x, pointer.y);
    });

    this.startNewRun();
  }

  private buildPauseMenu(): void {
    this.pauseOverlay = this.add
      .rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setDepth(1000)
      .setVisible(false);

    const panelWidth = 260;
    const panelHeight = 300;
    const panelX = CANVAS_WIDTH / 2 - panelWidth / 2;
    const panelY = CANVAS_HEIGHT / 2 - panelHeight / 2;

    this.pausePanel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, 0x2a2a2a, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x666666)
      .setDepth(1001)
      .setVisible(false);

    this.pauseTitle = this.add
      .text(CANVAS_WIDTH / 2, panelY + 26, "Paused", { fontSize: "20px", color: "#ffffff" })
      .setOrigin(0.5, 0.5)
      .setDepth(1002)
      .setVisible(false);

    const buttonWidth = panelWidth - 40;
    const buttonX = panelX + 20;
    let y = panelY + 60;

    const entries: { label: string; onClick: () => void; enabled: boolean }[] = [
      { label: "Resume", onClick: () => this.togglePause(), enabled: true },
      { label: "Restart Game", onClick: () => this.handleRestart(), enabled: true },
      { label: "Save Game", onClick: () => {}, enabled: false },
      { label: "Load Game", onClick: () => {}, enabled: false },
      { label: "Settings", onClick: () => {}, enabled: false },
    ];

    for (const entry of entries) {
      const button = this.createButton(buttonX, y, buttonWidth, BUTTON_HEIGHT + 10, entry.label, entry.onClick);
      button.bg.setDepth(1002).setVisible(false);
      button.label.setDepth(1003).setVisible(false);
      if (!entry.enabled) {
        button.bg.disableInteractive();
        button.bg.setFillStyle(0x1a1a1a, 1);
        button.label.setColor("#666666");
        button.label.setText(`${entry.label} (coming soon)`);
      }
      this.pauseMenuButtons.push(button);
      y += BUTTON_HEIGHT + 10 + 10;
    }
  }

  private togglePause(): void {
    this.setPauseVisible(!this.paused);
  }

  private handleRestart(): void {
    this.setPauseVisible(false);
    this.startNewRun();
  }

  private setPauseVisible(visible: boolean): void {
    this.paused = visible;
    this.pauseOverlay.setVisible(visible);
    this.pausePanel.setVisible(visible);
    this.pauseTitle.setVisible(visible);
    for (const button of this.pauseMenuButtons) {
      button.bg.setVisible(visible);
      button.label.setVisible(visible);
    }

    if (visible) {
      this.pauseOverlay.setInteractive({ useHandCursor: false });
    } else {
      this.pauseOverlay.disableInteractive();
    }
  }

  private bindKeyboard(): void {
    this.input.keyboard?.on("keydown-ESC", () => this.togglePause());
    this.input.keyboard?.on("keydown-ONE", () => this.handleDraftPick(0));
    this.input.keyboard?.on("keydown-TWO", () => this.handleDraftPick(1));
    this.input.keyboard?.on("keydown-THREE", () => this.handleDraftPick(2));
    this.input.keyboard?.on("keydown-ZERO", () => this.selectErase());
    this.input.keyboard?.on("keydown-ENTER", () => this.handleEnter());
    this.input.keyboard?.on("keydown-Q", () => this.handleUpgradeKey(0));
    this.input.keyboard?.on("keydown-W", () => this.handleUpgradeKey(1));
    this.input.keyboard?.on("keydown-E", () => this.handleUpgradeKey(2));
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    swatchColor?: number,
  ): Button {
    const bg = this.add
      .rectangle(x, y, width, height, 0x3a3a3a, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x666666)
      .setInteractive({ useHandCursor: true });
    bg.on("pointerdown", onClick);

    const swatch =
      swatchColor !== undefined
        ? this.add.rectangle(x + 5, y + 5, 10, 10, swatchColor, 1).setOrigin(0, 0).setStrokeStyle(1, 0x000000)
        : undefined;

    const text = this.add
      .text(x + width / 2, y + height / 2, label, {
        fontSize: "13px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: width - 8 },
      })
      .setOrigin(0.5, 0.5);

    return { bg, label: text, swatch };
  }

  // Static part of the side menu: Erase, then research upgrades. The
  // player's hand is dynamic (grows/shrinks as cards are drafted/played)
  // and is rendered below this block — see updateHandCards().
  private buildSideMenu(): void {
    const x = 8;
    const width = SIDE_MENU_WIDTH - 16;
    let y = GRID_ORIGIN_Y + 8;

    const eraseButton = this.createButton(x, y, width, BUTTON_HEIGHT, "Erase", () => this.selectErase());
    this.eraseButton = eraseButton;
    y += BUTTON_HEIGHT + BUTTON_GAP + SECTION_GAP;

    for (const upgrade of UPGRADES) {
      const button = this.createButton(x, y, width, BUTTON_HEIGHT, "", () =>
        this.purchaseUpgrade(upgrade.id),
      );
      this.upgradeButtons.set(upgrade.id, button);
      y += BUTTON_HEIGHT + BUTTON_GAP;
    }

    y += SECTION_GAP;
    this.handSectionY = y;
  }

  private startNewRun(): void {
    this.layout = createZooLayout(GRID_WIDTH, GRID_HEIGHT);
    this.animals = createAnimalLayout();
    this.gameState = createInitialGameState();
    this.draftState = createDraftState();
    this.researchState = createResearchState();
    this.lastResult = null;

    this.runYearZeroDraft();
    this.refresh();
  }

  private handleDraftPick(offerIndex: number): void {
    if (this.paused) {
      return;
    }
    const card = this.draftState.offer[offerIndex];
    if (!card) {
      return;
    }
    this.draftState = pickCard(this.draftState, card.id);
    // The draft continues if pickCard left cards on offer (Year 0's
    // multi-pick draft); otherwise move on to the build phase.
    this.phase = this.draftState.offer.length > 0 ? "draft" : "build";
    this.refresh();
  }

  // The one-time Year 0 draft: a bigger offer, multiple picks, before Year 1 begins.
  private runYearZeroDraft(): void {
    this.isYearZeroDraft = true;
    this.draftState = startYearZeroDraft(this.draftState);
    this.phase = this.draftState.offer.length > 0 ? "draft" : "build";
  }

  private startYearDraft(): void {
    this.isYearZeroDraft = false;
    this.draftState = startDraft(this.draftState);
    this.phase = this.draftState.offer.length > 0 ? "draft" : "build";
  }

  private selectErase(): void {
    if (this.paused || this.phase !== "build") {
      return;
    }
    this.selection = "erase";
    this.refresh();
  }

  private selectHandCard(cardId: string): void {
    if (this.paused || this.phase !== "build") {
      return;
    }
    this.selection = cardId;
    this.refresh();
  }

  private purchaseUpgrade(id: UpgradeId): void {
    if (this.paused || this.phase !== "build") {
      return;
    }
    const result = purchaseUpgrade(this.researchState, this.gameState, id);
    this.researchState = result.research;
    this.gameState = result.game;
    this.refresh();
  }

  private handleUpgradeKey(index: number): void {
    const upgrade = UPGRADES[index];
    if (upgrade) {
      this.purchaseUpgrade(upgrade.id);
    }
  }

  private handleEnter(): void {
    if (this.paused) {
      return;
    }
    if (this.phase === "build") {
      this.lastResult = simulateYear(this.gameState, this.layout, this.animals, this.researchState);
      this.phase = "results";
    } else if (this.phase === "results" && this.lastResult) {
      this.gameState = applyYearResult(this.gameState, this.lastResult);
      this.lastResult = null;
      if (isRunComplete(this.gameState)) {
        this.phase = "run-complete";
      } else {
        this.startYearDraft();
      }
    } else if (this.phase === "run-complete") {
      this.startNewRun();
      return;
    }

    this.refresh();
  }

  private isAnimalCard(card: Card): boolean {
    return card.type === "animal";
  }

  private handlePointerDown(x: number, y: number): void {
    if (this.paused || this.phase !== "build") {
      return;
    }

    const cell = getCellAtPosition(x - GRID_ORIGIN_X, y - GRID_ORIGIN_Y, GRID_WIDTH, GRID_HEIGHT);
    if (!cell) {
      return;
    }

    if (this.selection === "erase") {
      removeAnimal(this.animals, cell);
      removeObject(this.layout, cell);
      this.refresh();
      return;
    }

    if (this.selection === null) {
      return;
    }

    const card = this.draftState.hand.find((c) => c.id === this.selection);
    if (!card) {
      // Selection is stale (e.g. the last copy was already played elsewhere).
      this.selection = null;
      this.refresh();
      return;
    }

    const canPlace = this.isAnimalCard(card)
      ? canPlaceAnimal(this.layout, this.animals, cell)
      : canPlaceObject(this.layout, cell);
    if (!canPlace) {
      // Invalid cell for this card — nothing is spent, card stays in hand.
      return;
    }

    const result = playCard(this.draftState, this.gameState, card.id);
    if (!result.playedCard) {
      // Can't afford it (shouldn't normally happen — unaffordable cards
      // aren't selectable — but guards against a stale selection).
      return;
    }

    this.draftState = result.draft;
    this.gameState = result.game;

    if (this.isAnimalCard(card)) {
      placeAnimal(this.layout, this.animals, cell, card.unlocks as AnimalSpeciesId);
    } else {
      placeObject(this.layout, cell, card.unlocks as ZooObjectType);
    }

    // Keep the same card selected if more copies remain in hand, so
    // repeatable cards (e.g. placing several path tiles) don't require
    // reselecting after every placement.
    const stillInHand = this.draftState.hand.some((c) => c.id === card.id);
    this.selection = stillInHand ? card.id : null;

    this.refresh();
  }

  // Re-renders every part of the screen from current state. Simple and
  // cheap enough for an 8x8 prototype grid.
  private refresh(): void {
    this.updateTopBar();
    this.updateHud();
    this.updateSideMenu();
    this.updateHandCards();
    this.renderObjects();
    this.renderAnimals();
  }

  private cellPixel(cell: GridCell): { x: number; y: number } {
    return { x: GRID_ORIGIN_X + cell.col * CELL_SIZE, y: GRID_ORIGIN_Y + cell.row * CELL_SIZE };
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x4a7a4a, 1);
    graphics.fillStyle(0x2d5a2d, 1);

    for (const cell of createGridCells(GRID_WIDTH, GRID_HEIGHT)) {
      const { x, y } = this.cellPixel(cell);
      graphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      graphics.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  private renderObjects(): void {
    this.objectsGraphics.clear();

    for (const cell of createGridCells(GRID_WIDTH, GRID_HEIGHT)) {
      const type = getObjectAt(this.layout, cell);
      if (!type) {
        continue;
      }

      const { x, y } = this.cellPixel(cell);
      drawTileIcon(this.objectsGraphics, type, x, y);
    }
  }

  private renderAnimals(): void {
    this.animalsGraphics.clear();
    for (const text of this.welfareTexts) {
      text.destroy();
    }
    this.welfareTexts = [];

    const summaryLines: string[] = [];
    const radius = CELL_SIZE / 2 - 10;
    for (const cell of createGridCells(GRID_WIDTH, GRID_HEIGHT)) {
      const speciesId = getAnimalAt(this.animals, cell);
      if (!speciesId) {
        continue;
      }

      const { x: cellX, y: cellY } = this.cellPixel(cell);
      const centerX = cellX + CELL_SIZE / 2;
      const centerY = cellY + CELL_SIZE / 2;
      drawAnimalIcon(this.animalsGraphics, speciesId, centerX, centerY, radius);

      const welfare = calculateWelfare(this.layout, this.animals, cell);
      const text = this.add.text(centerX, centerY + radius + 8, `${welfare?.score ?? 0}%`, {
        fontSize: "11px",
        color: "#ffffff",
        align: "center",
        backgroundColor: "#000000aa",
        padding: { x: 3, y: 1 },
      });
      text.setOrigin(0.5, 0.5);
      this.welfareTexts.push(text);

      if (welfare) {
        summaryLines.push(this.formatNeedsSummary(ANIMAL_SPECIES[speciesId].name, cell, welfare));
      }
    }

    this.updateBottomBar(summaryLines);
  }

  private updateTopBar(): void {
    const labels: Record<Phase, string> = {
      draft: this.formatDraftStatus(),
      build: this.formatBuildStatus(),
      results: "Reviewing year-end results",
      "run-complete": "Run complete",
    };
    this.topBarText.setText(labels[this.phase]);
  }

  private formatBuildStatus(): string {
    if (this.selection === "erase") {
      return "Erase selected — click the grid to remove, then Open Zoo";
    }
    if (this.selection) {
      const card = this.draftState.hand.find((c) => c.id === this.selection);
      if (card) {
        return `Ready to play: ${card.name} (${card.cost} money) — click the grid, then Open Zoo`;
      }
    }
    return "Select a card from your hand (or Erase), then click the grid to build";
  }

  private formatDraftStatus(): string {
    const remaining = this.draftState.picksRemaining;
    const cards = remaining === 1 ? "card" : "cards";
    if (this.isYearZeroDraft) {
      return `Year 0 — build your opening hand: choose ${remaining} more ${cards}`;
    }
    return `Year ${this.gameState.year} — choose a discovery below`;
  }

  private updateHud(): void {
    const year = Math.min(this.gameState.year, RUN_LENGTH_YEARS);
    this.hudText.setText(
      `Year ${year} / ${RUN_LENGTH_YEARS}\n` +
        `Money $${this.gameState.money}\n` +
        `Research ${this.gameState.research}\n` +
        `Conservation ${this.gameState.conservation}`,
    );
  }

  private updateSideMenu(): void {
    const eraseSelected = this.selection === "erase";
    this.eraseButton.bg.setFillStyle(eraseSelected ? 0x4a7a4a : 0x3a3a3a, 1);

    for (const upgrade of UPGRADES) {
      const button = this.upgradeButtons.get(upgrade.id);
      if (!button) {
        continue;
      }
      const owned = isUpgradePurchased(this.researchState, upgrade.id);
      const affordable = canPurchaseUpgrade(this.researchState, this.gameState, upgrade);
      button.label.setText(owned ? `${upgrade.name} ✓` : `${upgrade.name} (${upgrade.cost} res.)`);
      button.bg.setFillStyle(owned ? 0x2a5a2a : affordable ? 0x3a3a5a : 0x262626, 1);
    }
  }

  private clearDraftCardButtons(): void {
    for (const button of this.draftCardButtons) {
      button.bg.destroy();
      button.label.destroy();
      button.swatch?.destroy();
    }
    this.draftCardButtons = [];
  }

  private updateBottomBar(needsSummaryLines: string[]): void {
    this.clearDraftCardButtons();

    if (this.phase === "draft") {
      this.actionButton.bg.setVisible(false);
      this.actionButton.label.setVisible(false);
      this.detailsText.setText("");
      this.renderDraftCards();
      return;
    }

    this.actionButton.bg.setVisible(true);
    this.actionButton.label.setVisible(true);
    this.actionButton.label.setText(this.actionButtonLabel());
    this.detailsText.setText(this.formatDetailsPanel(needsSummaryLines));
  }

  private renderDraftCards(): void {
    const cardHeight = BOTTOM_BAR_HEIGHT - 20;
    const gap = 10;
    const startX = GRID_ORIGIN_X + 8;
    const y = GRID_ORIGIN_Y + GRID_HEIGHT * CELL_SIZE + 10;
    const availableWidth = GRID_WIDTH * CELL_SIZE - 16;

    const count = this.draftState.offer.length;
    // Shrink cards to fit whenever the offer (e.g. Year 0's bigger draft)
    // would otherwise overflow the bottom bar.
    const cardWidth = Math.min(150, (availableWidth - gap * (count - 1)) / count);

    this.draftState.offer.forEach((card, index) => {
      const x = startX + index * (cardWidth + gap);
      const button = this.createButton(
        x,
        y,
        cardWidth,
        cardHeight,
        `${card.name} (${card.cost}g)\n${card.description}`,
        () => this.handleDraftPick(index),
        this.swatchColorForCard(card),
      );
      this.draftCardButtons.push(button);
    });
  }

  // The player's hand: drafted cards not yet played, grouped by id so a
  // repeatable card drafted several times shows as one row with a count.
  private groupedHand(): { card: Card; count: number }[] {
    const cardsById = new Map<string, Card>();
    const counts = new Map<string, number>();
    for (const card of this.draftState.hand) {
      cardsById.set(card.id, card);
      counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    return [...cardsById.values()].map((card) => ({ card, count: counts.get(card.id)! }));
  }

  private clearHandButtons(): void {
    for (const button of this.handCardButtons) {
      button.bg.destroy();
      button.label.destroy();
      button.swatch?.destroy();
    }
    this.handCardButtons = [];
  }

  private updateHandCards(): void {
    this.clearHandButtons();

    const x = 8;
    const width = SIDE_MENU_WIDTH - 16;
    let y = this.handSectionY;

    for (const { card, count } of this.groupedHand()) {
      const affordable = this.gameState.money >= card.cost;
      const selected = this.selection === card.id;
      const label = `${card.name} (${card.cost}g)${count > 1 ? ` x${count}` : ""}`;

      const button = this.createButton(
        x,
        y,
        width,
        BUTTON_HEIGHT,
        label,
        () => this.selectHandCard(card.id),
        this.swatchColorForCard(card),
      );
      button.bg.setFillStyle(selected ? 0x4a7a4a : affordable ? 0x3a3a3a : 0x262626, 1);
      if (!affordable) {
        button.label.setColor("#888888");
      }
      this.handCardButtons.push(button);
      y += BUTTON_HEIGHT + BUTTON_GAP;
    }
  }

  private swatchColorForCard(card: Card): number {
    return card.type === "animal"
      ? ANIMAL_COLORS[card.unlocks as AnimalSpeciesId]
      : OBJECT_COLORS[card.unlocks as ZooObjectType];
  }

  private actionButtonLabel(): string {
    if (this.phase === "build") {
      return "Open Zoo";
    }
    if (this.phase === "results") {
      return "Next Year";
    }
    return "New Run";
  }

  private formatDetailsPanel(needsSummaryLines: string[]): string {
    if (this.phase === "run-complete") {
      return this.formatRunSummary(evaluateRun(this.gameState));
    }
    if (this.phase === "results" && this.lastResult) {
      return this.formatYearSummary(this.lastResult);
    }
    if (needsSummaryLines.length === 0) {
      return "Place an animal on a habitat tile.";
    }
    return [this.formatZooWelfareSummary(), ...needsSummaryLines].join("\n");
  }

  private formatZooWelfareSummary(): string {
    const scores = createGridCells(GRID_WIDTH, GRID_HEIGHT)
      .map((cell) => calculateWelfare(this.layout, this.animals, cell)?.score)
      .filter((score): score is number => score !== undefined);
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    return `Zoo average welfare: ${average}% across ${scores.length} animal${scores.length === 1 ? "" : "s"}`;
  }

  private formatRunSummary(status: RunStatus): string {
    const outcome = status === "success" ? "Success!" : "The zoo did not make it.";
    return (
      `Run complete after ${RUN_LENGTH_YEARS} years — ${outcome}\n` +
      `Final money $${this.gameState.money}, research ${this.gameState.research}, ` +
      `conservation ${this.gameState.conservation}`
    );
  }

  private formatYearSummary(result: YearResult): string {
    const nextMoney = this.gameState.money + result.income;
    const nextResearch = this.gameState.research + result.researchGained;
    const nextConservation = this.gameState.conservation + result.conservationGained;
    return (
      `Year ${result.year} results: ${result.visitors} visitors, ` +
      `income $${result.income}, average welfare ${result.averageWelfare}%\n` +
      `+${result.researchGained} research, +${result.conservationGained} conservation\n` +
      `Money will become $${nextMoney}, research ${nextResearch}, conservation ${nextConservation}`
    );
  }

  private formatNeedsSummary(name: string, cell: GridCell, welfare: WelfareResult): string {
    const needParts = welfare.needs.map((need) => {
      const label = `${need.need} ${need.actual}/${need.required}`;
      return need.score < 100 ? `${label}!` : label;
    });
    return `${name} (${cell.col},${cell.row}) ${welfare.score}%  ${needParts.join("  ")}`;
  }
}
