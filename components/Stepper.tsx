
import React from 'react';
import { CheckCircleIcon } from './icons';

interface StepperProps {
  currentStep: number;
  steps: string[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStep -1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-indigo-600" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-indigo-600 rounded-full">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
                <span className="absolute top-10 -left-2 w-max text-xs text-slate-300">{step}</span>
              </>
            ) : stepIdx === currentStep - 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-slate-700" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-slate-800 rounded-full border-2 border-indigo-600">
                  <span className="h-2.5 w-2.5 bg-indigo-600 rounded-full" />
                </div>
                <span className="absolute top-10 -left-2 w-max text-xs text-indigo-400 font-semibold">{step}</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-slate-700" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-slate-800 border-2 border-slate-700 rounded-full">
                </div>
                 <span className="absolute top-10 -left-2 w-max text-xs text-slate-500">{step}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;
