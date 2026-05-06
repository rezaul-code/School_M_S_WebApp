import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { WizardState, PaymentRow } from '@/pages/AdmissionWizard';
import { listFeeStructures } from '@/lib/api/feeStructures';

interface Step3FeesCheckoutProps {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
}

// Badge color by fee type
const feeTypeBadge: Record<string, string> = {
  ADMISSION: 'bg-green-900/60 text-green-300 border border-green-700',
  TUITION: 'bg-blue-900/60 text-blue-300 border border-blue-700',
  SPORTS: 'bg-orange-900/60 text-orange-300 border border-orange-700',
  TRANSPORT: 'bg-purple-900/60 text-purple-300 border border-purple-700',
  OTHER: 'bg-gray-800 text-gray-300 border border-gray-600',
};

function fmtINR(val: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(val);
}

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function Step3FeesCheckout({ state, setState }: Step3FeesCheckoutProps) {
  // Try to load fee structures for the class section
  const feeQ = useQuery({
    queryKey: ['fee-structures', state.setupData.classSectionId],
    queryFn: () => listFeeStructures({ classSectionId: String(state.setupData.classSectionId) }),
    enabled: !!state.setupData.classSectionId,
  });

  // Seed payments from fee structures once loaded
  useEffect(() => {
    if (!feeQ.data || state.initialPayments.length > 0) return;

    const rows: PaymentRow[] = feeQ.data.map((f: any) => ({
      feeType: f.feeType ?? f.name ?? 'OTHER',
      amountPaid: f.amount ?? 0,
      monthsToPay: f.feeType === 'TUITION' ? 3 : undefined,
      unitAmount: f.feeType === 'TUITION' ? f.amount : undefined,
      totalObligation: f.totalObligation ?? f.amount ?? 0,
      label: f.name ?? f.feeType,
      calculation: f.calculation ?? '',
    }));

    setState((prev) => ({ ...prev, initialPayments: rows }));
  }, [feeQ.data]);

  // Fallback mock data if API has nothing or still loading
  useEffect(() => {
    if (state.initialPayments.length > 0) return;
    if (feeQ.isLoading) return;

    // Use mock data as fallback
    const mockRows: PaymentRow[] = [
      {
        feeType: 'ADMISSION',
        amountPaid: 4500,
        totalObligation: 4500,
        label: 'Admission fee',
        calculation: 'Grade 4 admission fee',
      } as any,
      {
        feeType: 'TUITION',
        amountPaid: 4500,
        monthsToPay: 3,
        unitAmount: 1500,
        totalObligation: 4500,
        label: 'Tuition',
        calculation: '',
      } as any,
      {
        feeType: 'SPORTS',
        amountPaid: 2500,
        totalObligation: 2500,
        label: 'Sports fee',
        calculation: 'Annual sports & extracurriculars',
      } as any,
    ];

    setState((prev) => ({ ...prev, initialPayments: mockRows }));
  }, [feeQ.isLoading, state.initialPayments.length]);

  const payments = state.initialPayments as any[];

  const grandTotalObligation = payments.reduce((s, p) => s + (p.totalObligation ?? 0), 0);
  const grandTotalPaying = payments.reduce((s, p) => s + (p.amountPaid ?? 0), 0);
  const grandBalance = grandTotalObligation - grandTotalPaying;

  // Get class section label
  const sectionLabel = (() => {
    const parts: string[] = [];
    if ((state.setupData as any).classSectionName) return (state.setupData as any).classSectionName;
    return `Class section ${state.setupData.classSectionId}`;
  })();

  const yearLabel = (state.setupData as any).academicYearName ?? String(state.setupData.academicYearId ?? '');

  return (
    <div className="space-y-5">
      <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
        Fee Preview — {sectionLabel} · {yearLabel}
      </h2>

      <div className="rounded-xl border border-gray-700 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr] gap-0 bg-gray-800/80 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <div>Fee type</div>
          <div>Calculation</div>
          <div className="text-right">Total obligation</div>
          <div className="text-right">Paying now</div>
          <div className="text-right">Balance</div>
        </div>

        {/* Rows */}
        {payments.map((payment, idx) => {
          const isTuition = payment.feeType === 'TUITION';
          const badgeClass = feeTypeBadge[payment.feeType] ?? feeTypeBadge.OTHER;
          const balance = (payment.totalObligation ?? 0) - (payment.amountPaid ?? 0);

          return (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr] gap-0 px-5 py-4 border-t border-gray-700/60 items-center"
            >
              {/* Fee type badge */}
              <div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeClass}`}>
                  {payment.feeType.charAt(0) + payment.feeType.slice(1).toLowerCase()}
                </span>
              </div>

              {/* Calculation */}
              <div className="text-sm text-gray-300 pr-4">
                {isTuition ? (
                  <div className="space-y-1">
                    <select
                      value={payment.monthsToPay ?? 1}
                      onChange={(e) => {
                        const months = Number(e.target.value);
                        const unit = payment.unitAmount ?? (payment.amountPaid / (payment.monthsToPay ?? 1));
                        setState((prev) => {
                          const updated = [...prev.initialPayments] as any[];
                          updated[idx] = {
                            ...updated[idx],
                            monthsToPay: months,
                            amountPaid: Math.round(unit * months),
                            unitAmount: unit,
                          };
                          return { ...prev, initialPayments: updated };
                        });
                      }}
                      className="bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-1.5 text-sm
                        focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
                    >
                      {MONTH_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m} {m === 1 ? 'month' : 'months'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      × {fmtINR(payment.unitAmount ?? payment.amountPaid / (payment.monthsToPay ?? 1))}
                    </p>
                  </div>
                ) : (
                  payment.calculation || '—'
                )}
              </div>

              {/* Total obligation */}
              <div className="text-sm text-gray-200 text-right">
                {fmtINR(payment.totalObligation ?? 0)}
              </div>

              {/* Paying now - editable */}
              <div className="text-right">
                <input
                  type="number"
                  min={0}
                  max={payment.totalObligation ?? undefined}
                  value={payment.amountPaid}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setState((prev) => {
                      const updated = [...prev.initialPayments] as any[];
                      updated[idx] = { ...updated[idx], amountPaid: val };
                      return { ...prev, initialPayments: updated };
                    });
                  }}
                  className="w-28 bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-1.5 text-sm
                    text-right focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Balance */}
              <div className={`text-sm text-right font-medium ${balance > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {fmtINR(balance)}
              </div>
            </div>
          );
        })}

        {/* Grand total row */}
        <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr] gap-0 px-5 py-4 border-t border-gray-600 bg-gray-800/50 items-center">
          <div className="col-span-2 text-sm font-bold text-gray-100">Grand total</div>
          <div className="text-sm font-bold text-gray-100 text-right">{fmtINR(grandTotalObligation)}</div>
          <div className="text-sm font-bold text-violet-300 text-right">{fmtINR(grandTotalPaying)}</div>
          <div className={`text-sm font-bold text-right ${grandBalance > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
            {fmtINR(grandBalance)}
          </div>
        </div>
      </div>
    </div>
  );
}