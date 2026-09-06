import { describe, expect, it } from "vitest";

import { getRoomConstraint } from "@/lib/config/room-constraints";
import {
  createProjectSchema,
  designOperationSchema,
  houseRequirementsInputSchema,
  plotInputSchema,
} from "@/lib/domain/schemas";

describe("createProjectSchema", () => {
  it("accepts a valid name", () => {
    const result = createProjectSchema.safeParse({ name: "My House" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createProjectSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });
});

describe("plotInputSchema", () => {
  it("accepts a valid 30x50 ft plot expressed in millimeters", () => {
    // 30 ft = 9144mm, 50 ft = 15240mm — matches SPEC.md §8 example exactly.
    const result = plotInputSchema.safeParse({
      widthMm: 9144,
      lengthMm: 15240,
      roadSide: "NORTH",
      northDirectionDegrees: 0,
      locationCountry: "IN",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer millimeter dimensions", () => {
    const result = plotInputSchema.safeParse({
      widthMm: 9144.5,
      lengthMm: 15240,
      roadSide: "NORTH",
      northDirectionDegrees: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero-or-negative dimension", () => {
    const result = plotInputSchema.safeParse({
      widthMm: 0,
      lengthMm: 15240,
      roadSide: "NORTH",
      northDirectionDegrees: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid road side", () => {
    const result = plotInputSchema.safeParse({
      widthMm: 9144,
      lengthMm: 15240,
      roadSide: "UP",
      northDirectionDegrees: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("houseRequirementsInputSchema", () => {
  it("accepts the SPEC.md §62 acceptance-test input", () => {
    const result = houseRequirementsInputSchema.safeParse({
      floors: 2,
      bedrooms: 3,
      bathrooms: 3,
      kitchens: 1,
      parkingCars: 1,
      livingRooms: 1,
      diningRooms: 1,
      architecturalStyle: "MODERN",
      vastuEnabled: true,
      budgetMin: 3_500_000,
      budgetMax: 3_500_000,
      currency: "INR",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unreasonable floor count", () => {
    const result = houseRequirementsInputSchema.safeParse({
      floors: 50,
      bedrooms: 3,
      bathrooms: 3,
      kitchens: 1,
      parkingCars: 1,
      livingRooms: 1,
      diningRooms: 1,
      architecturalStyle: "MODERN",
    });
    expect(result.success).toBe(false);
  });
});

describe("designOperationSchema", () => {
  it("accepts a well-formed RESIZE_ROOM operation (SPEC.md §24)", () => {
    const result = designOperationSchema.safeParse({
      operation: "RESIZE_ROOM",
      target: { room_id: "master-bedroom-1" },
      parameters: { width_change_mm: 300, length_change_mm: 300 },
      reason: "User requested a larger master bedroom.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an operation type outside the allowed contract", () => {
    const result = designOperationSchema.safeParse({
      operation: "DROP_TABLE_PROJECTS",
      target: {},
      parameters: {},
      reason: "malicious",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing reason", () => {
    const result = designOperationSchema.safeParse({
      operation: "ADD_PARKING",
      target: {},
      parameters: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("room constraints config (SPEC.md §15)", () => {
  it("returns configured minimums for a master bedroom", () => {
    const constraint = getRoomConstraint("MASTER_BEDROOM");
    expect(constraint).toEqual({ minWidthMm: 3600, minLengthMm: 4200 });
  });

  it("returns null for a room type with no configured minimum", () => {
    // Every current RoomType happens to have a configured constraint;
    // simulate a future/unknown type to verify the lookup fails closed
    // (returns null) rather than throwing or returning a bogus default.
    const constraint = getRoomConstraint("SOME_FUTURE_ROOM_TYPE" as never);
    expect(constraint).toBeNull();
  });
});
