"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StepProps } from "@/components/wizard/step-props";

const COUNT_FIELDS = [
  { key: "livingRooms", label: "Living rooms" },
  { key: "diningRooms", label: "Dining rooms" },
  { key: "kitchens", label: "Kitchens" },
] as const;

const TOGGLE_FIELDS = [
  { key: "pujaRoom", label: "Puja room" },
  { key: "homeOffice", label: "Home office" },
  { key: "balcony", label: "Balcony" },
  { key: "terrace", label: "Terrace" },
  { key: "utilityRoom", label: "Utility room" },
  { key: "storeRoom", label: "Store room" },
  { key: "laundryRoom", label: "Laundry room" },
] as const;

export function RoomsStep({ state, errors, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Rooms</h2>
        <p className="text-sm text-muted-foreground">
          Choose the additional spaces you&apos;d like included.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {COUNT_FIELDS.map(({ key, label }) => (
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

      <div className="grid gap-3 sm:grid-cols-2">
        {TOGGLE_FIELDS.map(({ key, label }) => (
          <label key={key} htmlFor={key} className="flex items-center gap-2 text-sm">
            <Checkbox id={key} checked={state[key]} onChange={(e) => onChange(key, e.target.checked)} />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
