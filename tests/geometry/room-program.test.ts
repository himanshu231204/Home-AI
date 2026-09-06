import { describe, expect, it } from "vitest";

import type { HouseRequirements } from "@/lib/domain/types";
import { assignRoomsToFloors, buildRoomProgram } from "@/lib/geometry/room-program";

const BASE_REQUIREMENTS: HouseRequirements = {
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
  vastuEnabled: false,
  designPriorities: [],
  architecturalStyle: "MODERN",
  constructionQuality: "STANDARD",
  budgetMin: null,
  budgetMax: null,
  currency: "INR",
  additionalRequirements: "",
};

describe("buildRoomProgram", () => {
  it("produces exactly the requested counts of each core room type (SPEC.md §62)", () => {
    const specs = buildRoomProgram(BASE_REQUIREMENTS, "BUDGET_OPTIMIZED");

    expect(specs.filter((s) => s.type === "MASTER_BEDROOM")).toHaveLength(1);
    expect(specs.filter((s) => s.type === "BEDROOM")).toHaveLength(2);
    expect(specs.filter((s) => s.type === "BATHROOM")).toHaveLength(3);
    expect(specs.filter((s) => s.type === "KITCHEN")).toHaveLength(1);
    expect(specs.filter((s) => s.type === "LIVING")).toHaveLength(1);
    expect(specs.filter((s) => s.type === "DINING")).toHaveLength(1);
    expect(specs.filter((s) => s.type === "PARKING")).toHaveLength(1);
    expect(specs.filter((s) => s.type === "STAIRCASE")).toHaveLength(1);
  });

  it("scales parking width with the number of cars", () => {
    const oneCar = buildRoomProgram(BASE_REQUIREMENTS, "BUDGET_OPTIMIZED").find((s) => s.type === "PARKING")!;
    const threeCars = buildRoomProgram({ ...BASE_REQUIREMENTS, parkingCars: 3 }, "BUDGET_OPTIMIZED").find(
      (s) => s.type === "PARKING",
    )!;
    expect(threeCars.minWidthMm).toBe(oneCar.minWidthMm * 3);
  });

  it("omits the staircase for a single-floor house", () => {
    const specs = buildRoomProgram({ ...BASE_REQUIREMENTS, floors: 1 }, "BUDGET_OPTIMIZED");
    expect(specs.some((s) => s.type === "STAIRCASE")).toBe(false);
  });

  it("only creates optional rooms the user actually requested", () => {
    const specs = buildRoomProgram(BASE_REQUIREMENTS, "BUDGET_OPTIMIZED");
    expect(specs.some((s) => s.type === "PUJA")).toBe(false);
    expect(specs.some((s) => s.type === "OFFICE")).toBe(false);

    const withExtras = buildRoomProgram({ ...BASE_REQUIREMENTS, pujaRoom: true, homeOffice: true }, "BUDGET_OPTIMIZED");
    expect(withExtras.some((s) => s.type === "PUJA")).toBe(true);
    expect(withExtras.some((s) => s.type === "OFFICE")).toBe(true);
  });

  it("scales comfort rooms up under more generous strategies but leaves support rooms alone", () => {
    const budget = buildRoomProgram(BASE_REQUIREMENTS, "BUDGET_OPTIMIZED");
    const premium = buildRoomProgram(BASE_REQUIREMENTS, "PREMIUM");

    const budgetLiving = budget.find((s) => s.type === "LIVING")!;
    const premiumLiving = premium.find((s) => s.type === "LIVING")!;
    expect(premiumLiving.targetWidthMm).toBeGreaterThan(budgetLiving.targetWidthMm);

    const budgetBathroom = budget.find((s) => s.type === "BATHROOM")!;
    const premiumBathroom = premium.find((s) => s.type === "BATHROOM")!;
    expect(premiumBathroom.targetWidthMm).toBe(budgetBathroom.targetWidthMm);
  });

  it("never sizes a room below its configured minimum, even at the budget strategy", () => {
    const specs = buildRoomProgram(BASE_REQUIREMENTS, "BUDGET_OPTIMIZED");
    for (const spec of specs) {
      expect(spec.targetWidthMm).toBeGreaterThanOrEqual(spec.minWidthMm);
      expect(spec.targetLengthMm).toBeGreaterThanOrEqual(spec.minLengthMm);
    }
  });
});

describe("assignRoomsToFloors", () => {
  it("puts social rooms and parking on the ground floor, bedrooms upstairs", () => {
    const specs = buildRoomProgram(BASE_REQUIREMENTS, "BUDGET_OPTIMIZED");
    const byFloor = assignRoomsToFloors(specs, BASE_REQUIREMENTS.floors);

    const ground = byFloor.get(0)!;
    expect(ground.some((s) => s.type === "LIVING")).toBe(true);
    expect(ground.some((s) => s.type === "KITCHEN")).toBe(true);
    expect(ground.some((s) => s.type === "PARKING")).toBe(true);
    expect(ground.some((s) => s.type === "MASTER_BEDROOM")).toBe(false);

    const upstairs = byFloor.get(1)!;
    expect(upstairs.some((s) => s.type === "MASTER_BEDROOM")).toBe(true);
  });

  it("duplicates an identically-sized staircase spec onto every floor", () => {
    const specs = buildRoomProgram(BASE_REQUIREMENTS, "BUDGET_OPTIMIZED");
    const byFloor = assignRoomsToFloors(specs, BASE_REQUIREMENTS.floors);

    for (let f = 0; f < BASE_REQUIREMENTS.floors; f++) {
      const staircases = byFloor.get(f)!.filter((s) => s.type === "STAIRCASE");
      expect(staircases).toHaveLength(1);
    }
  });

  it("puts everything on floor 0 for a single-floor house", () => {
    const specs = buildRoomProgram({ ...BASE_REQUIREMENTS, floors: 1 }, "BUDGET_OPTIMIZED");
    const byFloor = assignRoomsToFloors(specs, 1);
    expect(byFloor.get(0)).toHaveLength(specs.length);
  });

  it("sets floorNumber on every spec to match its assigned floor", () => {
    const specs = buildRoomProgram(BASE_REQUIREMENTS, "BUDGET_OPTIMIZED");
    const byFloor = assignRoomsToFloors(specs, BASE_REQUIREMENTS.floors);
    for (const [floorNumber, floorSpecs] of byFloor) {
      for (const spec of floorSpecs) expect(spec.floorNumber).toBe(floorNumber);
    }
  });
});
