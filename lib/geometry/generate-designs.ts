import type { Floor, HouseModel, HouseRequirements, Plot, ValidationResult } from "@/lib/domain/types";
import { calculatePlotGeometry } from "@/lib/geometry/plot-geometry";
import { computeFixedStaircaseRect, placeRoomsOnFloor } from "@/lib/geometry/placement";
import { assignRoomsToFloors, buildRoomProgram, type DesignStrategy } from "@/lib/geometry/room-program";
import { scoreDesign } from "@/lib/geometry/score-design";
import { validateHouseModel } from "@/lib/geometry/validate-house-model";

const STRATEGIES: DesignStrategy[] = ["BUDGET_OPTIMIZED", "FAMILY_COMFORT", "PREMIUM"];

/** Elevation between floors, in millimeters — a typical floor-to-floor height. */
const FLOOR_HEIGHT_MM = 3000;

/**
 * Generates the three diverse design candidates (SPEC.md §17, §20) for a
 * plot + set of requirements, using a deterministic geometry engine — no
 * AI, no rendering, no cost estimate yet (those are Phases 4/5/6). Every
 * candidate returned has been run through `validateHouseModel`, including
 * ones that came out infeasible: SPEC.md §62 forbids returning an
 * unvalidated geometry object as a completed design, not returning a
 * design that failed validation at all.
 */
export function generateDesignCandidates(plot: Plot, requirements: HouseRequirements, projectId: string): HouseModel[] {
  const plotGeometry = calculatePlotGeometry(plot);

  return STRATEGIES.map((strategy) => {
    const specs = buildRoomProgram(requirements, strategy);
    const byFloor = assignRoomsToFloors(specs, requirements.floors);

    const staircaseSpec = specs.find((s) => s.type === "STAIRCASE");
    const fixedStaircaseRect = staircaseSpec
      ? computeFixedStaircaseRect(staircaseSpec, plotGeometry.buildableWidthMm)
      : null;

    const floors: Floor[] = [];
    let infeasibleFloorNumber: number | null = null;

    for (let floorNumber = 0; floorNumber < requirements.floors; floorNumber++) {
      const floorSpecs = byFloor.get(floorNumber) ?? [];
      const placement = placeRoomsOnFloor(
        plotGeometry.buildableWidthMm,
        plotGeometry.buildableLengthMm,
        floorSpecs,
        fixedStaircaseRect,
      );

      if (!placement) {
        infeasibleFloorNumber = floorNumber;
        break;
      }

      floors.push({
        id: crypto.randomUUID(),
        floorNumber,
        elevationMm: floorNumber * FLOOR_HEIGHT_MM,
        rooms: placement.rooms,
        doors: placement.doors,
        windows: placement.windows,
        stairs: placement.stairs,
        balconies: [],
        openSpaces: [],
        builtAreaMm2: placement.builtAreaMm2,
      });
    }

    const staircaseFloorNumbers = floors.filter((f) => f.stairs.length > 0).map((f) => f.floorNumber);
    for (const floor of floors) {
      for (const stair of floor.stairs) stair.connectsFloors = staircaseFloorNumbers;
    }

    const model: HouseModel = {
      id: crypto.randomUUID(),
      projectId,
      version: 1,
      plot: plotGeometry,
      floors,
      totalBuiltUpAreaMm2: floors.reduce((sum, f) => sum + f.builtAreaMm2, 0),
      totalOpenAreaMm2: Math.max(
        0,
        plotGeometry.buildableWidthMm * plotGeometry.buildableLengthMm - (floors[0]?.builtAreaMm2 ?? 0),
      ),
      orientation: { roadSide: plot.roadSide, northDirectionDegrees: plot.northDirectionDegrees },
      constraints: { valid: false, errors: [], warnings: [] },
      score: null,
      estimatedCost: null,
      status: "INVALID",
      metadata: {
        strategy,
        generatedAt: new Date().toISOString(),
        notes: [],
      },
    };

    let constraints: ValidationResult;
    if (infeasibleFloorNumber !== null) {
      constraints = {
        valid: false,
        errors: [
          {
            code: "PLACEMENT_INFEASIBLE",
            message: `Could not fit the requested rooms on floor ${infeasibleFloorNumber} within the buildable area, even at minimum sizes.`,
            path: `floors[${infeasibleFloorNumber}]`,
          },
        ],
        warnings: [],
      };
    } else {
      constraints = validateHouseModel(model);
    }

    model.constraints = constraints;
    model.status = constraints.valid
      ? constraints.warnings.length === 0
        ? "VALID"
        : "VALID_WITH_WARNINGS"
      : "INVALID";
    model.score = floors.length > 0 ? scoreDesign(model) : null;

    return model;
  });
}
