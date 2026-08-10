import Phaser from "phaser";
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, createGridCells, getCellAtPosition } from "../grid";
import {
  type ZooLayout,
  type ZooObjectType,
  createZooLayout,
  getObjectAt,
  placeObject,
  removeObject,
} from "../zoo";

type Tool = ZooObjectType | "erase";

const OBJECT_COLORS: Record<ZooObjectType, number> = {
  path: 0xc2b280,
  vegetation: 0x1f7a1f,
  habitat: 0x8b5a2b,
};

const TOOL_LABELS: Record<Tool, string> = {
  path: "Path",
  vegetation: "Vegetation",
  habitat: "Habitat",
  erase: "Erase",
};

export class MainScene extends Phaser.Scene {
  private layout!: ZooLayout;
  private selectedTool: Tool = "path";
  private objectsGraphics!: Phaser.GameObjects.Graphics;
  private toolText!: Phaser.GameObjects.Text;

  constructor() {
    super("MainScene");
  }

  create(): void {
    this.layout = createZooLayout(GRID_WIDTH, GRID_HEIGHT);

    this.drawGrid();
    this.objectsGraphics = this.add.graphics();

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
      `Tool: ${TOOL_LABELS[this.selectedTool]}  [1] Path [2] Vegetation [3] Habitat [0] Erase`,
    );
  }

  private handlePointerDown(x: number, y: number): void {
    const cell = getCellAtPosition(x, y, GRID_WIDTH, GRID_HEIGHT);
    if (!cell) {
      return;
    }

    if (this.selectedTool === "erase") {
      removeObject(this.layout, cell);
    } else {
      placeObject(this.layout, cell, this.selectedTool);
    }

    this.renderObjects();
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
}
