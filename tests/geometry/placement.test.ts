import { describe, expect, it } from "vitest";

import { rectsOverlap } from "@/lib/geometry/geometry-utils";
import { computeFixedStaircaseRect, placeRoomsOnFloor } from "@/lib/geometry/placement";
import type { RoomSpec } from "@/lib/geometry/types";

function makeSpec(overrides: Partial<RoomSpec> & Pick<RoomSpec, "type" | "cluster">): RoomSpec {
  return {
    name: overrides.type,
    floorNumber: 0,
    minWidthMm: 3000,
    minLengthMm: 3300,
    targetWidthMm: 3000,
    targetLengthMm: 3300,
    ...overrides,
  };
}

describe("placeRoomsOnFloor", () => {
  it("places non-overlapping rooms fully inside the buildable area", () => {
    const specs: RoomSpec[] = [
      makeSpec({ type: "LIVING", cluster: "SOCIAL", targetWidthMm: 3300, targetLengthMm: 4200, minWidthMm: 3300, minLengthMm: 4200 }),
      makeSpec({ type: "DINING", cluster: "SOCIAL", targetWidthMm: 2700, targetLengthMm: 3300, minWidthMm: 2700, minLengthMm: 3300 }),
      makeSpec({ type: "KITCHEN", cluster: "SOCIAL", targetWidthMm: 2400, targetLengthMm: 3000, minWidthMm: 2400, minLengthMm: 3000 }),
    ];

    const placement = placeRoomsOnFloor(9144, 12240, specs, null);
    expect(placement).not.toBeNull();
    expect(placement!.rooms).toHaveLength(3);

    for (const room of placement!.rooms) {
      expect(room.xMm).toBeGreaterThanOrEqual(0);
      expect(room.yMm).toBeGreaterThanOrEqual(0);
      expect(room.xMm + room.widthMm).toBeLessThanOrEqual(9144);
      expect(room.yMm + room.lengthMm).toBeLessThanOrEqual(12240);
    }

    for (let i = 0; i < placement!.rooms.length; i++) {
      for (let j = i + 1; j < placement!.rooms.length; j++) {
        expect(rectsOverlap(placement!.rooms[i]!, placement!.rooms[j]!)).toBe(false);
      }
    }
  });

  it("wraps to a new row when a room doesn't fit the remaining width", () => {
    // Buildable width only fits one 3000mm-wide room per row.
    const specs: RoomSpec[] = [
      makeSpec({ type: "BEDROOM", cluster: "BEDROOM" }),
      makeSpec({ type: "BEDROOM", cluster: "BEDROOM" }),
    ];

    const placement = placeRoomsOnFloor(3200, 10000, specs, null);
    expect(placement).not.toBeNull();
    const [first, second] = placement!.rooms;
    expect(first!.yMm).toBe(0);
    expect(second!.yMm).toBeGreaterThan(0);
  });

  it("returns null when even the minimum sizes don't fit the buildable area", () => {
    const specs: RoomSpec[] = [makeSpec({ type: "MASTER_BEDROOM", cluster: "BEDROOM", minWidthMm: 3600, minLengthMm: 4200, targetWidthMm: 5000, targetLengthMm: 6000 })];
    const placement = placeRoomsOnFloor(2000, 2000, specs, null);
    expect(placement).toBeNull();
  });

  it("shrinks toward the minimum when the target size doesn't fit but the minimum does", () => {
    const specs: RoomSpec[] = [
      makeSpec({ type: "MASTER_BEDROOM", cluster: "BEDROOM", minWidthMm: 3600, minLengthMm: 4200, targetWidthMm: 5000, targetLengthMm: 6000 }),
    ];
    // Fits the minimum (3600x4200) but not the target (5000x6000).
    const placement = placeRoomsOnFloor(4000, 4500, specs, null);
    expect(placement).not.toBeNull();
    // Finer-grained backtracking picks the largest size that still fits,
    // not necessarily the bare minimum — just bounded by [min, target].
    expect(placement!.rooms[0]!.widthMm).toBeGreaterThanOrEqual(3600);
    expect(placement!.rooms[0]!.widthMm).toBeLessThanOrEqual(5000);
    expect(placement!.rooms[0]!.lengthMm).toBeGreaterThanOrEqual(4200);
    expect(placement!.rooms[0]!.lengthMm).toBeLessThanOrEqual(6000);
  });

  it("falls back to the exact minimum when nothing larger fits at all", () => {
    const specs: RoomSpec[] = [
      makeSpec({ type: "MASTER_BEDROOM", cluster: "BEDROOM", minWidthMm: 3600, minLengthMm: 4200, targetWidthMm: 5000, targetLengthMm: 6000 }),
    ];
    // Only the exact minimum (3600x4200) fits this buildable area.
    const placement = placeRoomsOnFloor(3600, 4200, specs, null);
    expect(placement).not.toBeNull();
    expect(placement!.rooms[0]!.widthMm).toBe(3600);
    expect(placement!.rooms[0]!.lengthMm).toBe(4200);
  });

  it("generates a door between two touching rooms", () => {
    const specs: RoomSpec[] = [
      makeSpec({ type: "LIVING", cluster: "SOCIAL", targetWidthMm: 3000, targetLengthMm: 3000, minWidthMm: 3000, minLengthMm: 3000 }),
      makeSpec({ type: "DINING", cluster: "SOCIAL", targetWidthMm: 3000, targetLengthMm: 3000, minWidthMm: 3000, minLengthMm: 3000 }),
    ];
    const placement = placeRoomsOnFloor(6000, 3000, specs, null);
    expect(placement).not.toBeNull();
    expect(placement!.doors.length).toBeGreaterThan(0);
    expect(placement!.rooms.every((r) => r.doors.length > 0)).toBe(true);
  });

  it("gives boundary-touching rooms a window but never the staircase", () => {
    const staircaseSpec = makeSpec({
      type: "STAIRCASE",
      cluster: "STAIRCASE",
      minWidthMm: 900,
      minLengthMm: 3000,
      targetWidthMm: 900,
      targetLengthMm: 3000,
    });
    const buildableWidthMm = 6000;
    const fixedStaircaseRect = computeFixedStaircaseRect(staircaseSpec, buildableWidthMm);

    const specs: RoomSpec[] = [
      staircaseSpec,
      makeSpec({ type: "BEDROOM", cluster: "BEDROOM", targetWidthMm: 3000, targetLengthMm: 3300, minWidthMm: 3000, minLengthMm: 3300 }),
    ];

    const placement = placeRoomsOnFloor(buildableWidthMm, 6000, specs, fixedStaircaseRect);
    expect(placement).not.toBeNull();

    const staircaseRoom = placement!.rooms.find((r) => r.type === "STAIRCASE")!;
    expect(staircaseRoom.windows).toHaveLength(0);

    const bedroom = placement!.rooms.find((r) => r.type === "BEDROOM")!;
    expect(bedroom.yMm).toBe(0); // touches the north boundary
    expect(bedroom.windows.length).toBeGreaterThan(0);
  });

  it("places the staircase at the exact fixed rect it was given, every time", () => {
    const staircaseSpec = makeSpec({
      type: "STAIRCASE",
      cluster: "STAIRCASE",
      minWidthMm: 900,
      minLengthMm: 3000,
      targetWidthMm: 900,
      targetLengthMm: 3000,
    });
    const fixedRect = computeFixedStaircaseRect(staircaseSpec, 6000);

    const placementFloor1 = placeRoomsOnFloor(6000, 6000, [staircaseSpec], fixedRect);
    const placementFloor2 = placeRoomsOnFloor(6000, 6000, [staircaseSpec], fixedRect);

    const stair1 = placementFloor1!.rooms.find((r) => r.type === "STAIRCASE")!;
    const stair2 = placementFloor2!.rooms.find((r) => r.type === "STAIRCASE")!;
    expect(stair1.xMm).toBe(stair2.xMm);
    expect(stair1.yMm).toBe(stair2.yMm);
    expect(stair1.widthMm).toBe(stair2.widthMm);
    expect(stair1.lengthMm).toBe(stair2.lengthMm);
  });
});

describe("computeFixedStaircaseRect", () => {
  it("anchors the staircase to the top-right corner of the buildable area", () => {
    const spec = makeSpec({ type: "STAIRCASE", cluster: "STAIRCASE", targetWidthMm: 900, targetLengthMm: 3000 });
    const rect = computeFixedStaircaseRect(spec, 6000);
    expect(rect).toEqual({ xMm: 5100, yMm: 0, widthMm: 900, lengthMm: 3000 });
  });
});
