export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 8;
export const CELL_SIZE = 64;

export interface GridCell {
  col: number;
  row: number;
}

export function createGridCells(width: number, height: number): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      cells.push({ col, row });
    }
  }
  return cells;
}
