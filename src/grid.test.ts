import { describe, expect, it } from "vitest";
import { createGridCells } from "./grid";

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
