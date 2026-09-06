"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StepProps } from "@/components/wizard/step-props";

const FIELDS = [
  { key: "bedrooms", label: "Bedrooms" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "floors", label: "Floors" },
  { key: "parkingCars", label: "Parking (cars)" },
] as const;

export function FamilyStep({ state, errors, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Your family</h2>
        <p className="text-sm text-muted-foreground">
          How many bedrooms, bathrooms, floors, and parking spaces do you need?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="number"
              min={0}
              value={state[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="mt-1"
            />
            {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
