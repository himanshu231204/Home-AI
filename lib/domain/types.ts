/**
 * Core domain types for the AI House Designer.
 *
 * These types mirror SPEC.md §9-14. The HouseModel (and everything it
 * contains) is the single source of truth for a design. AI output, images,
 * and renders are all derived FROM this model — never the other way around.
 *
 * Phase 1 note: this file defines the shapes the rest of the system will
 * consume. The geometry engine that PRODUCES valid HouseModel instances is
 * Phase 3/4 work (SPEC.md §17-19, §75) and is intentionally not implemented
 * here yet. Do not wire fake/mock geometry generation against these types —
 * leave that as a clearly marked TODO until the real engine exists.
 */

// ---------------------------------------------------------------------------
// Enums (kept as string unions so they serialize cleanly and stay
// configuration-friendly rather than hard-coded native enums scattered
// across layers).
// ---------------------------------------------------------------------------

export type ProjectStatus = "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED";

export type RoadSide =
  | "NORTH"
  | "SOUTH"
  | "EAST"
  | "WEST"
  | "NORTH_EAST"
  | "NORTH_WEST"
  | "SOUTH_EAST"
  | "SOUTH_WEST";

export type PlotShape = "RECTANGLE"; // Future: L_SHAPE, IRREGULAR, CUSTOM_POLYGON (SPEC §9)

export type ArchitecturalStyle =
  | "MODERN"
  | "CONTEMPORARY"
  | "TRADITIONAL"
  | "MINIMAL"
  | "LUXURY"
  | "INDIAN_MODERN";

// Maps to the CostEngine's `quality_level` input (SPEC.md §31).
export type ConstructionQuality = "ECONOMY" | "STANDARD" | "PREMIUM";

// Step 6 "Preferences" checkboxes (SPEC.md §38), excluding Vastu which has
// its own dedicated toggle (`vastuEnabled`) and conflict-explanation model
// (SPEC.md §22). These feed the AI design-intent contract's `priorities`
// list (SPEC.md §23).
export type DesignPriority =
  | "NATURAL_LIGHT"
  | "PRIVACY"
  | "LARGE_ROOMS"
  | "LOW_COST"
  | "OPEN_SPACES";

export type RoomType =
  | "LIVING"
  | "DINING"
  | "KITCHEN"
  | "BEDROOM"
  | "MASTER_BEDROOM"
  | "CHILDREN_BEDROOM"
  | "GUEST_BEDROOM"
  | "BATHROOM"
  | "POWDER_ROOM"
  | "PUJA"
  | "OFFICE"
  | "UTILITY"
  | "STORE"
  | "LAUNDRY"
  | "STAIRCASE"
  | "CORRIDOR"
  | "BALCONY"
  | "PARKING"
  | "TERRACE";

export type Direction = "NORTH" | "SOUTH" | "EAST" | "WEST";

export type ValidationStatus = "VALID" | "VALID_WITH_WARNINGS" | "INVALID";

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  userId: string | null;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Plot
// ---------------------------------------------------------------------------

export interface Plot {
  id: string;
  projectId: string;

  widthMm: number;
  lengthMm: number;

  roadSide: RoadSide;
  northDirectionDegrees: number;

  locationCountry: string;
  locationState: string | null;
  locationCity: string | null;
  postalCode: string | null;

  plotShape: PlotShape;
}

// ---------------------------------------------------------------------------
// Requirements
// ---------------------------------------------------------------------------

export interface HouseRequirements {
  floors: number;

  bedrooms: number;
  bathrooms: number;
  kitchens: number;

  parkingCars: number;

  livingRooms: number;
  diningRooms: number;

  pujaRoom: boolean;
  homeOffice: boolean;
  balcony: boolean;
  terrace: boolean;
  utilityRoom: boolean;
  storeRoom: boolean;
  laundryRoom: boolean;

  vastuEnabled: boolean;
  designPriorities: DesignPriority[];

  architecturalStyle: ArchitecturalStyle;

  constructionQuality: ConstructionQuality;

  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;

  additionalRequirements: string;
}

// ---------------------------------------------------------------------------
// Room / Floor / HouseModel — defined now so downstream layers can type
// against them; population is Phase 3+ (geometry engine).
// ---------------------------------------------------------------------------

export interface Room {
  id: string;

  type: RoomType;
  name: string;

  xMm: number;
  yMm: number;

  widthMm: number;
  lengthMm: number;

  rotationDegrees: number;

  floorNumber: number;

  minimumWidthMm: number;
  minimumAreaMm2: number;

  windows: string[];
  doors: string[];

  preferredOrientation: Direction | null;

  metadata: Record<string, unknown>;
}

export interface Door {
  id: string;
  roomIds: string[];
  xMm: number;
  yMm: number;
  widthMm: number;
}

export interface Window {
  id: string;
  roomId: string;
  xMm: number;
  yMm: number;
  widthMm: number;
}

export interface Staircase {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  lengthMm: number;
  connectsFloors: number[];
}

export interface Balcony {
  id: string;
  roomId: string | null;
  xMm: number;
  yMm: number;
  widthMm: number;
  lengthMm: number;
}

export interface OpenSpace {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  lengthMm: number;
}

export interface Floor {
  id: string;
  floorNumber: number;

  elevationMm: number;

  rooms: Room[];
  doors: Door[];
  windows: Window[];
  stairs: Staircase[];
  balconies: Balcony[];
  openSpaces: OpenSpace[];

  builtAreaMm2: number;
}

export interface DesignScore {
  geometryScore: number;
  spaceEfficiencyScore: number;
  circulationScore: number;
  requirementMatchScore: number;
  budgetScore: number;
  orientationScore: number;
  vastuScore: number;
  lightVentilationScore: number;
  overallScore: number;
}

export interface CostCategory {
  name: string;
  low: number;
  expected: number;
  high: number;
}

export interface CostEstimate {
  currency: string;
  low: number;
  expected: number;
  high: number;
  categories: CostCategory[];
  assumptions: string[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface DesignMetadata {
  strategy: "BUDGET_OPTIMIZED" | "FAMILY_COMFORT" | "PREMIUM";
  generatedAt: string;
  notes: string[];
}

export interface PlotGeometry {
  widthMm: number;
  lengthMm: number;
  buildableWidthMm: number;
  buildableLengthMm: number;
  setbackFrontMm: number | null;
  setbackRearMm: number | null;
  setbackSideMm: number | null;
}

export interface Orientation {
  roadSide: RoadSide;
  northDirectionDegrees: number;
}

export interface HouseModel {
  id: string;
  projectId: string;

  version: number;

  plot: PlotGeometry;

  floors: Floor[];

  totalBuiltUpAreaMm2: number;
  totalOpenAreaMm2: number;

  orientation: Orientation;

  constraints: ValidationResult;

  score: DesignScore | null;

  estimatedCost: CostEstimate | null;

  status: ValidationStatus;

  metadata: DesignMetadata;
}

// ---------------------------------------------------------------------------
// AI contracts (SPEC §23-24) — structural shapes only. Actual parsing +
// validation against these lives behind an AIProvider interface (Phase 6).
// ---------------------------------------------------------------------------

export type DesignOperationType =
  | "MOVE_ROOM"
  | "RESIZE_ROOM"
  | "ADD_ROOM"
  | "REMOVE_ROOM"
  | "CHANGE_ROOM_TYPE"
  | "ADD_BALCONY"
  | "REMOVE_BALCONY"
  | "ADD_PARKING"
  | "REMOVE_PARKING"
  | "MOVE_STAIRCASE"
  | "CHANGE_STYLE"
  | "CHANGE_BUDGET"
  | "CHANGE_FLOOR_COUNT"
  | "CHANGE_ORIENTATION";

export interface DesignOperation {
  operation: DesignOperationType;
  target: Record<string, unknown>;
  parameters: Record<string, unknown>;
  reason: string;
}
