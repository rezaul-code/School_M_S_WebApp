import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Setup' },
  { label: 'Student info' },
  { label: 'Fees & checkout' },
  { label: 'Review' },
] as const;

interface ProgressBarProps {
  activeStep: 1 | 2 | 3 | 4;
}

export default function ProgressBar({ activeStep }: ProgressBarProps) {
  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < activeStep;
        const isActive = stepNum === activeStep;

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-all
                  ${isCompleted
                    ? 'bg-violet-600 text-white'
                    : isActive
                    ? 'bg-violet-600 text-white ring-4 ring-violet-600/20'
                    : 'bg-transparent border border-gray-600 text-gray-400'
                  }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap
                  ${isActive ? 'text-violet-400' : isCompleted ? 'text-gray-300' : 'text-gray-500'}`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className="flex-1 mx-3 h-px bg-gray-700 relative">
                <div
                  className="absolute inset-0 bg-violet-600 transition-all duration-500"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}