import type { RoomType } from "@/lib/domain/types";

/**
 * Conceptual default minimum room dimensions, in millimeters.
 *
 * SPEC.md §15: these are CONCEPTUAL DEFAULTS, not a claim of universal
 * Indian building-code compliance, and must live in configuration rather
 * than being hard-coded throughout the geometry engine. The geometry engine
 * (Phase 3+) reads from here; nothing else should duplicate these numbers.
 */
export interface RoomConstraint {
  minWidthMm: number;
  minLengthMm: number;
}

export const ROOM_CONSTRAINTS: Partial<Record<RoomType, RoomConstraint>> = {
  BEDROOM: { minWidthMm: 3000, minLengthMm: 3300 },
  MASTER_BEDROOM: { minWidthMm: 3600, minLengthMm: 4200 },
  CHILDREN_BEDROOM: { minWidthMm: 3000, minLengthMm: 3300 },
  GUEST_BEDROOM: { minWidthMm: 3000, minLengthMm: 3300 },
  BATHROOM: { minWidthMm: 1500, minLengthMm: 2100 },
  POWDER_ROOM: { minWidthMm: 1200, minLengthMm: 1500 },
  KITCHEN: { minWidthMm: 2400, minLengthMm: 3000 },
  LIVING: { minWidthMm: 3300, minLengthMm: 4200 },
  DINING: { minWidthMm: 2700, minLengthMm: 3300 },
  PUJA: { minWidthMm: 1200, minLengthMm: 1200 },
  OFFICE: { minWidthMm: 2400, minLengthMm: 2700 },
  UTILITY: { minWidthMm: 1500, minLengthMm: 1800 },
  STORE: { minWidthMm: 1200, minLengthMm: 1500 },
  LAUNDRY: { minWidthMm: 1500, minLengthMm: 1800 },
  STAIRCASE: { minWidthMm: 900, minLengthMm: 3000 },
  CORRIDOR: { minWidthMm: 900, minLengthMm: 900 },
  BALCONY: { minWidthMm: 900, minLengthMm: 1800 },
  PARKING: { minWidthMm: 2700, minLengthMm: 5000 },
  TERRACE: { minWidthMm: 1800, minLengthMm: 1800 },
};

export function getRoomConstraint(type: RoomType): RoomConstraint | null {
  return ROOM_CONSTRAINTS[type] ?? null;
}

/**
 * Scoring weights (SPEC §21). Configurable; do not scatter these numbers
 * elsewhere. The scoring engine (Phase 3/4) reads from here.
 */
export const DESIGN_SCORE_WEIGHTS = {
  requirementMatch: 0.25,
  spaceEfficiency: 0.15,
  circulation: 0.15,
  budget: 0.15,
  orientation: 0.1,
  vastu: 0.1,
  lightVentilation: 0.1,
} as const;
