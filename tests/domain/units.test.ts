import { describe, expect, it } from "vitest";

import { fromMm, toMm } from "@/lib/domain/units";

describe("units (SPEC.md §8)", () => {
  it("converts the SPEC.md §8 example exactly (30ft x 50ft)", () => {
    expect(toMm(30, "FT")).toBe(9144);
    expect(toMm(50, "FT")).toBe(15240);
  });

  it("converts meters to millimeters", () => {
    expect(toMm(10, "M")).toBe(10_000);
  });

  it("rounds to the nearest whole millimeter", () => {
    expect(toMm(1.005, "M")).toBe(1005);
  });

  it("round-trips feet through mm without meaningful drift", () => {
    expect(fromMm(toMm(30, "FT"), "FT")).toBe(30);
  });

  it("round-trips meters through mm without meaningful drift", () => {
    expect(fromMm(toMm(12.5, "M"), "M")).toBe(12.5);
  });
});
