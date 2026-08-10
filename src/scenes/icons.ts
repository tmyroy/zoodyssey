import type Phaser from "phaser";
import type { AnimalSpeciesId } from "../animals";
import { CELL_SIZE } from "../grid";
import type { ZooObjectType } from "../zoo";

// Simple procedural placeholder icons, drawn with Phaser primitives so the
// prototype doesn't depend on external art assets. Each tile/animal gets a
// distinct silhouette so they read apart from a flat color block.

function drawStar(
  graphics: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  points: number,
  outerRadius: number,
  innerRadius: number,
  color: number,
): void {
  const step = Math.PI / points;
  const coords: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    coords.push(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  graphics.fillStyle(color, 1);
  graphics.beginPath();
  graphics.moveTo(coords[0], coords[1]);
  for (let i = 2; i < coords.length; i += 2) {
    graphics.lineTo(coords[i], coords[i + 1]);
  }
  graphics.closePath();
  graphics.fillPath();
}

export function drawTileIcon(graphics: Phaser.GameObjects.Graphics, type: ZooObjectType, x: number, y: number): void {
  const inset = 6;
  const size = CELL_SIZE - inset * 2;
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;

  switch (type) {
    case "path": {
      graphics.fillStyle(0xc2b280, 1);
      graphics.fillRect(x + inset, y + inset, size, size);
      graphics.fillStyle(0x8a7a52, 1);
      graphics.fillRect(cx - size / 2 + 6, cy - 5, size - 12, 3);
      graphics.fillRect(cx - size / 2 + 6, cy + 3, size - 12, 3);
      break;
    }
    case "vegetation": {
      graphics.fillStyle(0x1f7a1f, 1);
      graphics.fillRect(x + inset, y + inset, size, size);
      graphics.fillStyle(0x5a3a1a, 1);
      graphics.fillRect(cx - 3, cy, 6, size / 2 - 4);
      graphics.fillStyle(0x2fae2f, 1);
      graphics.fillCircle(cx, cy - 4, size / 3);
      break;
    }
    case "habitat": {
      graphics.fillStyle(0x8b5a2b, 1);
      graphics.fillRect(x + inset, y + inset, size, size);
      graphics.lineStyle(2, 0x5a3a1a, 1);
      graphics.strokeRect(x + inset + 4, y + inset + 4, size - 8, size - 8);
      graphics.lineBetween(x + inset, y + inset, x + inset + size, y + inset + size);
      graphics.lineBetween(x + inset + size, y + inset, x + inset, y + inset + size);
      break;
    }
    case "water": {
      graphics.fillStyle(0x2a6fb0, 1);
      graphics.fillRect(x + inset, y + inset, size, size);
      graphics.lineStyle(2, 0x9fd0f0, 1);
      for (const dy of [-8, 0, 8]) {
        graphics.beginPath();
        graphics.moveTo(cx - size / 2 + 4, cy + dy);
        graphics.lineTo(cx - size / 6, cy + dy - 4);
        graphics.lineTo(cx + size / 6, cy + dy + 4);
        graphics.lineTo(cx + size / 2 - 4, cy + dy);
        graphics.strokePath();
      }
      break;
    }
    case "shelter": {
      graphics.fillStyle(0x7a6a58, 1);
      graphics.fillRect(x + inset, y + inset, size, size);
      graphics.fillStyle(0x4a3a28, 1);
      graphics.fillRect(cx - size / 3, cy, (size / 3) * 2, size / 2 - 4);
      graphics.fillStyle(0x3a2a18, 1);
      graphics.fillTriangle(cx - size / 2 + 2, cy, cx + size / 2 - 2, cy, cx, cy - size / 2 + 6);
      break;
    }
    case "enrichment": {
      graphics.fillStyle(0xb35fc2, 1);
      graphics.fillRect(x + inset, y + inset, size, size);
      drawStar(graphics, cx, cy, 5, size / 3, size / 6, 0xffe066);
      break;
    }
  }
}

export function drawAnimalIcon(
  graphics: Phaser.GameObjects.Graphics,
  species: AnimalSpeciesId,
  cx: number,
  cy: number,
  radius: number,
): void {
  switch (species) {
    case "lion": {
      graphics.fillStyle(0xb5791f, 1);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const px = cx + Math.cos(angle) * radius * 1.15;
        const py = cy + Math.sin(angle) * radius * 1.15;
        graphics.fillTriangle(cx, cy, px - 4, py - 4, px + 4, py + 4);
      }
      graphics.fillStyle(0xe0a030, 1);
      graphics.fillCircle(cx, cy, radius * 0.75);
      break;
    }
    case "elephant": {
      graphics.fillStyle(0x8f8f9a, 1);
      graphics.fillEllipse(cx - radius * 0.7, cy - radius * 0.2, radius * 0.7, radius * 0.9);
      graphics.fillEllipse(cx + radius * 0.7, cy - radius * 0.2, radius * 0.7, radius * 0.9);
      graphics.fillCircle(cx, cy, radius * 0.75);
      graphics.fillStyle(0x6f6f7a, 1);
      graphics.fillRect(cx - 3, cy + radius * 0.4, 6, radius * 0.6);
      break;
    }
    case "tortoise": {
      graphics.fillStyle(0x5aa06a, 1);
      graphics.fillCircle(cx, cy, radius * 0.75);
      graphics.lineStyle(2, 0x2f5a3a, 1);
      graphics.strokeCircle(cx, cy, radius * 0.5);
      graphics.strokeCircle(cx, cy, radius * 0.25);
      graphics.lineBetween(cx - radius * 0.75, cy, cx + radius * 0.75, cy);
      graphics.lineBetween(cx, cy - radius * 0.75, cx, cy + radius * 0.75);
      break;
    }
    case "giraffe": {
      graphics.fillStyle(0xd9b13c, 1);
      graphics.fillCircle(cx, cy, radius * 0.75);
      graphics.fillStyle(0x8a5a1f, 1);
      const spots: [number, number][] = [
        [-0.3, -0.3],
        [0.3, -0.2],
        [-0.1, 0.3],
        [0.35, 0.25],
        [0, -0.05],
      ];
      for (const [dx, dy] of spots) {
        graphics.fillCircle(cx + dx * radius, cy + dy * radius, radius * 0.15);
      }
      graphics.fillStyle(0x6a3a12, 1);
      graphics.fillRect(cx - radius * 0.25, cy - radius * 0.95, 3, radius * 0.3);
      graphics.fillRect(cx + radius * 0.15, cy - radius * 0.95, 3, radius * 0.3);
      break;
    }
    case "penguin": {
      graphics.fillStyle(0x2f3a4a, 1);
      graphics.fillEllipse(cx, cy, radius * 0.75, radius * 0.9);
      graphics.fillStyle(0xf0f0f0, 1);
      graphics.fillEllipse(cx, cy + radius * 0.15, radius * 0.4, radius * 0.55);
      graphics.fillStyle(0xe08a2a, 1);
      graphics.fillTriangle(cx - 4, cy - radius * 0.3, cx + 4, cy - radius * 0.3, cx, cy - radius * 0.1);
      break;
    }
    case "bear": {
      graphics.fillStyle(0x6b4a35, 1);
      graphics.fillCircle(cx - radius * 0.55, cy - radius * 0.55, radius * 0.28);
      graphics.fillCircle(cx + radius * 0.55, cy - radius * 0.55, radius * 0.28);
      graphics.fillCircle(cx, cy, radius * 0.75);
      graphics.fillStyle(0x9a7a5f, 1);
      graphics.fillCircle(cx, cy + radius * 0.25, radius * 0.3);
      break;
    }
    case "zebra": {
      graphics.fillStyle(0xe8e8e8, 1);
      graphics.fillCircle(cx, cy, radius * 0.75);
      graphics.lineStyle(3, 0x2a2a2a, 1);
      for (const dy of [-0.4, -0.1, 0.2, 0.5]) {
        graphics.beginPath();
        graphics.moveTo(cx - radius * 0.6, cy + dy * radius);
        graphics.lineTo(cx + radius * 0.6, cy + dy * radius - radius * 0.15);
        graphics.strokePath();
      }
      break;
    }
  }
}
