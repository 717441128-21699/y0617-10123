import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  key: string;
  label: string;
}

interface StatusStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function StatusStepper({
  steps,
  currentStep,
  className,
}: StatusStepperProps) {
  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all flex-shrink-0',
                  isCompleted &&
                    'bg-success-500 text-white shadow-sm',
                  isCurrent &&
                    'bg-primary-600 text-white ring-4 ring-primary-100 shadow-md',
                  isPending && 'bg-slate-100 text-slate-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center max-w-[100px] whitespace-nowrap',
                  isCompleted && 'text-success-700',
                  isCurrent && 'text-primary-700',
                  isPending && 'text-slate-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mb-6 rounded-full transition-colors',
                  isCompleted ? 'bg-success-300' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
