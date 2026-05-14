import { useState } from 'react';
import Step1Setup from '@/lib/components/admission/Step1Setup';
import Step2StudentInfo from '@/lib/components/admission/Step2StudentInfo';
import Step3FeesCheckout from '@/lib/components/admission/Step3FeesCheckout';
import Step4Review from '@/lib/components/admission/Step4Review';
import ProgressBar from '@/lib/components/admission/ProgressBar';
import BottomNavigation from '@/lib/components/admission/BottomNavigation';
import { admitStudent } from '@/lib/api/students';
import { Printer, Scissors, CheckCircle2, ArrowLeft, UserPlus } from 'lucide-react';

import "@/styles/student-pages.css";

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

// --- Receipt Formatting Helpers ---
function fmtINR(val: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

const today = new Date().toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}).toUpperCase();

// --- Receipt Copy Component ---
function ReceiptCopy({ copyType, state, successData }: { copyType: string, state: WizardState, successData: SuccessState }) {
  const fullName = `${state.studentInfo.firstName} ${state.studentInfo.lastName}`.trim().toUpperCase();
  const sectionName = (state.setupData as any).classSectionName ?? `${state.setupData.classSectionName}`;
  
  let grandTotalReq = 0;
  let grandTotalPaid = 0;
  let grandTotalBal = 0;

  return (
    <div className="relative bg-white pt-2 pb-4 px-4 print:px-0 print:pb-0">
      {/* Top right tag */}
      <div className="absolute top-0 right-4 print:right-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded-sm">
        {copyType}
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-4">
        <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center font-bold text-xl text-slate-400 shrink-0">
          🏫
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">SARBAJANIN ACADEMY</h3>
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5">Fee Payment Receipt</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Receipt No.</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">RCPT-ADM-{successData.rollNumber}</div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-8 text-xs mb-6">
        <div className="grid grid-cols-[70px_1fr] gap-y-1.5 gap-x-2">
           <span className="text-slate-500">Student:</span><span className="font-bold text-slate-900">{fullName}</span>
           <span className="text-slate-500">Adm No:</span><span className="font-bold text-slate-900">{successData.rollNumber}</span>
           <span className="text-slate-500">Class:</span><span className="font-bold text-slate-900">{sectionName}</span>
        </div>
        <div className="grid grid-cols-[70px_1fr] gap-y-1.5 gap-x-2">
           <span className="text-slate-500">Date:</span><span className="font-bold text-slate-900">{today}</span>
           <span className="text-slate-500">Method:</span><span className="font-bold text-slate-900">SYSTEM / ADMISSION</span>
        </div>
      </div>

      {/* Fee Table */}
      <table className="w-full text-xs mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-800 text-slate-600 text-[10px] uppercase tracking-wider">
            <th className="py-2 px-2 text-left font-bold">Particulars</th>
            <th className="py-2 px-2 text-right font-bold">Required (₹)</th>
            <th className="py-2 px-2 text-right font-bold text-emerald-600">Paid Now (₹)</th>
            <th className="py-2 px-2 text-right font-bold text-red-600">Balance (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {state.initialPayments.map((p, i) => {
            const required = (p.totalObligation as number) ?? p.amountPaid;
            const paid = p.amountPaid;
            const balance = required - paid;

            grandTotalReq += required;
            grandTotalPaid += paid;
            grandTotalBal += balance;

            const label = (p.label as string) ?? p.feeType;

            return (
              <tr key={i}>
                <td className="py-2.5 px-2 font-medium text-slate-800">
                  {label} {p.monthsToPay ? <span className="text-slate-400 text-[10px] font-normal">({p.monthsToPay} mos)</span> : ''}
                </td>
                <td className="py-2.5 px-2 text-right font-medium text-slate-600">{fmtINR(required)}</td>
                <td className="py-2.5 px-2 text-right font-bold text-emerald-600">{fmtINR(paid)}</td>
                <td className="py-2.5 px-2 text-right font-medium text-red-600">{fmtINR(balance)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-800 bg-slate-50/50 print:bg-transparent">
            <td className="py-2.5 px-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-800">Grand Total</td>
            <td className="py-2.5 px-2 text-right font-bold text-slate-800">{fmtINR(grandTotalReq)}</td>
            <td className="py-2.5 px-2 text-right font-bold text-emerald-600">{fmtINR(grandTotalPaid)}</td>
            <td className="py-2.5 px-2 text-right font-bold text-red-600">{fmtINR(grandTotalBal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Signature */}
      <div className="flex justify-end mt-8 pb-2">
        <div className="text-center w-40">
          <div className="border-b border-slate-400 mb-2 h-6"></div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}

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

  const handlePrint = () => {
    window.print();
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

  // ── Success / Receipt Screen ─────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="max-w-4xl mx-auto pb-12 pt-6">
        
        {/* 🔥 THE MAGIC FIX: Aggressive Print Isolation 🔥 */}
        <style type="text/css" media="print">
          {`
            /* 1. Hide the entire application (sidebar, navbar, backgrounds) */
            body * {
              visibility: hidden;
            }
            
            /* 2. Strip browser headers/footers (Date, URL) and force A4 sizing */
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            /* 3. Extract ONLY the receipt container, make it visible, and pin it top-left */
            #print-receipt-area, #print-receipt-area * {
              visibility: visible;
            }
            #print-receipt-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100vh;
              padding: 15mm; /* Physical paper margins */
              background: white !important;
              margin: 0;
            }
            
            /* 4. Force Tailwind colors to print properly */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          `}
        </style>

        {/* Success Banner (Hidden on print) */}
        <div className="print:hidden flex flex-col sm:flex-row items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-emerald-900">Admission Successful!</h2>
              <p className="text-sm text-emerald-700">Student account created and initial fees recorded.</p>
            </div>
          </div>
          <button
            onClick={() => { setSuccessData(null); setState(INITIAL_STATE); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 font-semibold rounded-lg text-sm hover:bg-emerald-100 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" /> Start New Admission
          </button>
        </div>

        {/* The Receipt Document Container */}
        <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-md print:shadow-none print:border-none print:rounded-none print:overflow-visible">
          
          {/* Action Bar (Hidden on print) */}
          <div className="print:hidden bg-emerald-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-white gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Printer className="w-5 h-5 text-emerald-50" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide">Paper Saver Mode Active</h4>
                <p className="text-emerald-200 text-xs">Printing Office + Parent copies on one sheet.</p>
              </div>
            </div>
            <button 
              onClick={handlePrint}
              className="w-full sm:w-auto bg-emerald-50 text-emerald-800 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-white transition-colors"
            >
              Print Receipts
            </button>
          </div>

          <div id="print-receipt-area" className="p-8 print:p-0">
             <ReceiptCopy copyType="OFFICE COPY" state={state} successData={successData} />

             {/* Dashed Separator */}
             <div className="flex items-center my-4 text-slate-300 print:my-6">
                <div className="flex-1 border-t-2 border-dashed border-slate-300"></div>
                <div className="mx-4 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  <Scissors className="w-4 h-4 -rotate-90" /> Detach Here
                </div>
                <div className="flex-1 border-t-2 border-dashed border-slate-300"></div>
             </div>

             <ReceiptCopy copyType="PARENT COPY" state={state} successData={successData} />
          </div>

        </div>
      </div>
    );
  }

  // ── Main Wizard ──────────────────────────────────────────────────────────────
  return (
    <div className="sl-page space-y-6 max-w-4xl mx-auto pb-12">
      {/* ── Page header banner added to match ID cards style ── */}
      <div className="sl-header">
        <div className="sl-header-left">
          <div className="sl-header-icon">
            <UserPlus />
          </div>
          <div>
            <h1 className="sl-header-title">Admit Student</h1>
            <p className="sl-header-sub">
              Create a student account and enrol them in a class.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        {/* Header & Progress */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-6 sm:px-8 sm:py-8">
          <div className="mt-2">
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