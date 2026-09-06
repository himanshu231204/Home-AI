import type { ZodError } from "zod";

import type { PlotInput } from "@/lib/domain/schemas";
import type {
  ArchitecturalStyle,
  ConstructionQuality,
  DesignPriority,
  HouseRequirements,
  Plot,
  RoadSide,
} from "@/lib/domain/types";
import { toMm, type LengthUnit } from "@/lib/domain/units";

/**
 * Client-side state for the design wizard (SPEC.md §38). This is a flat,
 * always-valid-shaped superset of the plot + house_requirements fields the
 * wizard collects across its 7 steps, plus a couple of UI-only fields
 * (`dimensionUnit`, and the raw string inputs for numbers that can be
 * legitimately empty while typing).
 */
export interface WizardState {
  // Step 1 — Plot
  dimensionUnit: LengthUnit;
  widthInput: string;
  lengthInput: string;
  roadSide: RoadSide;
  northDirectionDegrees: number;
  locationCountry: string;
  locationState: string;
  locationCity: string;
  postalCode: string;

  // Step 2 — Family
  floors: number;
  bedrooms: number;
  bathrooms: number;
  parkingCars: number;

  // Step 3 — Rooms
  kitchens: number;
  livingRooms: number;
  diningRooms: number;
  pujaRoom: boolean;
  homeOffice: boolean;
  balcony: boolean;
  terrace: boolean;
  utilityRoom: boolean;
  storeRoom: boolean;
  laundryRoom: boolean;

  // Step 4 — Budget
  budgetMin: string;
  budgetMax: string;
  currency: string;
  constructionQuality: ConstructionQuality;

  // Step 5 — Style
  architecturalStyle: ArchitecturalStyle;

  // Step 6 — Preferences
  vastuEnabled: boolean;
  designPriorities: DesignPriority[];

  // Step 7 — Additional requirements
  additionalRequirements: string;
}

export const DEFAULT_WIZARD_STATE: WizardState = {
  dimensionUnit: "FT",
  widthInput: "",
  lengthInput: "",
  roadSide: "NORTH",
  northDirectionDegrees: 0,
  locationCountry: "IN",
  locationState: "",
  locationCity: "",
  postalCode: "",

  floors: 1,
  bedrooms: 2,
  bathrooms: 2,
  parkingCars: 1,

  kitchens: 1,
  livingRooms: 1,
  diningRooms: 1,
  pujaRoom: false,
  homeOffice: false,
  balcony: false,
  terrace: false,
  utilityRoom: false,
  storeRoom: false,
  laundryRoom: false,

  budgetMin: "",
  budgetMax: "",
  currency: "INR",
  constructionQuality: "STANDARD",

  architecturalStyle: "MODERN",

  vastuEnabled: false,
  designPriorities: [],

  additionalRequirements: "",
};

/** Seeds wizard state from a previously-saved plot, if one exists (resume). */
export function wizardStateFromPlot(state: WizardState, plot: Plot | null): WizardState {
  if (!plot) return state;
  return {
    ...state,
    widthInput: String(fromMmForDisplay(plot.widthMm, state.dimensionUnit)),
    lengthInput: String(fromMmForDisplay(plot.lengthMm, state.dimensionUnit)),
    roadSide: plot.roadSide,
    northDirectionDegrees: plot.northDirectionDegrees,
    locationCountry: plot.locationCountry,
    locationState: plot.locationState ?? "",
    locationCity: plot.locationCity ?? "",
    postalCode: plot.postalCode ?? "",
  };
}

/** Seeds wizard state from previously-saved requirements, if any exist (resume). */
export function wizardStateFromRequirements(
  state: WizardState,
  requirements: HouseRequirements | null,
): WizardState {
  if (!requirements) return state;
  return {
    ...state,
    floors: requirements.floors,
    bedrooms: requirements.bedrooms,
    bathrooms: requirements.bathrooms,
    parkingCars: requirements.parkingCars,
    kitchens: requirements.kitchens,
    livingRooms: requirements.livingRooms,
    diningRooms: requirements.diningRooms,
    pujaRoom: requirements.pujaRoom,
    homeOffice: requirements.homeOffice,
    balcony: requirements.balcony,
    terrace: requirements.terrace,
    utilityRoom: requirements.utilityRoom,
    storeRoom: requirements.storeRoom,
    laundryRoom: requirements.laundryRoom,
    budgetMin: requirements.budgetMin == null ? "" : String(requirements.budgetMin),
    budgetMax: requirements.budgetMax == null ? "" : String(requirements.budgetMax),
    currency: requirements.currency,
    constructionQuality: requirements.constructionQuality,
    architecturalStyle: requirements.architecturalStyle,
    vastuEnabled: requirements.vastuEnabled,
    designPriorities: requirements.designPriorities,
    additionalRequirements: requirements.additionalRequirements,
  };
}

function fromMmForDisplay(mm: number, unit: LengthUnit): number {
  const perUnit = unit === "FT" ? 304.8 : 1000;
  return Math.round((mm / perUnit) * 100) / 100;
}

/** Builds the plot API payload (pre-validation) from current wizard state. */
export function buildPlotPayload(state: WizardState): Partial<PlotInput> {
  return {
    widthMm: toMm(Number(state.widthInput), state.dimensionUnit),
    lengthMm: toMm(Number(state.lengthInput), state.dimensionUnit),
    roadSide: state.roadSide,
    northDirectionDegrees: state.northDirectionDegrees,
    locationCountry: state.locationCountry,
    locationState: state.locationState.trim() === "" ? null : state.locationState.trim(),
    locationCity: state.locationCity.trim() === "" ? null : state.locationCity.trim(),
    postalCode: state.postalCode.trim() === "" ? null : state.postalCode.trim(),
    plotShape: "RECTANGLE",
  };
}

/** Builds the house_requirements API payload (pre-validation) from current wizard state. */
export function buildRequirementsPayload(state: WizardState): Record<string, unknown> {
  return {
    floors: state.floors,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    parkingCars: state.parkingCars,
    kitchens: state.kitchens,
    livingRooms: state.livingRooms,
    diningRooms: state.diningRooms,
    pujaRoom: state.pujaRoom,
    homeOffice: state.homeOffice,
    balcony: state.balcony,
    terrace: state.terrace,
    utilityRoom: state.utilityRoom,
    storeRoom: state.storeRoom,
    laundryRoom: state.laundryRoom,
    budgetMin: state.budgetMin.trim() === "" ? null : Number(state.budgetMin),
    budgetMax: state.budgetMax.trim() === "" ? null : Number(state.budgetMax),
    currency: state.currency,
    constructionQuality: state.constructionQuality,
    architecturalStyle: state.architecturalStyle,
    vastuEnabled: state.vastuEnabled,
    designPriorities: state.designPriorities,
    additionalRequirements: state.additionalRequirements,
  };
}

/** Flattens the first Zod issue per field path into a `{ field: message }` map. */
export function zodErrorsToFieldMap(error: ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!(key in map)) {
      map[key] = issue.message;
    }
  }
  return map;
}
