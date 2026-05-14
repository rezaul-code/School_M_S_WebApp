import { Loader2 } from 'lucide-react';

interface BottomNavigationProps {
  activeStep: 1 | 2 | 3 | 4;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
  isLoading: boolean;
  isLastStep: boolean;
}

export default function BottomNavigation({ activeStep, onBack, onNext, isNextDisabled, isLoading, isLastStep }: BottomNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={activeStep === 1 || isLoading}
        className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm"
      >
        Back
      </button>

      <div className="flex items-center gap-5">
        <span className="text-sm font-medium text-slate-400 hidden sm:block">Step {activeStep} of 4</span>
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
          className="px-6 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 min-w-[120px] justify-center shadow-md hover:shadow-lg"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : isLastStep ? 'Confirm & Admit' : 'Continue'}
        </button>
      </div>
    </div>
  );
}