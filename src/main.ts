import Phaser from "phaser";
import { CANVAS_HEIGHT, CANVAS_WIDTH, MainScene } from "./scenes/MainScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: "#1d1d1d",
  scene: [MainScene],
});
