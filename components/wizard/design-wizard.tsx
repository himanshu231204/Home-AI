"use client";

import Link from "next/link";
import { useState } from "react";
import type { ZodTypeAny } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdditionalStep } from "@/components/wizard/steps/additional-step";
import { BudgetStep } from "@/components/wizard/steps/budget-step";
import { FamilyStep } from "@/components/wizard/steps/family-step";
import { PlotStep } from "@/components/wizard/steps/plot-step";
import { PreferencesStep } from "@/components/wizard/steps/preferences-step";
import { RoomsStep } from "@/components/wizard/steps/rooms-step";
import { StyleStep } from "@/components/wizard/steps/style-step";
import { WizardProgress } from "@/components/wizard/wizard-progress";
import {
  additionalRequirementsStepSchema,
  budgetStepSchema,
  familyStepSchema,
  houseRequirementsInputSchema,
  plotInputSchema,
  preferencesStepSchema,
  roomsStepSchema,
  styleStepSchema,
} from "@/lib/domain/schemas";
import type { HouseRequirements, Plot } from "@/lib/domain/types";
import {
  buildPlotPayload,
  buildRequirementsPayload,
  DEFAULT_WIZARD_STATE,
  wizardStateFromPlot,
  wizardStateFromRequirements,
  zodErrorsToFieldMap,
  type WizardState,
} from "@/lib/domain/wizard";

const REQUIREMENTS_STEP_SCHEMAS: Record<number, ZodTypeAny> = {
  2: familyStepSchema,
  3: roomsStepSchema,
  4: budgetStepSchema,
  5: styleStepSchema,
  6: preferencesStepSchema,
  7: additionalRequirementsStepSchema,
};

async function putJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

export function DesignWizard({
  projectId,
  initialPlot,
  initialRequirements,
}: {
  projectId: string;
  initialPlot: Plot | null;
  initialRequirements: HouseRequirements | null;
}) {
  const [state, setState] = useState<WizardState>(() => {
    let seeded = DEFAULT_WIZARD_STATE;
    seeded = wizardStateFromPlot(seeded, initialPlot);
    seeded = wizardStateFromRequirements(seeded, initialRequirements);
    return seeded;
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  function onChange<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function goToStep(target: number) {
    setErrors({});
    setSaveError(null);
    setCompleted(false);
    setStep(target);
  }

  async function handleBack() {
    setErrors({});
    setSaveError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleNext() {
    setSaveError(null);

    if (step === 1) {
      const payload = buildPlotPayload(state);
      const result = plotInputSchema.safeParse(payload);
      if (!result.success) {
        setErrors(zodErrorsToFieldMap(result.error));
        return;
      }

      setErrors({});
      setSaving(true);
      const res = await putJson(`/api/projects/${projectId}/plot`, result.data);
      setSaving(false);

      if (!res.ok) {
        setSaveError("Could not save your plot details. Please try again.");
        return;
      }

      setStep(2);
      return;
    }

    const stepSchema = REQUIREMENTS_STEP_SCHEMAS[step];
    if (!stepSchema) return;

    const payload = buildRequirementsPayload(state);
    const stepResult = stepSchema.safeParse(payload);
    if (!stepResult.success) {
      setErrors(zodErrorsToFieldMap(stepResult.error));
      return;
    }

    const fullResult = houseRequirementsInputSchema.safeParse(payload);
    if (!fullResult.success) {
      setErrors(zodErrorsToFieldMap(fullResult.error));
      return;
    }

    setErrors({});
    setSaving(true);
    const res = await putJson(`/api/projects/${projectId}/requirements`, fullResult.data);
    setSaving(false);

    if (!res.ok) {
      setSaveError("Could not save your requirements. Please try again.");
      return;
    }

    if (step === 7) {
      setCompleted(true);
    } else {
      setStep((s) => s + 1);
    }
  }

  if (completed) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">Your requirements are saved</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve recorded your plot, family, room, budget, style, and preference details.
          Generating full design concepts from these requirements is coming in a later phase.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => goToStep(1)}>
            Review answers
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <WizardProgress currentStep={step} onStepClick={goToStep} />

      <Card>
        {step === 1 && <PlotStep state={state} errors={errors} onChange={onChange} />}
        {step === 2 && <FamilyStep state={state} errors={errors} onChange={onChange} />}
        {step === 3 && <RoomsStep state={state} errors={errors} onChange={onChange} />}
        {step === 4 && <BudgetStep state={state} errors={errors} onChange={onChange} />}
        {step === 5 && <StyleStep state={state} errors={errors} onChange={onChange} />}
        {step === 6 && <PreferencesStep state={state} errors={errors} onChange={onChange} />}
        {step === 7 && <AdditionalStep state={state} errors={errors} onChange={onChange} />}

        {saveError && <p className="mt-4 text-sm text-red-600">{saveError}</p>}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1 || saving}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={saving}>
            {saving ? "Saving…" : step === 7 ? "Finish" : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
