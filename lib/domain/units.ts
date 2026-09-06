/**
 * User-facing <-> canonical unit conversions (SPEC.md §8).
 *
 * The canonical geometry representation is always integer millimeters.
 * These helpers only exist at the UI boundary (the plot step of the design
 * wizard) so users can enter dimensions in feet or meters.
 */

export type LengthUnit = "FT" | "M";

const MM_PER_FOOT = 304.8;
const MM_PER_METER = 1000;

export function toMm(value: number, unit: LengthUnit): number {
  const mm = unit === "FT" ? value * MM_PER_FOOT : value * MM_PER_METER;
  return Math.round(mm);
}

export function fromMm(mm: number, unit: LengthUnit): number {
  const value = unit === "FT" ? mm / MM_PER_FOOT : mm / MM_PER_METER;
  return Math.round(value * 100) / 100;
}
