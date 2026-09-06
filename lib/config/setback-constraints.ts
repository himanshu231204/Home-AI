/**
 * Conceptual default plot setbacks, in millimeters.
 *
 * Like ROOM_CONSTRAINTS (SPEC.md §15), these are CONCEPTUAL DEFAULTS, not a
 * claim of universal Indian municipal building-code compliance. A real
 * per-region regulation architecture (SPEC.md §16) is future work — this is
 * the single flat default the geometry engine uses until that lands.
 */
export const DEFAULT_SETBACKS_MM = {
  frontMm: 3000,
  rearMm: 2000,
  sideMm: 750,
} as const;

/** Circulation allowance between rows of placed rooms, in millimeters. */
export const CORRIDOR_WIDTH_MM = 900;
