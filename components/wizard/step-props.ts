import type { WizardState } from "@/lib/domain/wizard";

export interface StepProps {
  state: WizardState;
  errors: Record<string, string>;
  onChange: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}
