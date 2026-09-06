import { describe, expect, it } from "vitest";

import type { HouseRequirements, Plot } from "@/lib/domain/types";
import { generateDesignCandidates } from "@/lib/geometry/generate-designs";

// SPEC.md §62 "Example Acceptance Test": 30x50ft plot, 2 floors, 3 bed, 3
// bath, 1 parking, Vastu enabled.
const ACCEPTANCE_PLOT: Plot = {
  id: "plot-1",
  projectId: "project-1",
  widthMm: 9144, // 30ft
  lengthMm: 15240, // 50ft
  roadSide: "NORTH",
  northDirectionDegrees: 0,
  locationCountry: "IN",
  locationState: null,
  locationCity: null,
  postalCode: null,
  plotShape: "RECTANGLE",
};

const ACCEPTANCE_REQUIREMENTS: HouseRequirements = {
  floors: 2,
  bedrooms: 3,
  bathrooms: 3,
  kitchens: 1,
  parkingCars: 1,
  livingRooms: 1,
  diningRooms: 1,
  pujaRoom: false,
  homeOffice: false,
  balcony: false,
  terrace: false,
  utilityRoom: false,
  storeRoom: false,
  laundryRoom: false,
  vastuEnabled: true,
  designPriorities: [],
  architecturalStyle: "MODERN",
  constructionQuality: "STANDARD",
  budgetMin: 3_500_000,
  budgetMax: 3_500_000,
  currency: "INR",
  additionalRequirements: "",
};

describe("generateDesignCandidates (SPEC.md §62 acceptance test)", () => {
  const candidates = generateDesignCandidates(ACCEPTANCE_PLOT, ACCEPTANCE_REQUIREMENTS, "project-1");

  it("returns exactly 3 design candidates", () => {
    expect(candidates).toHaveLength(3);
  });

  it("gives each candidate a distinct strategy", () => {
    const strategies = candidates.map((c) => c.metadata.strategy);
    expect(new Set(strategies).size).toBe(3);
  });

  it("never returns a candidate that hasn't been run through validation (SPEC.md §62)", () => {
    for (const candidate of candidates) {
      expect(candidate.constraints).toBeDefined();
      expect(Array.isArray(candidate.constraints.errors)).toBe(true);
      expect(candidate.status).not.toBe("");
    }
  });

  it("gives every feasible candidate 2 floors, 3 bedrooms, 3 bathrooms, and 1 parking", () => {
    for (const candidate of candidates) {
      if (candidate.floors.length === 0) continue; // an infeasible candidate carries no rooms

      expect(candidate.floors).toHaveLength(2);

      const allRooms = candidate.floors.flatMap((f) => f.rooms);
      expect(allRooms.filter((r) => r.type === "MASTER_BEDROOM")).toHaveLength(1);
      expect(allRooms.filter((r) => r.type === "BEDROOM")).toHaveLength(2);
      expect(allRooms.filter((r) => r.type === "BATHROOM")).toHaveLength(3);
      expect(allRooms.filter((r) => r.type === "PARKING")).toHaveLength(1);
    }
  });

  it("produces valid, non-overlapping geometry for at least one strategy on this plot", () => {
    // The plot in this acceptance test is comfortably large enough that at
    // least the most compact (budget) strategy should fit cleanly.
    expect(candidates.some((c) => c.status === "VALID" || c.status === "VALID_WITH_WARNINGS")).toBe(true);
  });

  it("keeps the staircase in the same position on both floors for every feasible candidate", () => {
    for (const candidate of candidates) {
      if (candidate.floors.length < 2) continue;
      const [floor0, floor1] = candidate.floors;
      const stair0 = floor0!.stairs[0];
      const stair1 = floor1!.stairs[0];
      expect(stair0).toBeDefined();
      expect(stair1).toBeDefined();
      expect(stair0!.xMm).toBe(stair1!.xMm);
      expect(stair0!.yMm).toBe(stair1!.yMm);
    }
  });

  it("scores every feasible candidate with a strategy-consistent overall score", () => {
    for (const candidate of candidates) {
      if (candidate.floors.length === 0) continue;
      expect(candidate.score).not.toBeNull();
      expect(candidate.score!.overallScore).toBeGreaterThan(0);
      expect(candidate.score!.overallScore).toBeLessThanOrEqual(1);
    }
  });

  it("produces a materially larger footprint for Premium than Budget when both are feasible (SPEC.md §20)", () => {
    const budget = candidates.find((c) => c.metadata.strategy === "BUDGET_OPTIMIZED")!;
    const premium = candidates.find((c) => c.metadata.strategy === "PREMIUM")!;
    if (budget.floors.length === 0 || premium.floors.length === 0) return;
    expect(premium.totalBuiltUpAreaMm2).toBeGreaterThan(budget.totalBuiltUpAreaMm2);
  });
});

describe("generateDesignCandidates on an impossibly small plot", () => {
  it("marks candidates INVALID rather than fabricating geometry (SPEC.md §52)", () => {
    const tinyPlot: Plot = { ...ACCEPTANCE_PLOT, widthMm: 3000, lengthMm: 3000 };
    const candidates = generateDesignCandidates(tinyPlot, ACCEPTANCE_REQUIREMENTS, "project-1");
    for (const candidate of candidates) {
      expect(candidate.status).toBe("INVALID");
      expect(candidate.constraints.errors.length).toBeGreaterThan(0);
    }
  });
});
