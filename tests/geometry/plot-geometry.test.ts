import { describe, expect, it } from "vitest";

import { DEFAULT_SETBACKS_MM } from "@/lib/config/setback-constraints";
import { calculatePlotGeometry, primaryRoadEdge } from "@/lib/geometry/plot-geometry";

const BASE_PLOT = {
  id: "plot-1",
  projectId: "project-1",
  widthMm: 9144,
  lengthMm: 15240,
  roadSide: "NORTH" as const,
  northDirectionDegrees: 0,
  locationCountry: "IN",
  locationState: null,
  locationCity: null,
  postalCode: null,
  plotShape: "RECTANGLE" as const,
};

describe("calculatePlotGeometry", () => {
  it("subtracts side setbacks from both edges of the width", () => {
    const geometry = calculatePlotGeometry(BASE_PLOT);
    expect(geometry.buildableWidthMm).toBe(BASE_PLOT.widthMm - 2 * DEFAULT_SETBACKS_MM.sideMm);
  });

  it("subtracts front and rear setbacks from the length", () => {
    const geometry = calculatePlotGeometry(BASE_PLOT);
    expect(geometry.buildableLengthMm).toBe(
      BASE_PLOT.lengthMm - DEFAULT_SETBACKS_MM.frontMm - DEFAULT_SETBACKS_MM.rearMm,
    );
  });

  it("clamps to zero rather than going negative for a tiny plot", () => {
    const geometry = calculatePlotGeometry({ ...BASE_PLOT, widthMm: 1000, lengthMm: 1000 });
    expect(geometry.buildableWidthMm).toBe(0);
    expect(geometry.buildableLengthMm).toBe(0);
  });
});

describe("primaryRoadEdge", () => {
  it("resolves cardinal directions directly", () => {
    expect(primaryRoadEdge("NORTH")).toBe("NORTH");
    expect(primaryRoadEdge("SOUTH")).toBe("SOUTH");
    expect(primaryRoadEdge("EAST")).toBe("EAST");
    expect(primaryRoadEdge("WEST")).toBe("WEST");
  });

  it("resolves diagonal directions to their primary cardinal component", () => {
    expect(primaryRoadEdge("NORTH_EAST")).toBe("NORTH");
    expect(primaryRoadEdge("NORTH_WEST")).toBe("NORTH");
    expect(primaryRoadEdge("SOUTH_EAST")).toBe("SOUTH");
    expect(primaryRoadEdge("SOUTH_WEST")).toBe("SOUTH");
  });
});
