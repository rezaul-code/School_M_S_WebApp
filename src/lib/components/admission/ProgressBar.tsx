import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Setup' },
  { label: 'Student info' },
  { label: 'Fees & checkout' },
  { label: 'Review' },
] as const;

export default function ProgressBar({ activeStep }: { activeStep: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center w-full px-2">
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < activeStep;
        const isActive = stepNum === activeStep;

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300
                  ${isCompleted ? 'bg-violet-600 text-white shadow-md' : 
                    isActive ? 'bg-violet-600 text-white ring-4 ring-violet-100 shadow-md' : 
                    'bg-white border-2 border-slate-200 text-slate-400'}`}
              >
                {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : stepNum}
              </div>
              <span className={`text-sm font-semibold whitespace-nowrap hidden sm:block ${isActive ? 'text-violet-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="flex-1 mx-4 h-[2px] bg-slate-100 relative rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-violet-600 transition-all duration-500 ease-out" style={{ width: isCompleted ? '100%' : '0%' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}