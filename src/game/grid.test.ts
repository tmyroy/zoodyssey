import { describe, expect, it } from "vitest";
import { CELL_SIZE, createGridCells, getCellAtPosition } from "./grid";

describe("createGridCells", () => {
  it("creates one cell per grid position", () => {
    const cells = createGridCells(8, 8);
    expect(cells).toHaveLength(64);
  });

  it("covers every column and row exactly once per row/column pair", () => {
    const cells = createGridCells(2, 2);
    expect(cells).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ]);
  });
});

describe("getCellAtPosition", () => {
  it("maps a pixel position to its grid cell", () => {
    expect(getCellAtPosition(0, 0, 8, 8)).toEqual({ col: 0, row: 0 });
    expect(getCellAtPosition(CELL_SIZE * 2 + 5, CELL_SIZE * 3 + 5, 8, 8)).toEqual({
      col: 2,
      row: 3,
    });
  });

  it("returns null outside the grid bounds", () => {
    expect(getCellAtPosition(-1, 0, 8, 8)).toBeNull();
    expect(getCellAtPosition(0, -1, 8, 8)).toBeNull();
    expect(getCellAtPosition(CELL_SIZE * 8, 0, 8, 8)).toBeNull();
    expect(getCellAtPosition(0, CELL_SIZE * 8, 8, 8)).toBeNull();
  });
});
