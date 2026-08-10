import Phaser from "phaser";
import {
  type AnimalLayout,
  type AnimalSpeciesId,
  type WelfareResult,
  ANIMAL_SPECIES,
  calculateWelfare,
  createAnimalLayout,
  getAnimalAt,
  placeAnimal,
  removeAnimal,
} from "../animals";
import {
  type DraftState,
  createDraftState,
  isFeatureUnlocked,
  isSpeciesUnlocked,
  pickCard,
  startDraft,
} from "../cards";
import { type GridCell, CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, createGridCells, getCellAtPosition } from "../grid";
import {
  type ResearchState,
  type UpgradeId,
  UPGRADES,
  canPurchaseUpgrade,
  createResearchState,
  isUpgradePurchased,
  purchaseUpgrade,
} from "../research";
import { RUN_LENGTH_YEARS, type RunStatus, evaluateRun, isRunComplete } from "../run";
import {
  type GameState,
  type YearResult,
  applyYearResult,
  createInitialGameState,
  simulateYear,
} from "../simulation";
import {
  type ZooLayout,
  type ZooObjectType,
  createZooLayout,
  getObjectAt,
  placeObject,
  removeObject,
} from "../zoo";

type Tool = ZooObjectType | AnimalSpeciesId | "erase";
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

const TOOL_LABELS: Record<Tool, string> = {
  path: "Path",
  vegetation: "Vegetation",
  habitat: "Habitat",
  water: "Water",
  shelter: "Shelter",
  enrichment: "Enrichment",
  lion: "Lion",
  elephant: "Elephant",
  tortoise: "Tortoise",
  giraffe: "Giraffe",
  penguin: "Penguin",
  bear: "Bear",
  zebra: "Zebra",
  erase: "Erase",
};

// Side menu order: basic tiles, erase, then every animal species.
const SIDE_MENU_TOOLS: Tool[] = [
  ...(Object.keys(OBJECT_COLORS) as ZooObjectType[]),
  "erase",
  ...(Object.keys(ANIMAL_SPECIES) as AnimalSpeciesId[]),
];

interface Button {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export class MainScene extends Phaser.Scene {
  private layout!: ZooLayout;
  private animals!: AnimalLayout;
  private gameState!: GameState;
  private draftState!: DraftState;
  private researchState!: ResearchState;
  private phase: Phase = "draft";
  private lastResult: YearResult | null = null;
  private selectedTool: Tool = "path";

  private objectsGraphics!: Phaser.GameObjects.Graphics;
  private animalsGraphics!: Phaser.GameObjects.Graphics;
  private welfareTexts: Phaser.GameObjects.Text[] = [];

  private topBarText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private detailsText!: Phaser.GameObjects.Text;
  private actionButton!: Button;
  private cardButtons: Button[] = [];
  private toolButtons = new Map<Tool, Button>();
  private upgradeButtons = new Map<UpgradeId, Button>();

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
      wordWrap: { width: CANVAS_WIDTH - 200 },
    });

    this.hudText = this.add.text(CANVAS_WIDTH - 180, 4, "", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 4, y: 2 },
      align: "right",
    });

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
    this.bindKeyboard();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer.x, pointer.y);
    });

    this.startNewRun();
  }

  private bindKeyboard(): void {
    this.input.keyboard?.on("keydown-ONE", () => this.handleNumberKey(0, "path"));
    this.input.keyboard?.on("keydown-TWO", () => this.handleNumberKey(1, "vegetation"));
    this.input.keyboard?.on("keydown-THREE", () => this.handleNumberKey(2, "habitat"));
    this.input.keyboard?.on("keydown-FOUR", () => this.selectTool("lion"));
    this.input.keyboard?.on("keydown-FIVE", () => this.selectTool("elephant"));
    this.input.keyboard?.on("keydown-SIX", () => this.selectTool("tortoise"));
    this.input.keyboard?.on("keydown-SEVEN", () => this.selectTool("water"));
    this.input.keyboard?.on("keydown-EIGHT", () => this.selectTool("shelter"));
    this.input.keyboard?.on("keydown-NINE", () => this.selectTool("enrichment"));
    this.input.keyboard?.on("keydown-ZERO", () => this.selectTool("erase"));
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
  ): Button {
    const bg = this.add
      .rectangle(x, y, width, height, 0x3a3a3a, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x666666)
      .setInteractive({ useHandCursor: true });
    bg.on("pointerdown", onClick);

    const text = this.add
      .text(x + width / 2, y + height / 2, label, {
        fontSize: "13px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: width - 8 },
      })
      .setOrigin(0.5, 0.5);

    return { bg, label: text };
  }

  private buildSideMenu(): void {
    const x = 8;
    const width = SIDE_MENU_WIDTH - 16;
    let y = GRID_ORIGIN_Y + 8;

    for (const tool of SIDE_MENU_TOOLS) {
      const button = this.createButton(x, y, width, BUTTON_HEIGHT, "", () => this.selectTool(tool));
      this.toolButtons.set(tool, button);
      y += BUTTON_HEIGHT + BUTTON_GAP;
    }

    y += SECTION_GAP;
    for (const upgrade of UPGRADES) {
      const button = this.createButton(x, y, width, BUTTON_HEIGHT, "", () =>
        this.purchaseUpgrade(upgrade.id),
      );
      this.upgradeButtons.set(upgrade.id, button);
      y += BUTTON_HEIGHT + BUTTON_GAP;
    }
  }

  private startNewRun(): void {
    this.layout = createZooLayout(GRID_WIDTH, GRID_HEIGHT);
    this.animals = createAnimalLayout();
    this.gameState = createInitialGameState();
    this.draftState = createDraftState();
    this.researchState = createResearchState();
    this.lastResult = null;

    this.startYearDraft();
    this.refresh();
  }

  // Keys 1-3 pick a draft card during the draft phase, or select a build
  // tool otherwise.
  private handleNumberKey(offerIndex: number, buildTool: Tool): void {
    if (this.phase === "draft") {
      this.handleDraftPick(offerIndex);
    } else {
      this.selectTool(buildTool);
    }
  }

  private handleDraftPick(offerIndex: number): void {
    const card = this.draftState.offer[offerIndex];
    if (!card) {
      return;
    }
    this.draftState = pickCard(this.draftState, card.id);
    this.phase = "build";
    this.refresh();
  }

  private startYearDraft(): void {
    this.draftState = startDraft(this.draftState);
    this.phase = this.draftState.offer.length > 0 ? "draft" : "build";
  }

  private selectTool(tool: Tool): void {
    if (this.phase !== "build") {
      return;
    }
    this.selectedTool = tool;
    this.refresh();
  }

  private purchaseUpgrade(id: UpgradeId): void {
    if (this.phase !== "build") {
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

  private isUnlocked(tool: Tool): boolean {
    if (tool === "erase") {
      return true;
    }
    return this.isAnimalTool(tool)
      ? isSpeciesUnlocked(this.draftState, tool)
      : isFeatureUnlocked(this.draftState, tool);
  }

  private toolLabel(tool: Tool): string {
    return this.isUnlocked(tool) ? TOOL_LABELS[tool] : `${TOOL_LABELS[tool]} (locked)`;
  }

  private isAnimalTool(tool: Tool): tool is AnimalSpeciesId {
    return tool in ANIMAL_SPECIES;
  }

  private handlePointerDown(x: number, y: number): void {
    if (this.phase !== "build") {
      return;
    }

    const cell = getCellAtPosition(x - GRID_ORIGIN_X, y - GRID_ORIGIN_Y, GRID_WIDTH, GRID_HEIGHT);
    if (!cell) {
      return;
    }

    if (this.selectedTool === "erase") {
      removeAnimal(this.animals, cell);
      removeObject(this.layout, cell);
    } else if (!this.isUnlocked(this.selectedTool)) {
      // Tool has not been discovered through the card draft yet.
    } else if (this.isAnimalTool(this.selectedTool)) {
      placeAnimal(this.layout, this.animals, cell, this.selectedTool);
    } else {
      placeObject(this.layout, cell, this.selectedTool);
    }

    this.refresh();
  }

  // Re-renders every part of the screen from current state. Simple and
  // cheap enough for an 8x8 prototype grid.
  private refresh(): void {
    this.updateTopBar();
    this.updateHud();
    this.updateSideMenu();
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

    const inset = 6;
    for (const cell of createGridCells(GRID_WIDTH, GRID_HEIGHT)) {
      const type = getObjectAt(this.layout, cell);
      if (!type) {
        continue;
      }

      const { x, y } = this.cellPixel(cell);
      this.objectsGraphics.fillStyle(OBJECT_COLORS[type], 1);
      this.objectsGraphics.fillRect(
        x + inset,
        y + inset,
        CELL_SIZE - inset * 2,
        CELL_SIZE - inset * 2,
      );
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
      this.animalsGraphics.fillStyle(ANIMAL_COLORS[speciesId], 1);
      this.animalsGraphics.fillCircle(centerX, centerY, radius);

      const welfare = calculateWelfare(this.layout, this.animals, cell);
      const text = this.add.text(
        centerX,
        centerY,
        `${ANIMAL_SPECIES[speciesId].name[0]}\n${welfare?.score ?? 0}`,
        {
          fontSize: "11px",
          color: "#ffffff",
          align: "center",
        },
      );
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
      draft: `Year ${this.gameState.year} — choose a discovery below`,
      build: `Tool: ${this.toolLabel(this.selectedTool)} — click the grid to build, then Open Zoo`,
      results: "Reviewing year-end results",
      "run-complete": "Run complete",
    };
    this.topBarText.setText(labels[this.phase]);
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
    for (const [tool, button] of this.toolButtons) {
      const locked = !this.isUnlocked(tool);
      const selected = tool === this.selectedTool;
      button.bg.setFillStyle(selected ? 0x4a7a4a : locked ? 0x262626 : 0x3a3a3a, 1);
      button.label.setText(this.toolLabel(tool));
      button.label.setColor(locked ? "#888888" : "#ffffff");
    }

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

  private clearCardButtons(): void {
    for (const button of this.cardButtons) {
      button.bg.destroy();
      button.label.destroy();
    }
    this.cardButtons = [];
  }

  private updateBottomBar(needsSummaryLines: string[]): void {
    this.clearCardButtons();

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
    const cardWidth = 150;
    const cardHeight = BOTTOM_BAR_HEIGHT - 20;
    const gap = 14;
    const startX = GRID_ORIGIN_X + 8;
    const y = GRID_ORIGIN_Y + GRID_HEIGHT * CELL_SIZE + 10;

    this.draftState.offer.forEach((card, index) => {
      const x = startX + index * (cardWidth + gap);
      const button = this.createButton(
        x,
        y,
        cardWidth,
        cardHeight,
        `${card.name}\n${card.description}`,
        () => this.handleDraftPick(index),
      );
      this.cardButtons.push(button);
    });
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
