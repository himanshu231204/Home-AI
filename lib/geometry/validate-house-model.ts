import type { HouseModel, Room, ValidationIssue, ValidationResult } from "@/lib/domain/types";
import { rectsOverlap, rectsTouch } from "@/lib/geometry/geometry-utils";
import { primaryRoadEdge } from "@/lib/geometry/plot-geometry";

const BEDROOM_TYPES = new Set(["BEDROOM", "MASTER_BEDROOM", "CHILDREN_BEDROOM", "GUEST_BEDROOM"]);
const OPEN_PLAN_TYPES = new Set(["LIVING", "DINING", "KITCHEN"]);

function touchesFloorEdge(
  room: Room,
  edge: "NORTH" | "SOUTH" | "EAST" | "WEST",
  buildableWidthMm: number,
  buildableLengthMm: number,
): boolean {
  switch (edge) {
    case "NORTH":
      return room.yMm === 0;
    case "SOUTH":
      return room.yMm + room.lengthMm === buildableLengthMm;
    case "WEST":
      return room.xMm === 0;
    case "EAST":
      return room.xMm + room.widthMm === buildableWidthMm;
  }
}

/**
 * Validates a generated HouseModel against SPEC.md §15's geometry rules.
 * Never returns "valid" for a model that hasn't actually been checked
 * (SPEC.md §62) — every rule below appends to errors/warnings rather than
 * short-circuiting, so callers see the full picture.
 */
export function validateHouseModel(model: HouseModel): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const { buildableWidthMm, buildableLengthMm } = model.plot;

  if (buildableWidthMm <= 0 || buildableLengthMm <= 0) {
    errors.push({
      code: "PLOT_TOO_SMALL_FOR_SETBACKS",
      message: "The plot is too small to leave any buildable area after setbacks.",
      path: "plot",
    });
    return { valid: false, errors, warnings };
  }

  const roadEdge = primaryRoadEdge(model.orientation.roadSide);

  for (const floor of model.floors) {
    const path = `floors[${floor.floorNumber}]`;

    // Room containment (SPEC.md §15 "Room containment").
    for (const room of floor.rooms) {
      const withinBounds =
        room.xMm >= 0 &&
        room.yMm >= 0 &&
        room.xMm + room.widthMm <= buildableWidthMm &&
        room.yMm + room.lengthMm <= buildableLengthMm;
      if (!withinBounds) {
        errors.push({
          code: "ROOM_OUTSIDE_BUILDABLE_AREA",
          message: `${room.name} extends outside the buildable area.`,
          path: `${path}.rooms[${room.id}]`,
        });
      }

      // Minimum room dimensions (SPEC.md §15 "Minimum room dimensions").
      if (room.widthMm < room.minimumWidthMm) {
        errors.push({
          code: "ROOM_BELOW_MINIMUM_WIDTH",
          message: `${room.name} is narrower than its configured minimum width.`,
          path: `${path}.rooms[${room.id}]`,
        });
      }
      if (room.widthMm * room.lengthMm < room.minimumAreaMm2) {
        errors.push({
          code: "ROOM_BELOW_MINIMUM_AREA",
          message: `${room.name} is smaller than its configured minimum area.`,
          path: `${path}.rooms[${room.id}]`,
        });
      }
    }

    // No unacceptable overlap (SPEC.md §15 "No unacceptable overlap").
    for (let i = 0; i < floor.rooms.length; i++) {
      const roomA = floor.rooms[i];
      if (!roomA) continue;
      for (let j = i + 1; j < floor.rooms.length; j++) {
        const roomB = floor.rooms[j];
        if (!roomB) continue;
        if (rectsOverlap(roomA, roomB)) {
          errors.push({
            code: "ROOMS_OVERLAP",
            message: `${roomA.name} overlaps ${roomB.name}.`,
            path,
          });
        }
      }
    }

    // Connectivity (SPEC.md §15 "Connectivity"): every room must be
    // reachable from any other via a chain of doors. This deliberately
    // uses the generated doors (which include both real touching-wall
    // doors and the schematic corridor links between rows/the staircase),
    // not raw rectsTouch — rows are spaced apart by a corridor gap on
    // purpose, so physical touching alone would call every multi-row
    // floor disconnected.
    const firstRoom = floor.rooms[0];
    if (firstRoom) {
      const doorGraph = new Map<string, string[]>();
      for (const room of floor.rooms) doorGraph.set(room.id, []);
      for (const door of floor.doors) {
        const [a, b] = door.roomIds;
        if (a === undefined || b === undefined) continue;
        doorGraph.get(a)?.push(b);
        doorGraph.get(b)?.push(a);
      }

      const visited = new Set<string>([firstRoom.id]);
      const queue = [firstRoom.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const neighbor of doorGraph.get(current) ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      for (const room of floor.rooms) {
        if (!visited.has(room.id)) {
          errors.push({
            code: "ROOM_NOT_REACHABLE",
            message: `${room.name} is not reachable from the rest of the floor.`,
            path: `${path}.rooms[${room.id}]`,
          });
        }
      }
    }

    // Door connectivity (SPEC.md §15 "Door connectivity") — open-plan
    // social rooms are allowed to rely on shared open space instead.
    for (const room of floor.rooms) {
      if (OPEN_PLAN_TYPES.has(room.type)) continue;
      if (room.doors.length === 0) {
        warnings.push({
          code: "ROOM_HAS_NO_DOOR",
          message: `${room.name} has no door.`,
          path: `${path}.rooms[${room.id}]`,
        });
      }
    }

    // Bathroom access (SPEC.md §15 "Bathroom access").
    for (const room of floor.rooms) {
      if (room.type !== "BATHROOM" && room.type !== "POWDER_ROOM") continue;
      const touchesBedroom = floor.rooms.some(
        (other) => other.id !== room.id && BEDROOM_TYPES.has(other.type) && rectsTouch(room, other),
      );
      if (!touchesBedroom && room.doors.length === 0) {
        errors.push({
          code: "BATHROOM_NOT_ACCESSIBLE",
          message: `${room.name} isn't adjacent to a bedroom or connected by a door.`,
          path: `${path}.rooms[${room.id}]`,
        });
      }
    }

    // Parking access (SPEC.md §15 "Parking access").
    for (const room of floor.rooms) {
      if (room.type !== "PARKING") continue;
      if (!touchesFloorEdge(room, roadEdge, buildableWidthMm, buildableLengthMm)) {
        warnings.push({
          code: "PARKING_NOT_AT_ROAD",
          message: `${room.name} does not reach the road-facing edge of the plot.`,
          path: `${path}.rooms[${room.id}]`,
        });
      }
    }
  }

  // Staircase connectivity (SPEC.md §15 "Staircase connectivity"): the
  // stairwell must occupy the same footprint on every floor.
  if (model.floors.length > 1) {
    const staircasesByFloor = model.floors.map((floor) => floor.stairs[0] ?? null);
    const present = staircasesByFloor.filter((s): s is NonNullable<typeof s> => s !== null);
    if (present.length > 0 && present.length !== model.floors.length) {
      errors.push({
        code: "STAIRCASE_MISSING_ON_SOME_FLOORS",
        message: "Not every floor has a staircase connecting it to the rest of the house.",
        path: "floors",
      });
    } else if (present.length > 1) {
      const [first, ...rest] = present;
      if (!first) return { valid: errors.length === 0, errors, warnings };
      const misaligned = rest.some(
        (s) => s.xMm !== first.xMm || s.yMm !== first.yMm || s.widthMm !== first.widthMm || s.lengthMm !== first.lengthMm,
      );
      if (misaligned) {
        errors.push({
          code: "STAIRCASE_MISALIGNED",
          message: "The staircase doesn't occupy the same position on every floor.",
          path: "floors",
        });
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
