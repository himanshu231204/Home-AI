"use client";

import { cn } from "@/lib/utils";
import type { StepProps } from "@/components/wizard/step-props";

export function AdditionalStep({ state, errors, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Anything else?</h2>
        <p className="text-sm text-muted-foreground">
          Free-form notes for anything the earlier steps didn&apos;t cover.
        </p>
      </div>

      <textarea
        value={state.additionalRequirements}
        onChange={(e) => onChange("additionalRequirements", e.target.value)}
        maxLength={2000}
        rows={6}
        placeholder="E.g. we'd like a separate entrance for the ground-floor bedroom, or a covered space for a car wash area…"
        className={cn(
          "flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={errors.additionalRequirements ? "text-red-600" : undefined}>
          {errors.additionalRequirements ?? ""}
        </span>
        <span>{state.additionalRequirements.length}/2000</span>
      </div>
    </div>
  );
}
