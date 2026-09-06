import { describe, expect, it } from "vitest";

import { rectsOverlap, rectsTouch, sharedEdgeMidpoint, touchesBoundary } from "@/lib/geometry/geometry-utils";

describe("rectsOverlap", () => {
  it("detects a strict interior overlap", () => {
    const a = { xMm: 0, yMm: 0, widthMm: 100, lengthMm: 100 };
    const b = { xMm: 50, yMm: 50, widthMm: 100, lengthMm: 100 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it("does not consider merely-touching rects as overlapping", () => {
    const a = { xMm: 0, yMm: 0, widthMm: 100, lengthMm: 100 };
    const b = { xMm: 100, yMm: 0, widthMm: 100, lengthMm: 100 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it("returns false for rects that are entirely apart", () => {
    const a = { xMm: 0, yMm: 0, widthMm: 100, lengthMm: 100 };
    const b = { xMm: 500, yMm: 500, widthMm: 100, lengthMm: 100 };
    expect(rectsOverlap(a, b)).toBe(false);
  });
});

describe("rectsTouch", () => {
  it("detects rects sharing a vertical edge", () => {
    const a = { xMm: 0, yMm: 0, widthMm: 100, lengthMm: 100 };
    const b = { xMm: 100, yMm: 0, widthMm: 100, lengthMm: 100 };
    expect(rectsTouch(a, b)).toBe(true);
  });

  it("detects rects sharing a horizontal edge", () => {
    const a = { xMm: 0, yMm: 0, widthMm: 100, lengthMm: 100 };
    const b = { xMm: 0, yMm: 100, widthMm: 100, lengthMm: 100 };
    expect(rectsTouch(a, b)).toBe(true);
  });

  it("returns false for rects that only touch at a corner", () => {
    const a = { xMm: 0, yMm: 0, widthMm: 100, lengthMm: 100 };
    const b = { xMm: 100, yMm: 100, widthMm: 100, lengthMm: 100 };
    expect(rectsTouch(a, b)).toBe(false);
  });

  it("returns false for rects far apart", () => {
    const a = { xMm: 0, yMm: 0, widthMm: 100, lengthMm: 100 };
    const b = { xMm: 500, yMm: 500, widthMm: 100, lengthMm: 100 };
    expect(rectsTouch(a, b)).toBe(false);
  });
});

describe("sharedEdgeMidpoint", () => {
  it("finds the midpoint of a shared vertical edge", () => {
    const a = { xMm: 0, yMm: 0, widthMm: 100, lengthMm: 200 };
    const b = { xMm: 100, yMm: 50, widthMm: 100, lengthMm: 100 };
    // Overlap in y is [50, 150] -> midpoint y = 100, at the shared x=100 edge.
    expect(sharedEdgeMidpoint(a, b)).toEqual({ xMm: 100, yMm: 100 });
  });
});

describe("touchesBoundary", () => {
  it("is true for a rect flush against the left edge", () => {
    expect(touchesBoundary({ xMm: 0, yMm: 50, widthMm: 100, lengthMm: 100 }, 500, 500)).toBe(true);
  });

  it("is false for a rect entirely interior", () => {
    expect(touchesBoundary({ xMm: 100, yMm: 100, widthMm: 100, lengthMm: 100 }, 500, 500)).toBe(false);
  });
});
