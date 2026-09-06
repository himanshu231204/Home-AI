import { cn } from "@/lib/utils";

export const WIZARD_STEPS = [
  { id: 1, label: "Plot" },
  { id: 2, label: "Family" },
  { id: 3, label: "Rooms" },
  { id: 4, label: "Budget" },
  { id: 5, label: "Style" },
  { id: 6, label: "Preferences" },
  { id: 7, label: "Additional" },
] as const;

export function WizardProgress({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <ol className="mb-8 flex flex-wrap gap-2">
      {WIZARD_STEPS.map((step) => {
        const isCurrent = step.id === currentStep;
        const isDone = step.id < currentStep;
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isCurrent && "border-primary bg-primary text-primary-foreground",
                !isCurrent && isDone && "border-border bg-muted text-foreground",
                !isCurrent && !isDone && "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                  isCurrent && "bg-primary-foreground text-primary",
                  !isCurrent && "bg-transparent",
                )}
              >
                {step.id}
              </span>
              {step.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
