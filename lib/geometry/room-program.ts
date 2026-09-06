import { getRoomConstraint } from "@/lib/config/room-constraints";
import type { HouseRequirements, RoomType } from "@/lib/domain/types";
import type { RoomCluster, RoomSpec } from "@/lib/geometry/types";

export type DesignStrategy = "BUDGET_OPTIMIZED" | "FAMILY_COMFORT" | "PREMIUM";

/**
 * Room types that get bigger under the more generous design strategies
 * (SPEC.md §20). Everything else (bathrooms, utility, parking, ...) stays
 * at its configured minimum regardless of strategy.
 */
const COMFORT_ROOM_TYPES = new Set<RoomType>([
  "LIVING",
  "DINING",
  "BEDROOM",
  "MASTER_BEDROOM",
  "CHILDREN_BEDROOM",
  "GUEST_BEDROOM",
]);

const STRATEGY_SIZE_MULTIPLIER: Record<DesignStrategy, number> = {
  BUDGET_OPTIMIZED: 1.0,
  FAMILY_COMFORT: 1.15,
  PREMIUM: 1.3,
};

function spec(
  type: RoomType,
  name: string,
  cluster: RoomCluster,
  strategy: DesignStrategy,
  overrideMinWidthMm?: number,
): RoomSpec {
  const constraint = getRoomConstraint(type);
  // Every RoomType used here is configured in ROOM_CONSTRAINTS; this is an
  // engine invariant, not user input, so failing loudly is correct.
  if (!constraint) {
    throw new Error(`No room constraint configured for room type ${type}`);
  }

  const minWidthMm = overrideMinWidthMm ?? constraint.minWidthMm;
  const minLengthMm = constraint.minLengthMm;
  const multiplier = COMFORT_ROOM_TYPES.has(type) ? STRATEGY_SIZE_MULTIPLIER[strategy] : 1;

  return {
    type,
    name,
    floorNumber: 0, // assigned later by assignRoomsToFloors
    minWidthMm,
    minLengthMm,
    targetWidthMm: Math.round(minWidthMm * multiplier),
    targetLengthMm: Math.round(minLengthMm * multiplier),
    cluster,
  };
}

/**
 * Expands HouseRequirements (SPEC.md §10) into the concrete list of rooms
 * the design needs (SPEC.md §17 step 6), sized per the given strategy
 * (SPEC.md §20) but not yet placed or assigned to a floor.
 */
export function buildRoomProgram(
  requirements: HouseRequirements,
  strategy: DesignStrategy,
): RoomSpec[] {
  const specs: RoomSpec[] = [];

  for (let i = 0; i < requirements.bedrooms; i++) {
    const isMaster = i === 0;
    specs.push(
      spec(
        isMaster ? "MASTER_BEDROOM" : "BEDROOM",
        isMaster ? "Master Bedroom" : `Bedroom ${i + 1}`,
        "BEDROOM",
        strategy,
      ),
    );
  }

  for (let i = 0; i < requirements.bathrooms; i++) {
    specs.push(spec("BATHROOM", `Bathroom ${i + 1}`, "BEDROOM", strategy));
  }

  for (let i = 0; i < requirements.kitchens; i++) {
    specs.push(spec("KITCHEN", requirements.kitchens > 1 ? `Kitchen ${i + 1}` : "Kitchen", "SOCIAL", strategy));
  }

  for (let i = 0; i < requirements.livingRooms; i++) {
    specs.push(
      spec("LIVING", requirements.livingRooms > 1 ? `Living Room ${i + 1}` : "Living Room", "SOCIAL", strategy),
    );
  }

  for (let i = 0; i < requirements.diningRooms; i++) {
    specs.push(
      spec("DINING", requirements.diningRooms > 1 ? `Dining Room ${i + 1}` : "Dining Room", "SOCIAL", strategy),
    );
  }

  if (requirements.parkingCars > 0) {
    const perCarWidthMm = getRoomConstraint("PARKING")!.minWidthMm;
    specs.push(
      spec(
        "PARKING",
        requirements.parkingCars > 1 ? `Parking (${requirements.parkingCars} cars)` : "Parking",
        "PARKING",
        strategy,
        perCarWidthMm * requirements.parkingCars,
      ),
    );
  }

  if (requirements.pujaRoom) specs.push(spec("PUJA", "Puja Room", "SUPPORT", strategy));
  if (requirements.homeOffice) specs.push(spec("OFFICE", "Home Office", "SUPPORT", strategy));
  if (requirements.utilityRoom) specs.push(spec("UTILITY", "Utility", "SUPPORT", strategy));
  if (requirements.storeRoom) specs.push(spec("STORE", "Store Room", "SUPPORT", strategy));
  if (requirements.laundryRoom) specs.push(spec("LAUNDRY", "Laundry", "SUPPORT", strategy));
  if (requirements.balcony) specs.push(spec("BALCONY", "Balcony", "SUPPORT", strategy));
  if (requirements.terrace) specs.push(spec("TERRACE", "Terrace", "SUPPORT", strategy));

  if (requirements.floors > 1) {
    specs.push(spec("STAIRCASE", "Staircase", "STAIRCASE", strategy));
  }

  return specs;
}

/**
 * Distributes the room program across floors (SPEC.md §17 step 6). Social
 * and support rooms live on the ground floor; bedrooms/bathrooms go upstairs
 * once there's more than one floor (a common G+N layout convention); the
 * terrace sits on the top floor; the staircase is duplicated onto every
 * floor since it must occupy the same footprint on each one (SPEC.md §15
 * staircase connectivity) — placement is responsible for actually keeping
 * its position identical across floors.
 */
export function assignRoomsToFloors(
  specs: RoomSpec[],
  floorCount: number,
): Map<number, RoomSpec[]> {
  const byFloor = new Map<number, RoomSpec[]>();
  for (let f = 0; f < floorCount; f++) byFloor.set(f, []);

  const staircaseSpec = specs.find((s) => s.type === "STAIRCASE");
  const terraceSpec = specs.find((s) => s.type === "TERRACE");
  const upstairsClusters: RoomCluster[] = floorCount > 1 ? ["BEDROOM"] : [];

  const bedroomLikeSpecs = specs.filter((s) => upstairsClusters.includes(s.cluster));
  const groundFloorSpecs = specs.filter(
    (s) => s.type !== "STAIRCASE" && s.type !== "TERRACE" && !upstairsClusters.includes(s.cluster),
  );

  byFloor.get(0)!.push(...groundFloorSpecs);

  if (floorCount === 1) {
    byFloor.get(0)!.push(...bedroomLikeSpecs);
  } else {
    // Round-robin bedrooms/bathrooms across the upper floors (1..floorCount-1).
    const upperFloorCount = floorCount - 1;
    bedroomLikeSpecs.forEach((roomSpec, index) => {
      const floorNumber = 1 + (index % upperFloorCount);
      byFloor.get(floorNumber)!.push(roomSpec);
    });
  }

  if (terraceSpec) {
    byFloor.get(floorCount - 1)!.push(terraceSpec);
  }

  if (staircaseSpec && floorCount > 1) {
    for (let f = 0; f < floorCount; f++) {
      byFloor.get(f)!.push({ ...staircaseSpec });
    }
  }

  for (const [floorNumber, floorSpecs] of byFloor) {
    for (const roomSpec of floorSpecs) roomSpec.floorNumber = floorNumber;
  }

  return byFloor;
}
