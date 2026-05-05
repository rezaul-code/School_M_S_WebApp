import { Loader2 } from 'lucide-react';

interface BottomNavigationProps {
  activeStep: 1 | 2 | 3 | 4;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
  isLoading: boolean;
  isLastStep: boolean;
}

export default function BottomNavigation({
  activeStep,
  onBack,
  onNext,
  isNextDisabled,
  isLoading,
  isLastStep,
}: BottomNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={activeStep === 1}
        className="px-5 py-2 rounded-lg border border-gray-600 text-sm font-medium text-gray-300
          hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Back
      </button>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Step {activeStep} of 4</span>
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
          className="px-6 py-2 rounded-lg bg-gray-100 text-gray-900 text-sm font-semibold
            hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-2 min-w-[110px] justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Admitting...
            </>
          ) : isLastStep ? (
            'Confirm & admit'
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  );
}