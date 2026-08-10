import Phaser from "phaser";
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH } from "./grid";
import { DETAILS_PANEL_HEIGHT, MainScene } from "./scenes/MainScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: GRID_WIDTH * CELL_SIZE,
  height: GRID_HEIGHT * CELL_SIZE + DETAILS_PANEL_HEIGHT,
  backgroundColor: "#1d1d1d",
  scene: [MainScene],
});
