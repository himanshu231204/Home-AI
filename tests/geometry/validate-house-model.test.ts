import { describe, expect, it } from "vitest";

import type { HouseModel, Room } from "@/lib/domain/types";
import { validateHouseModel } from "@/lib/geometry/validate-house-model";

function makeRoom(overrides: Partial<Room> & Pick<Room, "type" | "xMm" | "yMm" | "widthMm" | "lengthMm">): Room {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.type,
    rotationDegrees: 0,
    floorNumber: 0,
    minimumWidthMm: overrides.widthMm,
    minimumAreaMm2: overrides.widthMm * overrides.lengthMm,
    windows: [],
    doors: [],
    preferredOrientation: null,
    metadata: {},
    ...overrides,
  };
}

function baseModel(rooms: Room[]): HouseModel {
  return {
    id: "house-1",
    projectId: "project-1",
    version: 1,
    plot: {
      widthMm: 9144,
      lengthMm: 15240,
      buildableWidthMm: 7144,
      buildableLengthMm: 10240,
      setbackFrontMm: 3000,
      setbackRearMm: 2000,
      setbackSideMm: 1000,
    },
    floors: [
      {
        id: "floor-0",
        floorNumber: 0,
        elevationMm: 0,
        rooms,
        doors: [],
        windows: [],
        stairs: [],
        balconies: [],
        openSpaces: [],
        builtAreaMm2: rooms.reduce((sum, r) => sum + r.widthMm * r.lengthMm, 0),
      },
    ],
    totalBuiltUpAreaMm2: 0,
    totalOpenAreaMm2: 0,
    orientation: { roadSide: "NORTH", northDirectionDegrees: 0 },
    constraints: { valid: false, errors: [], warnings: [] },
    score: null,
    estimatedCost: null,
    status: "INVALID",
    metadata: { strategy: "BUDGET_OPTIMIZED", generatedAt: new Date().toISOString(), notes: [] },
  };
}

describe("validateHouseModel", () => {
  it("passes a single well-placed, touching, doored room with no issues", () => {
    const living = makeRoom({ type: "LIVING", xMm: 0, yMm: 0, widthMm: 3300, lengthMm: 4200 });
    const model = baseModel([living]);
    const result = validateHouseModel(model);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("flags a room that extends outside the buildable area", () => {
    const room = makeRoom({ type: "LIVING", xMm: 7000, yMm: 0, widthMm: 3300, lengthMm: 4200 });
    const result = validateHouseModel(baseModel([room]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "ROOM_OUTSIDE_BUILDABLE_AREA")).toBe(true);
  });

  it("flags a room below its configured minimum width", () => {
    const room = makeRoom({ type: "LIVING", xMm: 0, yMm: 0, widthMm: 3300, lengthMm: 4200, minimumWidthMm: 4000 });
    const result = validateHouseModel(baseModel([room]));
    expect(result.errors.some((e) => e.code === "ROOM_BELOW_MINIMUM_WIDTH")).toBe(true);
  });

  it("flags two overlapping rooms", () => {
    const a = makeRoom({ type: "LIVING", xMm: 0, yMm: 0, widthMm: 3000, lengthMm: 3000 });
    const b = makeRoom({ type: "DINING", xMm: 1000, yMm: 1000, widthMm: 3000, lengthMm: 3000 });
    const result = validateHouseModel(baseModel([a, b]));
    expect(result.errors.some((e) => e.code === "ROOMS_OVERLAP")).toBe(true);
  });

  it("flags a room that isn't reachable from the rest of the floor", () => {
    const a = makeRoom({ type: "LIVING", xMm: 0, yMm: 0, widthMm: 3000, lengthMm: 3000 });
    const isolated = makeRoom({ type: "BEDROOM", xMm: 5000, yMm: 5000, widthMm: 3000, lengthMm: 3300 });
    const result = validateHouseModel(baseModel([a, isolated]));
    expect(result.errors.some((e) => e.code === "ROOM_NOT_REACHABLE")).toBe(true);
  });

  it("warns (does not error) when a non-open-plan room has no door", () => {
    const bedroom = makeRoom({ type: "BEDROOM", xMm: 0, yMm: 0, widthMm: 3000, lengthMm: 3300 });
    const result = validateHouseModel(baseModel([bedroom]));
    expect(result.warnings.some((w) => w.code === "ROOM_HAS_NO_DOOR")).toBe(true);
    expect(result.errors.some((e) => e.code === "ROOM_HAS_NO_DOOR")).toBe(false);
  });

  it("does not warn about missing doors for open-plan social rooms", () => {
    const living = makeRoom({ type: "LIVING", xMm: 0, yMm: 0, widthMm: 3300, lengthMm: 4200 });
    const result = validateHouseModel(baseModel([living]));
    expect(result.warnings.some((w) => w.code === "ROOM_HAS_NO_DOOR")).toBe(false);
  });

  it("errors when a bathroom touches no bedroom and has no door", () => {
    const bathroom = makeRoom({ type: "BATHROOM", xMm: 0, yMm: 0, widthMm: 1500, lengthMm: 2100 });
    const result = validateHouseModel(baseModel([bathroom]));
    expect(result.errors.some((e) => e.code === "BATHROOM_NOT_ACCESSIBLE")).toBe(true);
  });

  it("passes a bathroom that touches a bedroom", () => {
    const bedroom = makeRoom({ type: "MASTER_BEDROOM", xMm: 0, yMm: 0, widthMm: 3600, lengthMm: 4200 });
    const bathroom = makeRoom({ type: "BATHROOM", xMm: 3600, yMm: 0, widthMm: 1500, lengthMm: 2100 });
    const result = validateHouseModel(baseModel([bedroom, bathroom]));
    expect(result.errors.some((e) => e.code === "BATHROOM_NOT_ACCESSIBLE")).toBe(false);
  });

  it("warns when parking doesn't reach the road-facing edge", () => {
    // Buildable area is 7144x10240; parking placed away from y=0 (the north/road edge).
    const parking = makeRoom({ type: "PARKING", xMm: 0, yMm: 2000, widthMm: 2700, lengthMm: 5000 });
    const result = validateHouseModel(baseModel([parking]));
    expect(result.warnings.some((w) => w.code === "PARKING_NOT_AT_ROAD")).toBe(true);
  });

  it("passes parking flush against the road (north) edge", () => {
    const parking = makeRoom({ type: "PARKING", xMm: 0, yMm: 0, widthMm: 2700, lengthMm: 5000 });
    const result = validateHouseModel(baseModel([parking]));
    expect(result.warnings.some((w) => w.code === "PARKING_NOT_AT_ROAD")).toBe(false);
  });

  it("errors when the plot is too small to leave any buildable area", () => {
    const model = baseModel([]);
    model.plot.buildableWidthMm = 0;
    model.plot.buildableLengthMm = 0;
    const result = validateHouseModel(model);
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.code).toBe("PLOT_TOO_SMALL_FOR_SETBACKS");
  });

  it("errors when the staircase sits at a different position on two floors", () => {
    const model = baseModel([]);
    model.floors = [
      { ...model.floors[0]!, floorNumber: 0, stairs: [{ id: "s1", xMm: 0, yMm: 0, widthMm: 900, lengthMm: 3000, connectsFloors: [0, 1] }] },
      { ...model.floors[0]!, floorNumber: 1, stairs: [{ id: "s1", xMm: 100, yMm: 0, widthMm: 900, lengthMm: 3000, connectsFloors: [0, 1] }] },
    ];
    const result = validateHouseModel(model);
    expect(result.errors.some((e) => e.code === "STAIRCASE_MISALIGNED")).toBe(true);
  });

  it("passes an identically-positioned staircase across floors", () => {
    const model = baseModel([]);
    const stair = { id: "s1", xMm: 0, yMm: 0, widthMm: 900, lengthMm: 3000, connectsFloors: [0, 1] };
    model.floors = [
      { ...model.floors[0]!, floorNumber: 0, stairs: [{ ...stair }] },
      { ...model.floors[0]!, floorNumber: 1, stairs: [{ ...stair }] },
    ];
    const result = validateHouseModel(model);
    expect(result.errors.some((e) => e.code === "STAIRCASE_MISALIGNED")).toBe(false);
  });
});
