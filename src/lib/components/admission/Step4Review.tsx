import type { WizardState } from '@/pages/AdmissionWizard';

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

export default function Step4Review({ state }: Step4ReviewProps) {
  const payments = state.initialPayments as any[];
  const total = payments.reduce((s, p) => s + (p.amountPaid ?? 0), 0);

  const sectionName =
    (state.setupData as any).classSectionName ?? `Section ${state.setupData.classSectionId}`;
  const yearName =
    (state.setupData as any).academicYearName ?? String(state.setupData.academicYearId ?? '');
  const fullName = `${state.studentInfo.firstName} ${state.studentInfo.lastName}`.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
        Review & Confirm
      </h2>

      {/* Student + Class section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Student</p>
          <p className="text-base font-bold text-gray-100">{fullName || '—'}</p>
          <p className="text-sm text-gray-400">{state.studentInfo.email || '—'}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Class section</p>
          <p className="text-base font-bold text-gray-100">{sectionName}</p>
          <p className="text-sm text-gray-400">Academic year {yearName}</p>
        </div>
      </div>

      {/* Payment breakdown */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Payment Breakdown
          </p>
        </div>

        <div className="divide-y divide-gray-700/60">
          {payments.map((p, idx) => {
            const isTuition = p.feeType === 'TUITION';
            const label = p.label ?? p.feeType;
            const months = p.monthsToPay;

            return (
              <div key={idx} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-gray-300">
                  {label}
                  {isTuition && months ? ` (${months} month${months > 1 ? 's' : ''})` : ''}
                </span>
                <span className="text-sm font-medium text-gray-100">{fmtINR(p.amountPaid ?? 0)}</span>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-600 bg-gray-800/80">
          <span className="text-sm font-bold text-gray-100">Total paying now</span>
          <span className="text-base font-bold text-violet-300">{fmtINR(total)}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 leading-relaxed">
        Clicking "Confirm &amp; admit" will create the student account, generate the fee ledger, and
        record the initial payment.
      </p>
    </div>
  );
}