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

export const houseRequirementsInputSchema = z.object({
  floors: z.number().int().min(1).max(6),

  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  kitchens: z.number().int().min(0).max(5),

  parkingCars: z.number().int().min(0).max(10),

  livingRooms: z.number().int().min(0).max(5),
  diningRooms: z.number().int().min(0).max(5),

  pujaRoom: z.boolean().default(false),
  homeOffice: z.boolean().default(false),
  balcony: z.boolean().default(false),
  terrace: z.boolean().default(false),
  utilityRoom: z.boolean().default(false),
  storeRoom: z.boolean().default(false),
  laundryRoom: z.boolean().default(false),

  vastuEnabled: z.boolean().default(false),

  architecturalStyle: architecturalStyleSchema,

  budgetMin: z.number().positive().nullable().optional(),
  budgetMax: z.number().positive().nullable().optional(),
  currency: z.string().trim().length(3).default("INR"),

  additionalRequirements: z.string().trim().max(2000).default(""),
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
