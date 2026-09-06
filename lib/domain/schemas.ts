import { z } from "zod";

/**
 * Runtime validation schemas.
 *
 * Every value that crosses a trust boundary (HTTP request body, LLM output,
 * client input) must be parsed through one of these before it touches
 * business logic or the database. See SPEC.md §23-24 and the master prompt
 * §15 ("Never trust raw LLM output").
 */

export const roadSideSchema = z.enum([
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTH_EAST",
  "NORTH_WEST",
  "SOUTH_EAST",
  "SOUTH_WEST",
]);

export const plotShapeSchema = z.enum(["RECTANGLE"]);

export const architecturalStyleSchema = z.enum([
  "MODERN",
  "CONTEMPORARY",
  "TRADITIONAL",
  "MINIMAL",
  "LUXURY",
  "INDIAN_MODERN",
]);

export const constructionQualitySchema = z.enum(["ECONOMY", "STANDARD", "PREMIUM"]);

export const designPrioritySchema = z.enum([
  "NATURAL_LIGHT",
  "PRIVACY",
  "LARGE_ROOMS",
  "LOW_COST",
  "OPEN_SPACES",
]);

export const projectStatusSchema = z.enum(["DRAFT", "GENERATING", "COMPLETED", "FAILED"]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(120),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  status: projectStatusSchema.optional(),
});

// Millimeters, integer, sane bounds (1ft = 305mm; cap generously at 500m).
const mmDimension = z
  .number()
  .int("Dimensions must be whole millimeters")
  .positive()
  .max(500_000, "Dimension exceeds supported plot size");

export const plotInputSchema = z.object({
  widthMm: mmDimension,
  lengthMm: mmDimension,
  roadSide: roadSideSchema,
  northDirectionDegrees: z.number().min(0).max(360),
  locationCountry: z.string().trim().min(1).default("IN"),
  locationState: z.string().trim().min(1).nullable().optional(),
  locationCity: z.string().trim().min(1).nullable().optional(),
  postalCode: z.string().trim().min(1).nullable().optional(),
  plotShape: plotShapeSchema.default("RECTANGLE"),
});

// Base object schema (SPEC.md §38 steps 2-7) kept un-refined so wizard steps
// can `.pick()` their own field subsets for per-step validation. The
// cross-field budget check is layered on afterwards via
// `houseRequirementsInputSchema` below — refined schemas can no longer be
// `.pick()`-ed by zod.
const houseRequirementsObjectSchema = z.object({
  // Step 2 — Family
  floors: z.number().int().min(1).max(6),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  parkingCars: z.number().int().min(0).max(10),

  // Step 3 — Rooms
  kitchens: z.number().int().min(0).max(5),
  livingRooms: z.number().int().min(0).max(5),
  diningRooms: z.number().int().min(0).max(5),
  pujaRoom: z.boolean().default(false),
  homeOffice: z.boolean().default(false),
  balcony: z.boolean().default(false),
  terrace: z.boolean().default(false),
  utilityRoom: z.boolean().default(false),
  storeRoom: z.boolean().default(false),
  laundryRoom: z.boolean().default(false),

  // Step 4 — Budget
  budgetMin: z.number().positive().nullable().optional(),
  budgetMax: z.number().positive().nullable().optional(),
  currency: z.string().trim().length(3).default("INR"),
  constructionQuality: constructionQualitySchema.default("STANDARD"),

  // Step 5 — Style
  architecturalStyle: architecturalStyleSchema,

  // Step 6 — Preferences
  vastuEnabled: z.boolean().default(false),
  designPriorities: z.array(designPrioritySchema).max(5).default([]),

  // Step 7 — Additional requirements
  additionalRequirements: z.string().trim().max(2000).default(""),
});

export const houseRequirementsInputSchema = houseRequirementsObjectSchema.refine(
  (data) => data.budgetMin == null || data.budgetMax == null || data.budgetMax >= data.budgetMin,
  {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["budgetMax"],
  },
);

// ---------------------------------------------------------------------------
// Per-step schemas (SPEC.md §38) — used by the design wizard to validate one
// step at a time without requiring fields the user hasn't reached yet.
// ---------------------------------------------------------------------------

export const familyStepSchema = houseRequirementsObjectSchema.pick({
  floors: true,
  bedrooms: true,
  bathrooms: true,
  parkingCars: true,
});

export const roomsStepSchema = houseRequirementsObjectSchema.pick({
  kitchens: true,
  livingRooms: true,
  diningRooms: true,
  pujaRoom: true,
  homeOffice: true,
  balcony: true,
  terrace: true,
  utilityRoom: true,
  storeRoom: true,
  laundryRoom: true,
});

export const budgetStepSchema = houseRequirementsObjectSchema
  .pick({
    budgetMin: true,
    budgetMax: true,
    currency: true,
    constructionQuality: true,
  })
  .refine(
    (data) => data.budgetMin == null || data.budgetMax == null || data.budgetMax >= data.budgetMin,
    {
      message: "Maximum budget must be greater than or equal to minimum budget",
      path: ["budgetMax"],
    },
  );

export const styleStepSchema = houseRequirementsObjectSchema.pick({
  architecturalStyle: true,
});

export const preferencesStepSchema = houseRequirementsObjectSchema.pick({
  vastuEnabled: true,
  designPriorities: true,
});

export const additionalRequirementsStepSchema = houseRequirementsObjectSchema.pick({
  additionalRequirements: true,
});

// ---------------------------------------------------------------------------
// AI design-operation contract (SPEC §24). This is the ONLY shape an LLM's
// modification output is allowed to take. It never contains raw geometry —
// the geometry engine is responsible for turning this into a new HouseModel.
// ---------------------------------------------------------------------------

export const designOperationTypeSchema = z.enum([
  "MOVE_ROOM",
  "RESIZE_ROOM",
  "ADD_ROOM",
  "REMOVE_ROOM",
  "CHANGE_ROOM_TYPE",
  "ADD_BALCONY",
  "REMOVE_BALCONY",
  "ADD_PARKING",
  "REMOVE_PARKING",
  "MOVE_STAIRCASE",
  "CHANGE_STYLE",
  "CHANGE_BUDGET",
  "CHANGE_FLOOR_COUNT",
  "CHANGE_ORIENTATION",
]);

export const designOperationSchema = z.object({
  operation: designOperationTypeSchema,
  target: z.record(z.unknown()),
  parameters: z.record(z.unknown()),
  reason: z.string().trim().min(1).max(500),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type PlotInput = z.infer<typeof plotInputSchema>;
export type HouseRequirementsInput = z.infer<typeof houseRequirementsInputSchema>;
export type DesignOperationInput = z.infer<typeof designOperationSchema>;

export type FamilyStepInput = z.infer<typeof familyStepSchema>;
export type RoomsStepInput = z.infer<typeof roomsStepSchema>;
export type BudgetStepInput = z.infer<typeof budgetStepSchema>;
export type StyleStepInput = z.infer<typeof styleStepSchema>;
export type PreferencesStepInput = z.infer<typeof preferencesStepSchema>;
export type AdditionalRequirementsStepInput = z.infer<typeof additionalRequirementsStepSchema>;
