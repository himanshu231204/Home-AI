import type { PlacedRect } from "@/lib/geometry/types";

/** Strict interior overlap — two rects that merely touch at an edge do not overlap. */
export function rectsOverlap(a: PlacedRect, b: PlacedRect): boolean {
  const aRight = a.xMm + a.widthMm;
  const aBottom = a.yMm + a.lengthMm;
  const bRight = b.xMm + b.widthMm;
  const bBottom = b.yMm + b.lengthMm;

  return a.xMm < bRight && aRight > b.xMm && a.yMm < bBottom && aBottom > b.yMm;
}

/**
 * Whether two rects share any part of a boundary edge (used as a proxy for
 * "these rooms are adjacent enough to be reachable from one another",
 * SPEC.md §15 connectivity).
 */
export function rectsTouch(a: PlacedRect, b: PlacedRect): boolean {
  const aRight = a.xMm + a.widthMm;
  const aBottom = a.yMm + a.lengthMm;
  const bRight = b.xMm + b.widthMm;
  const bBottom = b.yMm + b.lengthMm;

  const verticallyAligned = a.yMm < bBottom && aBottom > b.yMm;
  const horizontallyAligned = a.xMm < bRight && aRight > b.xMm;

  const shareVerticalEdge = verticallyAligned && (aRight === b.xMm || bRight === a.xMm);
  const shareHorizontalEdge = horizontallyAligned && (aBottom === b.yMm || bBottom === a.yMm);

  return shareVerticalEdge || shareHorizontalEdge;
}

/** Midpoint of the shared boundary segment between two touching rects. */
export function sharedEdgeMidpoint(a: PlacedRect, b: PlacedRect): { xMm: number; yMm: number } {
  const aRight = a.xMm + a.widthMm;
  const aBottom = a.yMm + a.lengthMm;
  const bRight = b.xMm + b.widthMm;
  const bBottom = b.yMm + b.lengthMm;

  if (aRight === b.xMm || bRight === a.xMm) {
    const x = aRight === b.xMm ? aRight : bRight;
    const yStart = Math.max(a.yMm, b.yMm);
    const yEnd = Math.min(aBottom, bBottom);
    return { xMm: x, yMm: (yStart + yEnd) / 2 };
  }

  const y = aBottom === b.yMm ? aBottom : bBottom;
  const xStart = Math.max(a.xMm, b.xMm);
  const xEnd = Math.min(aRight, bRight);
  return { xMm: (xStart + xEnd) / 2, yMm: y };
}

/** Whether a rect touches one of the buildable area's four outer edges. */
export function touchesBoundary(
  rect: PlacedRect,
  buildableWidthMm: number,
  buildableLengthMm: number,
): boolean {
  return (
    rect.xMm === 0 ||
    rect.yMm === 0 ||
    rect.xMm + rect.widthMm === buildableWidthMm ||
    rect.yMm + rect.lengthMm === buildableLengthMm
  );
}

/** Whether a rect touches the specific buildable edge that faces the road. */
export function touchesEdge(
  rect: PlacedRect,
  edge: "NORTH" | "SOUTH" | "EAST" | "WEST",
  buildableWidthMm: number,
  buildableLengthMm: number,
): boolean {
  switch (edge) {
    case "NORTH":
      return rect.yMm === 0;
    case "SOUTH":
      return rect.yMm + rect.lengthMm === buildableLengthMm;
    case "WEST":
      return rect.xMm === 0;
    case "EAST":
      return rect.xMm + rect.widthMm === buildableWidthMm;
  }
}
