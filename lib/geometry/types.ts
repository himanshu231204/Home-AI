import type { RoomType } from "@/lib/domain/types";

/**
 * Internal geometry-engine types. These are intermediate representations
 * used while turning a Plot + HouseRequirements into a HouseModel — they
 * never leave lib/geometry.
 */

/** One room the design needs, before it has been placed anywhere. */
export interface RoomSpec {
  type: RoomType;
  name: string;
  floorNumber: number;

  minWidthMm: number;
  minLengthMm: number;
  targetWidthMm: number;
  targetLengthMm: number;

  /** Placement grouping — rooms in the same cluster are placed together. */
  cluster: RoomCluster;
}

export type RoomCluster = "PARKING" | "STAIRCASE" | "SOCIAL" | "BEDROOM" | "SUPPORT";

export interface PlacedRect {
  xMm: number;
  yMm: number;
  widthMm: number;
  lengthMm: number;
}
