import { Button } from "@/components/ui/button";

export default function BottomNavigation({
  activeStep,
  isLastStep,
  isLoading,
  isNextDisabled,
  onBack,
  onNext,
}: {
  activeStep: number;
  isLastStep: boolean;
  isLoading?: boolean;
  isNextDisabled?: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="border-t bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={activeStep === 1 || isLoading}
        >
          Back
        </Button>

        <Button
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
        >
          {isLoading
            ? "Processing..."
            : isLastStep
            ? "Confirm Admission & Pay"
            : "Next"}
        </Button>
      </div>
    </div>
  );
}