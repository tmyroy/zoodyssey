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
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, createGridCells, getCellAtPosition } from "../grid";
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
type Phase = "build" | "results";

export const DETAILS_PANEL_HEIGHT = 130;

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
  erase: "Erase",
};

export class MainScene extends Phaser.Scene {
  private layout!: ZooLayout;
  private animals!: AnimalLayout;
  private gameState!: GameState;
  private phase: Phase = "build";
  private lastResult: YearResult | null = null;
  private selectedTool: Tool = "path";
  private objectsGraphics!: Phaser.GameObjects.Graphics;
  private animalsGraphics!: Phaser.GameObjects.Graphics;
  private welfareTexts: Phaser.GameObjects.Text[] = [];
  private toolText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private detailsText!: Phaser.GameObjects.Text;

  constructor() {
    super("MainScene");
  }

  create(): void {
    this.layout = createZooLayout(GRID_WIDTH, GRID_HEIGHT);
    this.animals = createAnimalLayout();
    this.gameState = createInitialGameState();

    this.drawGrid();
    this.objectsGraphics = this.add.graphics();
    this.animalsGraphics = this.add.graphics();

    this.toolText = this.add.text(4, 4, "", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 4, y: 2 },
    });

    this.hudText = this.add.text(GRID_WIDTH * CELL_SIZE - 180, 4, "", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 4, y: 2 },
      align: "right",
    });

    this.detailsText = this.add.text(4, GRID_HEIGHT * CELL_SIZE + 4, "", {
      fontSize: "12px",
      color: "#ffffff",
      lineSpacing: 4,
    });

    this.input.keyboard?.on("keydown-ONE", () => this.selectTool("path"));
    this.input.keyboard?.on("keydown-TWO", () => this.selectTool("vegetation"));
    this.input.keyboard?.on("keydown-THREE", () => this.selectTool("habitat"));
    this.input.keyboard?.on("keydown-FOUR", () => this.selectTool("lion"));
    this.input.keyboard?.on("keydown-FIVE", () => this.selectTool("elephant"));
    this.input.keyboard?.on("keydown-SIX", () => this.selectTool("tortoise"));
    this.input.keyboard?.on("keydown-SEVEN", () => this.selectTool("water"));
    this.input.keyboard?.on("keydown-EIGHT", () => this.selectTool("shelter"));
    this.input.keyboard?.on("keydown-NINE", () => this.selectTool("enrichment"));
    this.input.keyboard?.on("keydown-ZERO", () => this.selectTool("erase"));
    this.input.keyboard?.on("keydown-ENTER", () => this.handleEnter());

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer.x, pointer.y);
    });

    this.updateToolText();
    this.updateHud();
    this.renderAnimals();
  }

  private selectTool(tool: Tool): void {
    if (this.phase !== "build") {
      return;
    }
    this.selectedTool = tool;
    this.updateToolText();
  }

  private handleEnter(): void {
    if (this.phase === "build") {
      this.lastResult = simulateYear(this.gameState, this.layout, this.animals);
      this.phase = "results";
    } else if (this.lastResult) {
      this.gameState = applyYearResult(this.gameState, this.lastResult);
      this.lastResult = null;
      this.phase = "build";
    }

    this.updateToolText();
    this.updateHud();
    this.renderAnimals();
  }

  private updateToolText(): void {
    if (this.phase === "results") {
      this.toolText.setText("Reviewing year-end results\n[Enter] Start next year");
      return;
    }

    this.toolText.setText(
      `Tool: ${TOOL_LABELS[this.selectedTool]}\n` +
        "[1] Path [2] Vegetation [3] Habitat [4] Lion [5] Elephant [6] Tortoise\n" +
        "[7] Water [8] Shelter [9] Enrichment [0] Erase  [Enter] Open Zoo",
    );
  }

  private updateHud(): void {
    this.hudText.setText(
      `Year ${this.gameState.year}\n` +
        `Money $${this.gameState.money}\n` +
        `Research ${this.gameState.research}\n` +
        `Conservation ${this.gameState.conservation}`,
    );
  }

  private isAnimalTool(tool: Tool): tool is AnimalSpeciesId {
    return tool in ANIMAL_SPECIES;
  }

  private handlePointerDown(x: number, y: number): void {
    if (this.phase !== "build") {
      return;
    }

    const cell = getCellAtPosition(x, y, GRID_WIDTH, GRID_HEIGHT);
    if (!cell) {
      return;
    }

    if (this.selectedTool === "erase") {
      removeAnimal(this.animals, cell);
      removeObject(this.layout, cell);
    } else if (this.isAnimalTool(this.selectedTool)) {
      placeAnimal(this.layout, this.animals, cell, this.selectedTool);
    } else {
      placeObject(this.layout, cell, this.selectedTool);
    }

    this.renderObjects();
    this.renderAnimals();
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x4a7a4a, 1);
    graphics.fillStyle(0x2d5a2d, 1);

    const cells = createGridCells(GRID_WIDTH, GRID_HEIGHT);
    for (const cell of cells) {
      const x = cell.col * CELL_SIZE;
      const y = cell.row * CELL_SIZE;
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

      const x = cell.col * CELL_SIZE;
      const y = cell.row * CELL_SIZE;
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

      const centerX = cell.col * CELL_SIZE + CELL_SIZE / 2;
      const centerY = cell.row * CELL_SIZE + CELL_SIZE / 2;
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

    this.detailsText.setText(this.formatDetailsPanel(summaryLines));
  }

  private formatDetailsPanel(needsSummaryLines: string[]): string {
    if (this.phase === "results" && this.lastResult) {
      return this.formatYearSummary(this.lastResult);
    }
    return needsSummaryLines.length > 0
      ? needsSummaryLines.join("\n")
      : "Place an animal on a habitat tile.";
  }

  private formatYearSummary(result: YearResult): string {
    return (
      `Year ${result.year} results: ${result.visitors} visitors, ` +
      `income $${result.income}, average welfare ${result.averageWelfare}%\n` +
      `+${result.researchGained} research, +${result.conservationGained} conservation`
    );
  }

  private formatNeedsSummary(name: string, cell: { col: number; row: number }, welfare: WelfareResult): string {
    const needParts = welfare.needs.map((need) => {
      const label = `${need.need} ${need.actual}/${need.required}`;
      return need.score < 100 ? `${label}!` : label;
    });
    return `${name} (${cell.col},${cell.row}) ${welfare.score}%  ${needParts.join("  ")}`;
  }
}
