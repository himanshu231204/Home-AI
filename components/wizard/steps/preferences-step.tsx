"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { StepProps } from "@/components/wizard/step-props";
import type { DesignPriority } from "@/lib/domain/types";

const PRIORITIES: { value: DesignPriority; label: string }[] = [
  { value: "NATURAL_LIGHT", label: "Natural light" },
  { value: "PRIVACY", label: "Privacy" },
  { value: "LARGE_ROOMS", label: "Large rooms" },
  { value: "LOW_COST", label: "Low cost" },
  { value: "OPEN_SPACES", label: "Open spaces" },
];

export function PreferencesStep({ state, onChange }: StepProps) {
  function togglePriority(value: DesignPriority) {
    const next = state.designPriorities.includes(value)
      ? state.designPriorities.filter((p) => p !== value)
      : [...state.designPriorities, value];
    onChange("designPriorities", next);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          These help us prioritize between design options — they&apos;re preferences, not
          guarantees.
        </p>
      </div>

      <div className="rounded-lg border border-border p-4">
        <label htmlFor="vastuEnabled" className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            id="vastuEnabled"
            checked={state.vastuEnabled}
            onChange={(e) => onChange("vastuEnabled", e.target.checked)}
          />
          Apply Vastu preferences
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          When enabled, we&apos;ll try to honor Vastu-informed placement (entrance direction,
          kitchen and puja placement, bedroom orientation). This is a preference we design
          toward, not a guarantee of Vastu compliance — if it conflicts with a geometric
          requirement, we&apos;ll explain the trade-off (SPEC.md §22).
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">What matters most to you?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRIORITIES.map((priority) => (
            <label key={priority.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={state.designPriorities.includes(priority.value)}
                onChange={() => togglePriority(priority.value)}
              />
              {priority.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
