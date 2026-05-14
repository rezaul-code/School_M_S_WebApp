import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { WizardState, PaymentRow } from '@/pages/AdmissionWizard';
import { getFeePreview } from '@/lib/api/feeStructures';
 
const feeTypeBadge: Record<string, string> = {
  ADMISSION: 'bg-green-50 text-green-700 border border-green-200',
  TUITION: 'bg-blue-50 text-blue-700 border border-blue-200',
  SPORTS: 'bg-orange-50 text-orange-700 border border-orange-200',
  TRANSPORT: 'bg-purple-50 text-purple-700 border border-purple-200',
  OTHER: 'bg-slate-100 text-slate-700 border border-slate-200',
};
 
function fmtINR(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val);
}
 
export default function Step3FeesCheckout({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  const feeQ = useQuery({
    queryKey: ['fee-preview', state.setupData.classSectionId, state.setupData.academicYearId],
    queryFn: () => getFeePreview({ classSectionId: String(state.setupData.classSectionId!), academicYearId: String(state.setupData.academicYearId!) }),
    enabled: !!(state.setupData.classSectionId && state.setupData.academicYearId),
  });
 
  useEffect(() => {
    if (!feeQ.data?.lineItems) return;
    const rows: PaymentRow[] = feeQ.data.lineItems.map((item: any) => {
      const isTuition = item.feeType === 'TUITION';
      const unitAmount = Number(item.unitAmount ?? 0);
      const totalAmount = Number(item.totalAmount ?? 0);
      return {
        feeType: item.feeType ?? 'OTHER',
        label: item.label ?? item.feeType,
        calculation: isTuition ? '' : item.label ?? '',
        unitAmount: isTuition ? unitAmount : undefined,
        monthsToPay: isTuition ? 3 : undefined,
        totalObligation: totalAmount,
        amountPaid: isTuition ? unitAmount * 3 : totalAmount,
      };
    });
    setState((prev) => ({ ...prev, initialPayments: rows }));
  }, [feeQ.data, state.setupData.classSectionId, state.setupData.academicYearId, setState]);
 
  const payments = state.initialPayments as any[];
  const grandTotalObligation = payments.reduce((s, p) => s + (p.totalObligation ?? 0), 0);
  const grandTotalPaying = payments.reduce((s, p) => s + (p.amountPaid ?? 0), 0);
  const grandBalance = grandTotalObligation - grandTotalPaying;
 
  if (feeQ.isLoading && payments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
        <div className="inline-block animate-spin w-6 h-6 border-[3px] border-slate-300 border-t-violet-600 rounded-full mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Calculating fee structures...</p>
      </div>
    );
  }
 
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Fees & Checkout</h2>
        <p className="text-sm text-slate-500">Review the fee ledger and collect the initial payment.</p>
      </div>
 
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr] gap-0 bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div>Fee type</div>
          <div>Calculation</div>
          <div className="text-right">Total obligation</div>
          <div className="text-right">Paying now</div>
          <div className="text-right">Balance</div>
        </div>
 
        <div className="divide-y divide-slate-100">
          {payments.map((payment, idx) => {
            const isTuition = payment.feeType === 'TUITION';
            const badgeClass = feeTypeBadge[payment.feeType] ?? feeTypeBadge.OTHER;
            const balance = (payment.totalObligation ?? 0) - (payment.amountPaid ?? 0);
  
            return (
              <div key={idx} className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr] gap-0 px-5 py-5 items-center hover:bg-slate-50/50 transition-colors">
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide ${badgeClass}`}>
                    {payment.feeType.charAt(0) + payment.feeType.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="text-sm text-slate-700 pr-4">
                  {isTuition ? (
                    <div className="space-y-0.5">
                       <div className="text-sm font-semibold text-slate-900">Base rate:</div>
                       <div className="text-xs text-slate-500">{fmtINR(payment.unitAmount ?? 0)} / month</div>
                    </div>
                  ) : (payment.calculation || '—')}
                </div>
                <div className="text-sm text-slate-900 text-right font-semibold">
                  {fmtINR(payment.totalObligation ?? 0)}
                </div>
                <div className="relative flex justify-end items-center">
                  <input
                    type="number"
                    min={0}
                    max={payment.totalObligation ?? undefined}
                    value={payment.amountPaid}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setState((prev) => {
                        const updated = [...prev.initialPayments] as any[];
                        const calcMonths = (isTuition && payment.unitAmount > 0) ? val / payment.unitAmount : undefined;
                        updated[idx] = { ...updated[idx], amountPaid: val, ...(calcMonths !== undefined ? { monthsToPay: calcMonths } : {}) };
                        return { ...prev, initialPayments: updated };
                      });
                    }}
                    className="w-32 bg-white border border-slate-300 text-slate-900 font-semibold rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-shadow"
                  />
                  {isTuition && payment.unitAmount > 0 && payment.amountPaid > 0 && (
                     <span className="absolute top-full right-1 mt-1.5 text-[11px] font-semibold tracking-wide text-slate-400 whitespace-nowrap">
                       ↳ Covers {(payment.amountPaid / payment.unitAmount).toFixed(1).replace(".0", "")} months
                     </span>
                  )}
                </div>
                <div className={`text-sm text-right font-bold ${balance > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                  {fmtINR(balance)}
                </div>
              </div>
            );
          })}
        </div>
 
        <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr] gap-0 px-5 py-4 border-t border-slate-200 bg-slate-50 items-center">
          <div className="col-span-2 text-sm font-bold text-slate-900">Grand total</div>
          <div className="text-sm font-bold text-slate-900 text-right">{fmtINR(grandTotalObligation)}</div>
          <div className="text-base font-bold text-violet-700 text-right">{fmtINR(grandTotalPaying)}</div>
          <div className={`text-sm font-bold text-right ${grandBalance > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{fmtINR(grandBalance)}</div>
        </div>
      </div>
    </div>
  );
}