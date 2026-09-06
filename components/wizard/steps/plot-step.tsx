"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { StepProps } from "@/components/wizard/step-props";

const ROAD_SIDES = [
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTH_EAST",
  "NORTH_WEST",
  "SOUTH_EAST",
  "SOUTH_WEST",
] as const;

export function PlotStep({ state, errors, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Your plot</h2>
        <p className="text-sm text-muted-foreground">
          Tell us the size, orientation, and location of the land you&apos;re building on.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChange("dimensionUnit", "FT")}
          className={
            "rounded-md border px-3 py-1.5 text-sm " +
            (state.dimensionUnit === "FT" ? "border-primary bg-primary text-primary-foreground" : "border-border")
          }
        >
          Feet
        </button>
        <button
          type="button"
          onClick={() => onChange("dimensionUnit", "M")}
          className={
            "rounded-md border px-3 py-1.5 text-sm " +
            (state.dimensionUnit === "M" ? "border-primary bg-primary text-primary-foreground" : "border-border")
          }
        >
          Meters
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="widthInput">Width ({state.dimensionUnit === "FT" ? "ft" : "m"})</Label>
          <Input
            id="widthInput"
            inputMode="decimal"
            value={state.widthInput}
            onChange={(e) => onChange("widthInput", e.target.value)}
            className="mt-1"
          />
          {errors.widthMm && <p className="mt-1 text-xs text-red-600">{errors.widthMm}</p>}
        </div>

        <div>
          <Label htmlFor="lengthInput">Length ({state.dimensionUnit === "FT" ? "ft" : "m"})</Label>
          <Input
            id="lengthInput"
            inputMode="decimal"
            value={state.lengthInput}
            onChange={(e) => onChange("lengthInput", e.target.value)}
            className="mt-1"
          />
          {errors.lengthMm && <p className="mt-1 text-xs text-red-600">{errors.lengthMm}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="roadSide">Road side</Label>
          <Select
            id="roadSide"
            value={state.roadSide}
            onChange={(e) => onChange("roadSide", e.target.value as StepProps["state"]["roadSide"])}
            className="mt-1"
          >
            {ROAD_SIDES.map((side) => (
              <option key={side} value={side}>
                {side.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="northDirectionDegrees">North direction (degrees)</Label>
          <Input
            id="northDirectionDegrees"
            type="number"
            min={0}
            max={360}
            value={state.northDirectionDegrees}
            onChange={(e) => onChange("northDirectionDegrees", Number(e.target.value))}
            className="mt-1"
          />
          {errors.northDirectionDegrees && (
            <p className="mt-1 text-xs text-red-600">{errors.northDirectionDegrees}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="locationState">State</Label>
          <Input
            id="locationState"
            value={state.locationState}
            onChange={(e) => onChange("locationState", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="locationCity">City</Label>
          <Input
            id="locationCity"
            value={state.locationCity}
            onChange={(e) => onChange("locationCity", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            value={state.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
