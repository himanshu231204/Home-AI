import { CORRIDOR_WIDTH_MM } from "@/lib/config/setback-constraints";
import type { Door, Room, Staircase, Window } from "@/lib/domain/types";
import { rectsTouch, sharedEdgeMidpoint } from "@/lib/geometry/geometry-utils";
import type { PlacedRect, RoomCluster, RoomSpec } from "@/lib/geometry/types";

export interface FloorPlacement {
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  stairs: Staircase[];
  builtAreaMm2: number;
}

interface PlacedItem {
  spec: RoomSpec;
  rect: PlacedRect;
}

/** Heuristic backtracking steps (SPEC.md §18): shrink toward minimums until it fits. */
const MAX_SHRINK_ATTEMPTS = 11;

const CLUSTER_ORDER: Record<RoomCluster, number> = {
  PARKING: -1,
  STAIRCASE: -1,
  SOCIAL: 0,
  BEDROOM: 1,
  SUPPORT: 2,
};

function shrinkSpec(spec: RoomSpec, factor: number): RoomSpec {
  return {
    ...spec,
    targetWidthMm: Math.max(spec.minWidthMm, Math.round(spec.targetWidthMm - (spec.targetWidthMm - spec.minWidthMm) * factor)),
    targetLengthMm: Math.max(
      spec.minLengthMm,
      Math.round(spec.targetLengthMm - (spec.targetLengthMm - spec.minLengthMm) * factor),
    ),
  };
}

interface PackedRow {
  yMm: number;
  heightMm: number;
  usedWidthMm: number;
  items: PlacedItem[];
}

/**
 * Best-fit-decreasing shelf packing (SPEC.md §18 "possible implementation").
 * Rooms are placed widest-first; each one joins whichever already-started
 * row leaves the least leftover width (without exceeding that row's
 * height), and only starts a new row when it fits none of them. This packs
 * far tighter than filling rows strictly in program order, which routinely
 * left 30-40% of a row's width unused.
 */
function packRows(
  specsInOrder: RoomSpec[],
  buildableWidthMm: number,
  startY: number,
  reducedWidthUntilY: number,
  reduceByMm: number,
): { items: PlacedItem[]; bottomY: number } | null {
  const availableWidthAt = (yMm: number) => (yMm < reducedWidthUntilY ? buildableWidthMm - reduceByMm : buildableWidthMm);

  const rows: PackedRow[] = [];
  let nextY = startY;

  const sorted = [...specsInOrder].sort((a, b) => b.targetWidthMm - a.targetWidthMm);

  for (const spec of sorted) {
    let bestRow: PackedRow | null = null;
    let bestLeftover = Infinity;

    for (const row of rows) {
      if (spec.targetLengthMm > row.heightMm) continue;
      const leftover = availableWidthAt(row.yMm) - row.usedWidthMm - spec.targetWidthMm;
      if (leftover >= 0 && leftover < bestLeftover) {
        bestRow = row;
        bestLeftover = leftover;
      }
    }

    if (bestRow) {
      bestRow.items.push({
        spec,
        rect: { xMm: bestRow.usedWidthMm, yMm: bestRow.yMm, widthMm: spec.targetWidthMm, lengthMm: spec.targetLengthMm },
      });
      bestRow.usedWidthMm += spec.targetWidthMm;
      continue;
    }

    const rowY = nextY;
    const availableWidth = availableWidthAt(rowY);
    if (spec.targetWidthMm > availableWidth) return null;

    const row: PackedRow = {
      yMm: rowY,
      heightMm: spec.targetLengthMm,
      usedWidthMm: spec.targetWidthMm,
      items: [{ spec, rect: { xMm: 0, yMm: rowY, widthMm: spec.targetWidthMm, lengthMm: spec.targetLengthMm } }],
    };
    rows.push(row);
    nextY = rowY + row.heightMm + CORRIDOR_WIDTH_MM;
  }

  const items = rows.flatMap((r) => r.items);
  const lastRow = rows[rows.length - 1];
  const bottomY = lastRow ? lastRow.yMm + lastRow.heightMm : startY;
  return { items, bottomY };
}

function tryPlaceOnce(
  buildableWidthMm: number,
  buildableLengthMm: number,
  parkingSpecs: RoomSpec[],
  staircaseSpecs: RoomSpec[],
  restSpecs: RoomSpec[],
  fixedStaircaseRect: PlacedRect | null,
): PlacedItem[] | null {
  const items: PlacedItem[] = [];

  // Staircase is pinned at a rect fixed by the caller so it lands on the
  // same footprint on every floor (SPEC.md §15 staircase connectivity) —
  // it never shrinks, unlike everything else in this function.
  let staircaseRect: PlacedRect | null = null;
  const staircaseSpec = staircaseSpecs[0];
  if (staircaseSpec) {
    if (!fixedStaircaseRect) return null;
    staircaseRect = fixedStaircaseRect;
    if (
      staircaseRect.xMm < 0 ||
      staircaseRect.yMm < 0 ||
      staircaseRect.xMm + staircaseRect.widthMm > buildableWidthMm ||
      staircaseRect.yMm + staircaseRect.lengthMm > buildableLengthMm
    ) {
      return null;
    }
    items.push({ spec: staircaseSpec, rect: staircaseRect });
  }

  const reduceUntilY = staircaseRect ? staircaseRect.lengthMm : 0;
  const reduceByMm = staircaseRect ? staircaseRect.widthMm : 0;

  // Parking packs into the same row-flow as everything else (placed
  // first, per SPEC.md §15 parking access, so it starts at y=0 flush
  // against the road edge for north/east/west-facing roads) rather than
  // reserving an entire dedicated row — reserving a full row wastes
  // whatever width the parking bay itself doesn't use. A south-facing
  // road isn't modeled precisely (parking still starts at y=0); the
  // validator flags that as a warning rather than this silently
  // pretending it's correct.
  const packed = packRows([...parkingSpecs, ...restSpecs], buildableWidthMm, 0, reduceUntilY, reduceByMm);
  if (!packed) return null;

  let usedHeightMm = packed.bottomY;
  if (staircaseRect) {
    usedHeightMm = Math.max(usedHeightMm, staircaseRect.yMm + staircaseRect.lengthMm);
  }

  if (usedHeightMm > buildableLengthMm) return null;

  items.push(...packed.items);
  return items;
}

const NO_WINDOW_TYPES = new Set(["STAIRCASE", "PARKING", "CORRIDOR"]);

function buildRoomsDoorsWindows(
  items: PlacedItem[],
  buildableWidthMm: number,
  buildableLengthMm: number,
): { rooms: Room[]; doors: Door[]; windows: Window[] } {
  const rooms: Room[] = items.map(({ spec, rect }) => ({
    id: crypto.randomUUID(),
    type: spec.type,
    name: spec.name,
    xMm: rect.xMm,
    yMm: rect.yMm,
    widthMm: rect.widthMm,
    lengthMm: rect.lengthMm,
    rotationDegrees: 0,
    floorNumber: spec.floorNumber,
    minimumWidthMm: spec.minWidthMm,
    minimumAreaMm2: spec.minWidthMm * spec.minLengthMm,
    windows: [],
    doors: [],
    preferredOrientation: null,
    metadata: {},
  }));

  const doors: Door[] = [];
  for (let i = 0; i < items.length; i++) {
    const itemA = items[i];
    const roomA = rooms[i];
    if (!itemA || !roomA) continue;
    for (let j = i + 1; j < items.length; j++) {
      const itemB = items[j];
      const roomB = rooms[j];
      if (!itemB || !roomB) continue;
      if (!rectsTouch(itemA.rect, itemB.rect)) continue;
      const mid = sharedEdgeMidpoint(itemA.rect, itemB.rect);
      const door: Door = {
        id: crypto.randomUUID(),
        roomIds: [roomA.id, roomB.id],
        xMm: mid.xMm,
        yMm: mid.yMm,
        widthMm: 900,
      };
      doors.push(door);
      roomA.doors.push(door.id);
      roomB.doors.push(door.id);
    }
  }

  // Circulation links (SPEC.md §15 "Connectivity"): rows are deliberately
  // separated by a corridor gap so they never physically touch, and the
  // staircase sits in its own reserved corner — without an explicit
  // corridor room, a floor with more than one row would otherwise be a set
  // of disconnected islands. Link each row's first room to the previous
  // row's, and the staircase to the first row, as a stand-in for that
  // corridor (door position is schematic, not a real shared wall).
  const connectedPairs = new Set<string>();
  for (const door of doors) connectedPairs.add([...door.roomIds].sort().join("|"));

  function ensureCirculationLink(i: number, j: number) {
    const roomA = rooms[i];
    const roomB = rooms[j];
    const itemA = items[i];
    const itemB = items[j];
    if (!roomA || !roomB || !itemA || !itemB || roomA.id === roomB.id) return;
    const key = [roomA.id, roomB.id].sort().join("|");
    if (connectedPairs.has(key)) return;
    connectedPairs.add(key);
    const door: Door = {
      id: crypto.randomUUID(),
      roomIds: [roomA.id, roomB.id],
      xMm: (itemA.rect.xMm + itemA.rect.widthMm / 2 + itemB.rect.xMm + itemB.rect.widthMm / 2) / 2,
      yMm: (itemA.rect.yMm + itemA.rect.lengthMm / 2 + itemB.rect.yMm + itemB.rect.lengthMm / 2) / 2,
      widthMm: 900,
    };
    doors.push(door);
    roomA.doors.push(door.id);
    roomB.doors.push(door.id);
  }

  const rowFirstIndexByY = new Map<number, number>();
  let staircaseIndex = -1;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    if (item.spec.type === "STAIRCASE") {
      staircaseIndex = i;
      continue;
    }
    if (!rowFirstIndexByY.has(item.rect.yMm)) rowFirstIndexByY.set(item.rect.yMm, i);
  }
  const sortedRowYs = [...rowFirstIndexByY.keys()].sort((a, b) => a - b);
  for (let k = 1; k < sortedRowYs.length; k++) {
    const prevY = sortedRowYs[k - 1];
    const currY = sortedRowYs[k];
    if (prevY === undefined || currY === undefined) continue;
    ensureCirculationLink(rowFirstIndexByY.get(prevY)!, rowFirstIndexByY.get(currY)!);
  }
  const firstRowY = sortedRowYs[0];
  if (staircaseIndex >= 0 && firstRowY !== undefined) {
    ensureCirculationLink(staircaseIndex, rowFirstIndexByY.get(firstRowY)!);
  }

  const windows: Window[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const room = rooms[i];
    if (!item || !room) continue;
    const { spec, rect } = item;
    if (NO_WINDOW_TYPES.has(spec.type)) continue;

    let windowPoint: { xMm: number; yMm: number; widthMm: number } | null = null;
    if (rect.yMm === 0) {
      windowPoint = { xMm: rect.xMm + rect.widthMm / 2, yMm: 0, widthMm: Math.min(1200, rect.widthMm - 200) };
    } else if (rect.yMm + rect.lengthMm === buildableLengthMm) {
      windowPoint = {
        xMm: rect.xMm + rect.widthMm / 2,
        yMm: rect.yMm + rect.lengthMm,
        widthMm: Math.min(1200, rect.widthMm - 200),
      };
    } else if (rect.xMm === 0) {
      windowPoint = { xMm: 0, yMm: rect.yMm + rect.lengthMm / 2, widthMm: Math.min(1200, rect.lengthMm - 200) };
    } else if (rect.xMm + rect.widthMm === buildableWidthMm) {
      windowPoint = {
        xMm: rect.xMm + rect.widthMm,
        yMm: rect.yMm + rect.lengthMm / 2,
        widthMm: Math.min(1200, rect.lengthMm - 200),
      };
    }

    if (windowPoint && windowPoint.widthMm > 0) {
      const window: Window = {
        id: crypto.randomUUID(),
        roomId: room.id,
        xMm: windowPoint.xMm,
        yMm: windowPoint.yMm,
        widthMm: windowPoint.widthMm,
      };
      windows.push(window);
      room.windows.push(window.id);
    }
  }

  return { rooms, doors, windows };
}

/**
 * Places one floor's room program within its buildable rectangle (SPEC.md
 * §17 steps 7, §18). Returns null if no shrink attempt fits — the caller
 * treats that as an infeasible candidate (SPEC.md §52).
 */
export function placeRoomsOnFloor(
  buildableWidthMm: number,
  buildableLengthMm: number,
  specs: RoomSpec[],
  fixedStaircaseRect: PlacedRect | null,
): FloorPlacement | null {
  const parkingSpecs = specs.filter((s) => s.cluster === "PARKING");
  const staircaseSpecs = specs.filter((s) => s.cluster === "STAIRCASE");
  const restSpecsBase = [...specs]
    .filter((s) => s.cluster !== "PARKING" && s.cluster !== "STAIRCASE")
    .sort((a, b) => CLUSTER_ORDER[a.cluster] - CLUSTER_ORDER[b.cluster]);

  for (let attempt = 0; attempt < MAX_SHRINK_ATTEMPTS; attempt++) {
    const factor = attempt / (MAX_SHRINK_ATTEMPTS - 1);
    const parking = parkingSpecs.map((s) => shrinkSpec(s, factor));
    const rest = restSpecsBase.map((s) => shrinkSpec(s, factor));

    const items = tryPlaceOnce(buildableWidthMm, buildableLengthMm, parking, staircaseSpecs, rest, fixedStaircaseRect);

    if (items) {
      const { rooms, doors, windows } = buildRoomsDoorsWindows(items, buildableWidthMm, buildableLengthMm);
      const stairs: Staircase[] = staircaseSpecs.length > 0 && fixedStaircaseRect
        ? [
            {
              id: rooms.find((r) => r.type === "STAIRCASE")!.id,
              xMm: fixedStaircaseRect.xMm,
              yMm: fixedStaircaseRect.yMm,
              widthMm: fixedStaircaseRect.widthMm,
              lengthMm: fixedStaircaseRect.lengthMm,
              connectsFloors: [],
            },
          ]
        : [];
      const builtAreaMm2 = rooms.reduce((sum, r) => sum + r.widthMm * r.lengthMm, 0);

      return { rooms, doors, windows, stairs, builtAreaMm2 };
    }
  }

  return null;
}

/** Computes the (identical-on-every-floor) staircase footprint, top-right corner. */
export function computeFixedStaircaseRect(
  staircaseSpec: RoomSpec,
  buildableWidthMm: number,
): PlacedRect {
  return {
    xMm: Math.max(0, buildableWidthMm - staircaseSpec.targetWidthMm),
    yMm: 0,
    widthMm: staircaseSpec.targetWidthMm,
    lengthMm: staircaseSpec.targetLengthMm,
  };
}
