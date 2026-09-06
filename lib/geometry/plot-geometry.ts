import { DEFAULT_SETBACKS_MM } from "@/lib/config/setback-constraints";
import type { Plot, PlotGeometry, RoadSide } from "@/lib/domain/types";

/**
 * Computes the buildable area inside a plot after applying setbacks
 * (SPEC.md §15 "Plot containment", §17 step 3/5).
 *
 * Side setbacks are applied to both left and right edges; front/rear
 * setbacks are applied along the plot's length. A plot too small for its
 * setbacks yields a zero (not negative) buildable area rather than throwing
 * — the caller decides how to surface that as an impossible requirement
 * (SPEC.md §52).
 */
export function calculatePlotGeometry(plot: Plot): PlotGeometry {
  const { frontMm, rearMm, sideMm } = DEFAULT_SETBACKS_MM;

  return {
    widthMm: plot.widthMm,
    lengthMm: plot.lengthMm,
    buildableWidthMm: Math.max(0, plot.widthMm - 2 * sideMm),
    buildableLengthMm: Math.max(0, plot.lengthMm - frontMm - rearMm),
    setbackFrontMm: frontMm,
    setbackRearMm: rearMm,
    setbackSideMm: sideMm,
  };
}

export type BuildableEdge = "NORTH" | "SOUTH" | "EAST" | "WEST";

/**
 * The buildable rectangle's edge that faces the road, in a coordinate
 * system where x grows eastward and y grows southward (y=0 is the north
 * edge). Diagonal road sides (e.g. NORTH_EAST) resolve to their primary
 * cardinal component.
 */
export function primaryRoadEdge(roadSide: RoadSide): BuildableEdge {
  switch (roadSide) {
    case "NORTH":
    case "NORTH_EAST":
    case "NORTH_WEST":
      return "NORTH";
    case "SOUTH":
    case "SOUTH_EAST":
    case "SOUTH_WEST":
      return "SOUTH";
    case "EAST":
      return "EAST";
    case "WEST":
      return "WEST";
  }
}
