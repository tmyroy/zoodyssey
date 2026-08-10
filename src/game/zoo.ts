import type { GridCell } from "./grid";

export type ZooObjectType = "path" | "vegetation" | "habitat" | "water" | "shelter" | "enrichment";

export interface ZooLayout {
  width: number;
  height: number;
  objects: Map<string, ZooObjectType>;
}

function cellKey(cell: GridCell): string {
  return `${cell.col},${cell.row}`;
}

export function createZooLayout(width: number, height: number): ZooLayout {
  return { width, height, objects: new Map() };
}

export function isWithinBounds(layout: ZooLayout, cell: GridCell): boolean {
  return cell.col >= 0 && cell.col < layout.width && cell.row >= 0 && cell.row < layout.height;
}

export function getObjectAt(layout: ZooLayout, cell: GridCell): ZooObjectType | undefined {
  return layout.objects.get(cellKey(cell));
}

export function canPlaceObject(layout: ZooLayout, cell: GridCell): boolean {
  return isWithinBounds(layout, cell) && !layout.objects.has(cellKey(cell));
}

export function placeObject(layout: ZooLayout, cell: GridCell, type: ZooObjectType): boolean {
  if (!canPlaceObject(layout, cell)) {
    return false;
  }
  layout.objects.set(cellKey(cell), type);
  return true;
}

export function canRemoveObject(layout: ZooLayout, cell: GridCell): boolean {
  return layout.objects.has(cellKey(cell));
}

export function removeObject(layout: ZooLayout, cell: GridCell): boolean {
  if (!canRemoveObject(layout, cell)) {
    return false;
  }
  layout.objects.delete(cellKey(cell));
  return true;
}
