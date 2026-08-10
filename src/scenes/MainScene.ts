import Phaser from "phaser";
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, createGridCells } from "../grid";

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create(): void {
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
}
