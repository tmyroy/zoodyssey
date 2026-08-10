import Phaser from "phaser";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./MainScene";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1d1d1d");

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90, "Zoodyssey", {
        fontSize: "42px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, "A roguelite zoo management prototype", {
        fontSize: "14px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5, 0.5);

    this.createStartButton();
  }

  private createStartButton(): void {
    const width = 220;
    const height = 50;
    const x = CANVAS_WIDTH / 2 - width / 2;
    const y = CANVAS_HEIGHT / 2 + 10;

    const bg = this.add
      .rectangle(x, y, width, height, 0x3a5a3a, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x6a9a6a)
      .setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => this.scene.start("MainScene"));

    this.add
      .text(CANVAS_WIDTH / 2, y + height / 2, "Start New Game", {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);
  }
}
