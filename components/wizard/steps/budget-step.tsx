"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { StepProps } from "@/components/wizard/step-props";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;

const QUALITY_OPTIONS = [
  { value: "ECONOMY", label: "Economy" },
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
] as const;

export function BudgetStep({ state, errors, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Budget</h2>
        <p className="text-sm text-muted-foreground">
          Give us a range and the construction quality you&apos;re aiming for. Actual costs are
          later shown as an estimate, not a quote (SPEC.md §32).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="budgetMin">Minimum budget</Label>
          <Input
            id="budgetMin"
            inputMode="decimal"
            value={state.budgetMin}
            onChange={(e) => onChange("budgetMin", e.target.value)}
            className="mt-1"
          />
          {errors.budgetMin && <p className="mt-1 text-xs text-red-600">{errors.budgetMin}</p>}
        </div>

        <div>
          <Label htmlFor="budgetMax">Maximum budget</Label>
          <Input
            id="budgetMax"
            inputMode="decimal"
            value={state.budgetMax}
            onChange={(e) => onChange("budgetMax", e.target.value)}
            className="mt-1"
          />
          {errors.budgetMax && <p className="mt-1 text-xs text-red-600">{errors.budgetMax}</p>}
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            id="currency"
            value={state.currency}
            onChange={(e) => onChange("currency", e.target.value)}
            className="mt-1"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="constructionQuality">Construction quality</Label>
        <Select
          id="constructionQuality"
          value={state.constructionQuality}
          onChange={(e) =>
            onChange("constructionQuality", e.target.value as StepProps["state"]["constructionQuality"])
          }
          className="mt-1 max-w-xs"
        >
          {QUALITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
