"use client";

import { cn } from "@/lib/utils";
import type { StepProps } from "@/components/wizard/step-props";

const STYLES = [
  { value: "MODERN", label: "Modern" },
  { value: "CONTEMPORARY", label: "Contemporary" },
  { value: "TRADITIONAL", label: "Traditional" },
  { value: "MINIMAL", label: "Minimal" },
  { value: "LUXURY", label: "Luxury" },
  { value: "INDIAN_MODERN", label: "Indian Modern" },
] as const;

export function StyleStep({ state, errors, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Architectural style</h2>
        <p className="text-sm text-muted-foreground">Pick the look that feels most like home.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {STYLES.map((style) => {
          const selected = state.architecturalStyle === style.value;
          return (
            <button
              key={style.value}
              type="button"
              onClick={() => onChange("architecturalStyle", style.value)}
              className={cn(
                "rounded-lg border p-4 text-left text-sm font-medium transition-colors",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
              )}
            >
              {style.label}
            </button>
          );
        })}
      </div>
      {errors.architecturalStyle && (
        <p className="text-xs text-red-600">{errors.architecturalStyle}</p>
      )}
    </div>
  );
}
