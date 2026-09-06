import { describe, expect, it } from "vitest";
import { z } from "zod";

import { houseRequirementsInputSchema, plotInputSchema } from "@/lib/domain/schemas";
import type { HouseRequirements, Plot } from "@/lib/domain/types";
import {
  buildPlotPayload,
  buildRequirementsPayload,
  DEFAULT_WIZARD_STATE,
  wizardStateFromPlot,
  wizardStateFromRequirements,
  zodErrorsToFieldMap,
} from "@/lib/domain/wizard";

describe("DEFAULT_WIZARD_STATE", () => {
  it("produces a requirements payload that passes full validation with no user input", () => {
    // The wizard PUTs the full requirements object after every step, so the
    // defaults must already satisfy houseRequirementsInputSchema (SPEC.md
    // §38) even before the user reaches steps like Style.
    const result = houseRequirementsInputSchema.safeParse(
      buildRequirementsPayload(DEFAULT_WIZARD_STATE),
    );
    expect(result.success).toBe(true);
  });
});

describe("buildPlotPayload", () => {
  it("converts the entered feet into the SPEC.md §8 example millimeters", () => {
    const payload = buildPlotPayload({
      ...DEFAULT_WIZARD_STATE,
      dimensionUnit: "FT",
      widthInput: "30",
      lengthInput: "50",
    });
    expect(payload.widthMm).toBe(9144);
    expect(payload.lengthMm).toBe(15240);

    const result = plotInputSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("blanks out empty optional location fields as null rather than empty strings", () => {
    const payload = buildPlotPayload({
      ...DEFAULT_WIZARD_STATE,
      widthInput: "30",
      lengthInput: "50",
      locationState: "  ",
      locationCity: "",
    });
    expect(payload.locationState).toBeNull();
    expect(payload.locationCity).toBeNull();
  });
});

describe("wizardStateFromPlot / wizardStateFromRequirements (resume a draft)", () => {
  it("round-trips a saved plot back into editable feet", () => {
    const plot: Plot = {
      id: "plot-1",
      projectId: "project-1",
      widthMm: 9144,
      lengthMm: 15240,
      roadSide: "EAST",
      northDirectionDegrees: 90,
      locationCountry: "IN",
      locationState: "Karnataka",
      locationCity: "Bengaluru",
      postalCode: "560001",
      plotShape: "RECTANGLE",
    };

    const seeded = wizardStateFromPlot(DEFAULT_WIZARD_STATE, plot);
    expect(seeded.widthInput).toBe("30");
    expect(seeded.lengthInput).toBe("50");
    expect(seeded.roadSide).toBe("EAST");
    expect(seeded.locationCity).toBe("Bengaluru");
  });

  it("round-trips saved requirements", () => {
    const requirements: HouseRequirements = {
      floors: 2,
      bedrooms: 4,
      bathrooms: 3,
      kitchens: 1,
      parkingCars: 2,
      livingRooms: 1,
      diningRooms: 1,
      pujaRoom: true,
      homeOffice: false,
      balcony: true,
      terrace: false,
      utilityRoom: true,
      storeRoom: false,
      laundryRoom: false,
      vastuEnabled: true,
      designPriorities: ["NATURAL_LIGHT", "PRIVACY"],
      architecturalStyle: "LUXURY",
      constructionQuality: "PREMIUM",
      budgetMin: 4_000_000,
      budgetMax: 6_000_000,
      currency: "INR",
      additionalRequirements: "Please include a home theater.",
    };

    const seeded = wizardStateFromRequirements(DEFAULT_WIZARD_STATE, requirements);
    const result = houseRequirementsInputSchema.safeParse(buildRequirementsPayload(seeded));
    expect(result.success).toBe(true);
    expect(seeded.budgetMin).toBe("4000000");
    expect(seeded.designPriorities).toEqual(["NATURAL_LIGHT", "PRIVACY"]);
  });

  it("leaves state untouched when no plot/requirements have been saved yet", () => {
    expect(wizardStateFromPlot(DEFAULT_WIZARD_STATE, null)).toBe(DEFAULT_WIZARD_STATE);
    expect(wizardStateFromRequirements(DEFAULT_WIZARD_STATE, null)).toBe(DEFAULT_WIZARD_STATE);
  });
});

describe("zodErrorsToFieldMap", () => {
  it("keeps only the first message per field path", () => {
    const schema = z.object({ widthMm: z.number().int().positive() });
    const result = schema.safeParse({ widthMm: -5.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(1);
      const map = zodErrorsToFieldMap(result.error);
      expect(Object.keys(map)).toEqual(["widthMm"]);
      expect(map.widthMm).toBe(result.error.issues[0]?.message);
    }
  });

  it("maps each distinct field path to its own entry", () => {
    const schema = z.object({ widthMm: z.number().positive(), lengthMm: z.number().positive() });
    const result = schema.safeParse({ widthMm: -1, lengthMm: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const map = zodErrorsToFieldMap(result.error);
      expect(Object.keys(map).sort()).toEqual(["lengthMm", "widthMm"]);
    }
  });
});
