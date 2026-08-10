import Phaser from "phaser";
import {
  type AnimalLayout,
  type AnimalSpeciesId,
  ANIMAL_SPECIES,
  calculateWelfare,
  createAnimalLayout,
  getAnimalAt,
  placeAnimal,
  removeAnimal,
} from "../animals";
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, createGridCells, getCellAtPosition } from "../grid";
import {
  type ZooLayout,
  type ZooObjectType,
  createZooLayout,
  getObjectAt,
  placeObject,
  removeObject,
} from "../zoo";

type Tool = ZooObjectType | AnimalSpeciesId | "erase";

const OBJECT_COLORS: Record<ZooObjectType, number> = {
  path: 0xc2b280,
  vegetation: 0x1f7a1f,
  habitat: 0x8b5a2b,
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
  lion: "Lion",
  elephant: "Elephant",
  tortoise: "Tortoise",
  erase: "Erase",
};

export class MainScene extends Phaser.Scene {
  private layout!: ZooLayout;
  private animals!: AnimalLayout;
  private selectedTool: Tool = "path";
  private objectsGraphics!: Phaser.GameObjects.Graphics;
  private animalsGraphics!: Phaser.GameObjects.Graphics;
  private welfareTexts: Phaser.GameObjects.Text[] = [];
  private toolText!: Phaser.GameObjects.Text;

  constructor() {
    super("MainScene");
  }

  create(): void {
    this.layout = createZooLayout(GRID_WIDTH, GRID_HEIGHT);
    this.animals = createAnimalLayout();

    this.drawGrid();
    this.objectsGraphics = this.add.graphics();
    this.animalsGraphics = this.add.graphics();

    this.toolText = this.add.text(4, 4, "", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 4, y: 2 },
    });
    this.updateToolText();

    this.input.keyboard?.on("keydown-ONE", () => this.selectTool("path"));
    this.input.keyboard?.on("keydown-TWO", () => this.selectTool("vegetation"));
    this.input.keyboard?.on("keydown-THREE", () => this.selectTool("habitat"));
    this.input.keyboard?.on("keydown-FOUR", () => this.selectTool("lion"));
    this.input.keyboard?.on("keydown-FIVE", () => this.selectTool("elephant"));
    this.input.keyboard?.on("keydown-SIX", () => this.selectTool("tortoise"));
    this.input.keyboard?.on("keydown-ZERO", () => this.selectTool("erase"));

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer.x, pointer.y);
    });
  }

  private selectTool(tool: Tool): void {
    this.selectedTool = tool;
    this.updateToolText();
  }

  private updateToolText(): void {
    this.toolText.setText(
      `Tool: ${TOOL_LABELS[this.selectedTool]}  ` +
        "[1] Path [2] Vegetation [3] Habitat [4] Lion [5] Elephant [6] Tortoise [0] Erase",
    );
  }

  private isAnimalTool(tool: Tool): tool is AnimalSpeciesId {
    return tool in ANIMAL_SPECIES;
  }

  private handlePointerDown(x: number, y: number): void {
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
    }
  }
}
