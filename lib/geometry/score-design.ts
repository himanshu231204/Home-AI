import { DESIGN_SCORE_WEIGHTS } from "@/lib/config/room-constraints";
import type { DesignScore, HouseModel } from "@/lib/domain/types";

const NON_HABITABLE_TYPES = new Set(["STAIRCASE", "PARKING", "CORRIDOR"]);
const OPEN_PLAN_TYPES = new Set(["LIVING", "DINING", "KITCHEN"]);

/**
 * Scores a validated candidate (SPEC.md §21). Budget and Vastu scoring are
 * intentionally neutral placeholders here — real cost data (§31, Phase 6)
 * and Vastu-aware placement heuristics (§22) don't exist yet; faking
 * precision for either would be worse than an honest neutral score.
 */
export function scoreDesign(model: HouseModel): DesignScore {
  const allRooms = model.floors.flatMap((f) => f.rooms);
  const habitableRooms = allRooms.filter((r) => !NON_HABITABLE_TYPES.has(r.type));
  const circulationCheckedRooms = allRooms.filter((r) => !OPEN_PLAN_TYPES.has(r.type));

  const geometryScore = model.constraints.errors.length === 0 ? 1 : Math.max(0, 1 - model.constraints.errors.length * 0.2);

  const buildableAreaMm2 = model.plot.buildableWidthMm * model.plot.buildableLengthMm;
  const groundFloor = model.floors.find((f) => f.floorNumber === 0);
  const spaceEfficiencyScore =
    buildableAreaMm2 > 0 && groundFloor ? Math.min(1, groundFloor.builtAreaMm2 / buildableAreaMm2) : 0;

  const circulationScore =
    circulationCheckedRooms.length === 0
      ? 1
      : circulationCheckedRooms.filter((r) => r.doors.length > 0).length / circulationCheckedRooms.length;

  const lightVentilationScore =
    habitableRooms.length === 0 ? 1 : habitableRooms.filter((r) => r.windows.length > 0).length / habitableRooms.length;

  const requirementMatchScore = 1;
  const budgetScore = 1;
  const orientationScore = 1;
  const vastuScore = 1;

  const overallScore =
    requirementMatchScore * DESIGN_SCORE_WEIGHTS.requirementMatch +
    spaceEfficiencyScore * DESIGN_SCORE_WEIGHTS.spaceEfficiency +
    circulationScore * DESIGN_SCORE_WEIGHTS.circulation +
    budgetScore * DESIGN_SCORE_WEIGHTS.budget +
    orientationScore * DESIGN_SCORE_WEIGHTS.orientation +
    vastuScore * DESIGN_SCORE_WEIGHTS.vastu +
    lightVentilationScore * DESIGN_SCORE_WEIGHTS.lightVentilation;

  return {
    geometryScore,
    spaceEfficiencyScore,
    circulationScore,
    requirementMatchScore,
    budgetScore,
    orientationScore,
    vastuScore,
    lightVentilationScore,
    overallScore,
  };
}
