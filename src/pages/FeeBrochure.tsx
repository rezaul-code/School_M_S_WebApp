// src/pages/FeeBrochure.tsx

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, GraduationCap, FileText, Loader2, AlertCircle, IndianRupee } from "lucide-react";

import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { getFilteredFeeStructures } from "@/lib/api/feeStructures";
import { getClassLevelOptions } from "@/lib/api/master"; 
import { Button } from "@/components/ui/button";

// Helper for Indian Rupee formatting
const INR = (amount: number | string) => 
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(amount));

export default function FeeBrochurePage() {
  const { data: activeYear } = useActiveAcademicYear();
  const academicYearId = activeYear?.id;
  const academicYearName = activeYear?.name || "Current Year";

  const [selectedClassId, setSelectedClassId] = useState<number | "">("");

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["options", "class-levels"],
    queryFn: getClassLevelOptions,
    staleTime: 10 * 60 * 1000,
  });

  const { data: fees = [], isLoading: feesLoading } = useQuery({
    queryKey: ["brochure-fees", selectedClassId, academicYearId],
    queryFn: () => getFilteredFeeStructures({ 
      classLevelId: Number(selectedClassId), 
      academicYearId: Number(academicYearId) 
    }),
    enabled: Boolean(selectedClassId && academicYearId),
  });

  const categorizedFees = useMemo(() => {
    const oneTime = fees.filter(f => f.frequency === "ONE_TIME");
    const monthly = fees.filter(f => f.frequency === "MONTHLY");
    const yearly  = fees.filter(f => f.frequency === "YEARLY");

    const totalOneTime = oneTime.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalMonthly = monthly.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalYearly  = yearly.reduce((sum, f) => sum + Number(f.amount), 0);

    const totalAnnualEstimated = totalOneTime + totalYearly + (totalMonthly * 12);

    return { oneTime, monthly, yearly, totalOneTime, totalMonthly, totalYearly, totalAnnualEstimated };
  }, [fees]);

  const selectedClassName = classes.find((c: any) => c.id === Number(selectedClassId))?.displayName || "Selected Class";

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* 🔥 Print Styles 🔥 */}
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 20mm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            background: white !important; margin: 0; padding: 0;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        `}
      </style>

      {/* ─── Control Bar (Hidden on Print) ─── */}
      <div className="print:hidden bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" /> Fee Brochure
            </h1>
            <p className="text-sm text-slate-500 mt-1">Select a class to preview and print the fee structure.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select 
                className="h-10 pl-9 pr-8 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[200px]"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={classesLoading}
              >
                <option value="">{classesLoading ? "Loading Classes..." : "Select Class Level"}</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.displayName || cls.name || cls.label}
                  </option>
                ))}
              </select>
            </div>

            <Button 
              onClick={() => window.print()}
              disabled={!selectedClassId || fees.length === 0 || feesLoading}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 shadow-sm transition-all"
            >
              <Printer className="h-4 w-4" /> Print Handout
            </Button>
          </div>
        </div>
      </div>

      {/* ─── UI States (Hidden on Print) ─── */}
      {!selectedClassId && (
        <div className="print:hidden py-20 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-400">
          <FileText className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-lg font-medium text-slate-600">No Class Selected</p>
          <p className="text-sm">Please select a class from the dropdown above to view the fees.</p>
        </div>
      )}

      {selectedClassId && feesLoading && (
        <div className="print:hidden py-20 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
          <p className="text-sm font-medium">Loading fee structure...</p>
        </div>
      )}

      {selectedClassId && !feesLoading && fees.length === 0 && (
        <div className="print:hidden py-20 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-400">
          <AlertCircle className="h-10 w-10 text-amber-400 mb-4" />
          <p className="text-lg font-medium text-slate-600">No Fees Configured</p>
          <p className="text-sm">There are no fee structures set up for {selectedClassName} in {academicYearName}.</p>
        </div>
      )}

      {/* ─── SCREEN PREVIEW: Simple Listing Table (Hidden on Print) ─── */}
      {selectedClassId && !feesLoading && fees.length > 0 && (
        <div className="print:hidden bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Fee Listing for {selectedClassName}</h2>
            <span className="text-xs font-medium bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
              Session: {academicYearName}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500">
                  <th className="py-3 px-6 font-medium">Fee Type</th>
                  <th className="py-3 px-6 font-medium">Description</th>
                  <th className="py-3 px-6 font-medium">Frequency</th>
                  <th className="py-3 px-6 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((fee, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-medium text-slate-800">{fee.feeType.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-6 text-slate-500">{fee.description || "—"}</td>
                    <td className="py-3 px-6">
                      <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {fee.frequency.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-semibold text-slate-900">{INR(fee.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="py-4 px-6 text-right font-medium text-slate-600">
                    Estimated Total Academic Cost (Annual):
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-indigo-700 text-lg">
                    {INR(categorizedFees.totalAnnualEstimated)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}


      {/* ─── PRINT LAYOUT: Simpler Formal Format (Only visible on Print) ─── */}
      {selectedClassId && !feesLoading && fees.length > 0 && (
        <div id="print-area" className="hidden print:block font-sans text-slate-900">
          
          {/* Print Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 border-2 border-slate-800 rounded-full flex items-center justify-center text-2xl">
                🏫
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-widest">SARBAJANIN ACADEMY</h1>
                <p className="text-sm font-semibold tracking-wider text-slate-600 uppercase mt-0.5">Official Fee Structure</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-slate-500">Academic Session</p>
              <p className="text-lg font-bold">{academicYearName}</p>
              <p className="text-xs font-bold uppercase text-slate-500 mt-2">Class</p>
              <p className="text-lg font-bold">{selectedClassName.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <p className="text-sm text-slate-700 mb-6 italic">
            Below is the approved fee schedule for the current academic session. Please take note of the payment frequencies.
          </p>

          {/* Minimalist Tables */}
          <div className="space-y-8">
            
            {categorizedFees.oneTime.length > 0 && (
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2 border-l-4 border-slate-800 pl-2">1. One-Time / Admission Fees</h3>
                <table className="w-full text-sm border-collapse border border-slate-300">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 py-2 px-3 text-left">Particulars</th>
                      <th className="border border-slate-300 py-2 px-3 text-right w-32">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorizedFees.oneTime.map((fee, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 py-2 px-3">
                          <span className="font-medium">{fee.feeType.replace(/_/g, ' ')}</span>
                          {fee.description && <span className="text-slate-500 text-xs ml-2">({fee.description})</span>}
                        </td>
                        <td className="border border-slate-300 py-2 px-3 text-right font-medium">{INR(fee.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 py-2 px-3 font-bold text-right uppercase text-xs">Total One-Time:</td>
                      <td className="border border-slate-300 py-2 px-3 text-right font-bold">{INR(categorizedFees.totalOneTime)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {categorizedFees.monthly.length > 0 && (
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2 border-l-4 border-slate-800 pl-2">2. Monthly Recurring Fees</h3>
                <table className="w-full text-sm border-collapse border border-slate-300">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 py-2 px-3 text-left">Particulars</th>
                      <th className="border border-slate-300 py-2 px-3 text-right w-32">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorizedFees.monthly.map((fee, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 py-2 px-3">
                          <span className="font-medium">{fee.feeType.replace(/_/g, ' ')}</span>
                          {fee.description && <span className="text-slate-500 text-xs ml-2">({fee.description})</span>}
                        </td>
                        <td className="border border-slate-300 py-2 px-3 text-right font-medium">{INR(fee.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 py-2 px-3 font-bold text-right uppercase text-xs">Total Monthly:</td>
                      <td className="border border-slate-300 py-2 px-3 text-right font-bold">{INR(categorizedFees.totalMonthly)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {categorizedFees.yearly.length > 0 && (
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2 border-l-4 border-slate-800 pl-2">3. Annual Fees</h3>
                <table className="w-full text-sm border-collapse border border-slate-300">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 py-2 px-3 text-left">Particulars</th>
                      <th className="border border-slate-300 py-2 px-3 text-right w-32">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorizedFees.yearly.map((fee, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 py-2 px-3">
                          <span className="font-medium">{fee.feeType.replace(/_/g, ' ')}</span>
                          {fee.description && <span className="text-slate-500 text-xs ml-2">({fee.description})</span>}
                        </td>
                        <td className="border border-slate-300 py-2 px-3 text-right font-medium">{INR(fee.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 py-2 px-3 font-bold text-right uppercase text-xs">Total Annual:</td>
                      <td className="border border-slate-300 py-2 px-3 text-right font-bold">{INR(categorizedFees.totalYearly)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="mt-8 border-2 border-slate-800 p-4 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-sm">Estimated Total Academic Cost</h3>
              <p className="text-xs text-slate-500 mt-1">Sum of Admission, Annual, and 12 months of recurring fees.</p>
            </div>
            <div className="text-2xl font-black">
              {INR(categorizedFees.totalAnnualEstimated)}
            </div>
          </div>

          {/* Terms Footer */}
          <div className="mt-12 pt-6 border-t border-slate-300 text-xs text-slate-600 space-y-1.5">
            <h4 className="font-bold uppercase tracking-wider mb-2 text-slate-900">General Guidelines</h4>
            <p>• Fees once paid are strictly non-refundable and non-transferable.</p>
            <p>• Monthly installments must be cleared by the 10th of every month. Late payments may attract a penalty.</p>
            <p>• The school management reserves the right to revise the fee structure with prior notice.</p>
          </div>

          {/* Signatures */}
          <div className="mt-20 flex justify-between">
            <div className="text-center w-48 border-t border-slate-400 pt-2 text-xs font-bold uppercase">
              Parent / Guardian Signature
            </div>
            <div className="text-center w-48 border-t border-slate-400 pt-2 text-xs font-bold uppercase">
              Authorized Signatory
            </div>
          </div>

        </div>
      )}
    </div>
  );
}