import { useState } from 'react';
import Step1Setup from '@/lib/components/admission/Step1Setup';
import Step2StudentInfo from '@/lib/components/admission/Step2StudentInfo';
import Step3FeesCheckout from '@/lib/components/admission/Step3FeesCheckout';
import Step4Review from '@/lib/components/admission/Step4Review';
import ProgressBar from '@/lib/components/admission/ProgressBar';
import BottomNavigation from '@/lib/components/admission/BottomNavigation';
import { admitStudent } from '@/lib/api/students';

export type PaymentRow = {
  feeType: string;
  amountPaid: number;
  monthsToPay?: number;
  [key: string]: unknown;
};

export type WizardState = {
  activeStep: 1 | 2 | 3 | 4;
  setupData: {
    academicYearId: number | null;
    classLevelId: number | null;
    classSectionId: number | null;
    academicYearName?: string;
    classLevelName?: string;
    classSectionName?: string;
  };
  studentInfo: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    rollNumber: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    guardianName: string;
    guardianPhone: string;
  };
  initialPayments: PaymentRow[];
};

export type SuccessState = {
  rollNumber: string;
  feeLedgerRowsGenerated: number;
};

const INITIAL_STATE: WizardState = {
  activeStep: 1,
  setupData: { 
    academicYearId: null,
    classLevelId: null,
    classSectionId: null,
  },
  studentInfo: {
    firstName: '', lastName: '', email: '', password: '',
    rollNumber: '', phone: '', dateOfBirth: '',
    address: '', guardianName: '', guardianPhone: '',
  },
  initialPayments: [],
};

export default function AdmissionWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessState | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────
  const isStep1Valid = () =>
    state.setupData.academicYearId !== null &&
    state.setupData.classLevelId !== null &&
    state.setupData.classSectionId !== null;

  const isStep2Valid = () =>
    state.studentInfo.firstName.trim() !== '' &&
    state.studentInfo.lastName.trim() !== '' &&
    state.studentInfo.email.trim() !== '' &&
    state.studentInfo.password.trim() !== '';

  const isStep3Valid = () => state.initialPayments.length > 0;

  const isCurrentStepValid = () => {
    switch (state.activeStep) {
      case 1: return isStep1Valid();
      case 2: return isStep2Valid();
      case 3: return isStep3Valid();
      case 4: return true;
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (state.activeStep === 4) {
      await handleSubmit();
    } else {
      setState((prev) => ({ ...prev, activeStep: (prev.activeStep + 1) as 1 | 2 | 3 | 4 }));
    }
  };

  const handleBack = () => {
    if (state.activeStep > 1) {
      setState((prev) => ({ ...prev, activeStep: (prev.activeStep - 1) as 1 | 2 | 3 | 4 }));
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const paymentsPayload = state.initialPayments.map((p) => ({
        feeType: p.feeType,
        amountPaid: p.amountPaid,
        ...(p.monthsToPay !== undefined ? { monthsToPay: p.monthsToPay } : {}),
      }));

      const result = await admitStudent({
        email: state.studentInfo.email,
        password: state.studentInfo.password,
        firstName: state.studentInfo.firstName,
        lastName: state.studentInfo.lastName,
        rollNumber: state.studentInfo.rollNumber,
        phone: state.studentInfo.phone || undefined,
        dateOfBirth: state.studentInfo.dateOfBirth || undefined,
        address: state.studentInfo.address || undefined,
        guardianName: state.studentInfo.guardianName || undefined,
        guardianPhone: state.studentInfo.guardianPhone || undefined,
        classSectionId: String(state.setupData.classSectionId!),
        // @ts-expect-error - extended payload fields
        academicYearId: state.setupData.academicYearId,
        classLevelId: state.setupData.classLevelId,
        initialPayments: paymentsPayload,
      });

      setSuccessData({
        rollNumber: (result as any)?.rollNumber ?? state.studentInfo.rollNumber,
        feeLedgerRowsGenerated: (result as any)?.feeLedgerRowsGenerated ?? 0,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[80vh]">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center max-w-md w-full shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Admitted Successfully!</h2>
          <p className="text-slate-500 mb-8 text-sm">The student has been registered in the system.</p>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-8 space-y-4 text-left">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Roll Number</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{successData.rollNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Fee Ledger Rows Created</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{successData.feeLedgerRowsGenerated}</p>
            </div>
          </div>

          <button
            onClick={() => { setSuccessData(null); setState(INITIAL_STATE); }}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold transition-all text-sm shadow-md hover:shadow-lg"
          >
            Start New Admission
          </button>
        </div>
      </div>
    );
  }

  // ── Main Wizard ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        {/* Header & Progress */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-6 sm:px-8 sm:py-8">
          <h1 className="text-2xl font-bold text-slate-900">Admit Student</h1>
          <p className="text-slate-500 mt-1 text-sm">Create a student account and enrol them in a class.</p>
          
          <div className="mt-8">
            <ProgressBar activeStep={state.activeStep} />
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-8 sm:px-8 sm:py-10 min-h-[400px]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {state.activeStep === 1 && <Step1Setup state={state} setState={setState} />}
          {state.activeStep === 2 && <Step2StudentInfo state={state} setState={setState} />}
          {state.activeStep === 3 && <Step3FeesCheckout state={state} setState={setState} />}
          {state.activeStep === 4 && <Step4Review state={state} />}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 sm:px-8">
          <BottomNavigation
            activeStep={state.activeStep}
            onBack={handleBack}
            onNext={handleNext}
            isNextDisabled={!isCurrentStepValid()}
            isLoading={isLoading}
            isLastStep={state.activeStep === 4}
          />
        </div>
      </div>
    </div>
  );
}