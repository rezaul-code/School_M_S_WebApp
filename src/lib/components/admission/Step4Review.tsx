import type { WizardState } from '@/components/students/AdmissionWizard';

interface Step4ReviewProps {
  state: WizardState;
}

function fmtINR(val: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(val);
}

// Simple helper to make enums readable
function formatEnum(val: string) {
  if (!val) return '';
  return val.replace(/_/g, ' ').replace('POSITIVE', '+').replace('NEGATIVE', '-');
}

export default function Step4Review({ state }: Step4ReviewProps) {
  const payments = state.initialPayments as any[];
  const total = payments.reduce((s, p) => s + (p.amountPaid ?? 0), 0);

  const sectionName =
    (state.setupData as any).classSectionName ?? `Section ${state.setupData.classSectionId}`;
  const yearName =
    (state.setupData as any).academicYearName ?? String(state.setupData.academicYearId ?? '');
  const fullName = `${state.studentInfo.firstName} ${state.studentInfo.lastName}`.trim();

  return (
    <div className="space-y-8">
      
      <div className="space-y-1 border-b border-gray-200 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Review & Confirm</h2>
        <p className="text-sm text-gray-500">Please verify all information before finalizing the admission.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* STUDENT PROFILE CARD WITH NEW FIELDS */}
        <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Student Profile</p>
          <p className="text-base font-bold text-gray-900 pt-1">{fullName || '—'}</p>
          <p className="text-sm text-gray-600">
            {state.studentInfo.email || '—'}
            {state.studentInfo.gender && ` • ${formatEnum(state.studentInfo.gender)}`}
            {state.studentInfo.bloodGroup && ` • ${formatEnum(state.studentInfo.bloodGroup)}`}
          </p>
        </div>

        <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-1 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Class Assignment</p>
          <p className="text-base font-bold text-gray-900 pt-1">{sectionName}</p>
          <p className="text-sm text-gray-600">Academic year {yearName}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-slate-50">
          <p className="text-xs font-semibold tracking-wider text-gray-600 uppercase">Payment Breakdown</p>
        </div>

        <div className="divide-y divide-gray-100">
          {payments.map((p, idx) => {
            const isTuition = p.feeType === 'TUITION';
            const label = p.label ?? p.feeType;
            const months = p.monthsToPay;

            return (
              <div key={idx} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-gray-700 font-medium">
                  {label}
                  {isTuition && months ? <span className="text-gray-500 font-normal ml-1">({months} months)</span> : ''}
                </span>
                <span className="text-sm font-bold text-gray-900">{fmtINR(p.amountPaid ?? 0)}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-5 py-5 border-t border-gray-200 bg-violet-50/50">
          <span className="text-sm font-bold text-gray-900">Total paying now</span>
          <span className="text-lg font-bold text-violet-700">{fmtINR(total)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed text-center">
        Clicking <span className="font-semibold text-gray-700">"Confirm & admit"</span> will immediately create the student account, generate the entire fee ledger, and record this initial payment.
      </p>
    </div>
  );
}