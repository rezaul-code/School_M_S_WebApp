import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { getReportCard } from '@/lib/api/results';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';

interface ReportCardViewProps {
  enrollmentId: number;
  onClose: () => void;
}

export default function ReportCardView({ enrollmentId, onClose }: ReportCardViewProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const { data: reportCard, isLoading, isError } = useQuery({
    queryKey: ['reportCard', enrollmentId],
    queryFn: () => getReportCard(enrollmentId),
  });

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Report_Card_${reportCard?.studentFirstName}_${reportCard?.studentLastName}`,
  });

  // ── The modal content ──────────────────────────────────────────────────────
  let modalContent: React.ReactNode;

  if (isLoading) {
    modalContent = (
      <div className="flex flex-col items-center justify-center h-[500px] bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400 mb-3" />
        <p className="text-slate-400 text-xs tracking-[0.2em] uppercase">Generating Report Card…</p>
      </div>
    );
  } else if (isError || !reportCard) {
    modalContent = (
      <div className="flex flex-col items-center justify-center h-[500px] bg-white p-8 text-center">
        <p className="font-semibold text-sm mb-1">Error Loading Report Card</p>
        <p className="text-slate-400 text-xs mb-6">Could not fetch result details.</p>
        <Button onClick={onClose} variant="outline" className="rounded-none text-xs tracking-widest uppercase">
          Close
        </Button>
      </div>
    );
  } else {
    const examTypes: string[] = Array.from(
      new Set<string>(reportCard.examMarkSnapshots.map((s: any) => s.examTypeCode as string))
    );

    modalContent = (
      /* Modal shell */
      <div className="w-full max-w-[210mm] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-lg">

        {/* ── Action bar (always visible, hidden only on print) ── */}
        <div className="flex justify-between items-center bg-slate-800 px-5 py-3 print:hidden flex-shrink-0">
          <span className="text-[11px] tracking-[0.18em] uppercase text-slate-300 font-semibold">
            📄 Report Card Preview
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] tracking-[0.15em] uppercase px-4 py-2 rounded transition-colors"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold text-[11px] tracking-[0.15em] uppercase px-4 py-2 rounded transition-colors"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        </div>

        {/* ── Scroll area ── */}
        <div className="flex-1 overflow-y-auto bg-slate-100 flex justify-center py-6 px-4 print:p-0 print:bg-white print:block">

          {/* ━━━━━━━━  A4 PAGE  ━━━━━━━━ */}
          <div
            ref={componentRef}
            className="bg-white w-full max-w-[210mm] mx-auto flex flex-col print:shadow-none print:m-0"
            style={{ fontFamily: 'Georgia, serif', padding: '44px 52px' }}
          >

            {/* ══ 1. HEADER ══ */}
            <div className="flex items-start justify-between pb-4 mb-0 border-b border-black">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border border-slate-300 flex items-center justify-center text-3xl bg-slate-50 flex-shrink-0">
                  🏫
                </div>
                <div>
                  <p className="text-[20px] font-black text-black leading-tight" style={{ letterSpacing: '-0.01em' }}>
                    SARBAJANIN ACADEMY
                  </p>
                  <p className="text-[9px] font-sans text-slate-500 tracking-[0.32em] uppercase mt-[3px]">
                    R E P O R T &nbsp; C A R D
                  </p>
                </div>
              </div>
              <div className="text-right font-sans">
                <span className="inline-block border border-slate-400 text-[8px] font-bold tracking-[0.22em] uppercase text-slate-500 px-2 py-[2px]">
                  OFFICE COPY
                </span>
                <p className="text-[10px] font-bold text-black mt-1.5 tracking-wide">{reportCard.enrollmentNo}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {format(new Date(reportCard.calculatedAt), 'dd MMM yyyy').toUpperCase()}
                </p>
              </div>
            </div>

            {/* ══ 2. STUDENT INFO ══ */}
            <div className="border-b border-black py-3 mb-0 font-sans grid grid-cols-2 gap-y-1">
              <div className="space-y-1">
                <div className="flex gap-2 items-baseline">
                  <span className="text-[10px] text-slate-500 w-16 flex-shrink-0">Student:</span>
                  <span className="text-[11px] font-bold text-black">
                    {reportCard.studentFirstName} {reportCard.studentLastName}
                  </span>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-[10px] text-slate-500 w-16 flex-shrink-0">Adm No:</span>
                  <span className="text-[11px] font-semibold text-black">
                    {reportCard.studentRegistrationNo || 'N/A'}
                  </span>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-[10px] text-slate-500 w-16 flex-shrink-0">Class:</span>
                  <span className="text-[11px] font-semibold text-black">{reportCard.className}</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="flex justify-end gap-2 items-baseline">
                  <span className="text-[10px] text-slate-500">Session:</span>
                  <span className="text-[11px] font-semibold text-black">{reportCard.academicYearName}</span>
                </div>
                <div className="flex justify-end gap-2 items-baseline">
                  <span className="text-[10px] text-slate-500">Calculated:</span>
                  <span className="text-[11px] font-semibold text-black">
                    {format(new Date(reportCard.calculatedAt), 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* ══ 3. MARKS TABLE ══ */}
            <div className="mt-4 mb-4">
              <table className="w-full border-collapse font-sans" style={{ fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-left font-bold uppercase tracking-wider" style={{ fontSize: '9px' }}>
                      Subject
                    </th>
                    {examTypes.map((type: string) => (
                      <th key={type} className="border border-black px-2 py-2 text-center font-bold uppercase tracking-wide" style={{ fontSize: '9px' }}>
                        {type.replace(/_/g, ' ')}
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center font-bold uppercase tracking-wide" style={{ fontSize: '9px' }}>
                      Consol. %
                    </th>
                    <th className="border border-black px-3 py-2 text-center font-bold uppercase tracking-wide" style={{ fontSize: '9px' }}>
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportCard.subjectResults.map((subject: any) => {
                    const snaps = reportCard.examMarkSnapshots.filter(
                      (s: any) => s.subjectCode === subject.subjectCode
                    );
                    return (
                      <tr key={subject.id}>
                        <td className="border border-black px-3 py-2 font-semibold text-black">
                          {subject.subjectName}
                        </td>
                        {examTypes.map((type: string) => {
                          const snap = snaps.find((s: any) => s.examTypeCode === type);
                          return (
                            <td key={type} className="border border-black px-2 py-2 text-center text-black">
                              {snap
                                ? snap.isAbsent
                                  ? <span className="text-slate-500">AB</span>
                                  : snap.isExempted
                                    ? <span className="text-slate-500">EX</span>
                                    : <span className={snap.isPass ? '' : 'underline decoration-dotted font-semibold'}>
                                        {snap.marksObtained}
                                      </span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                          );
                        })}
                        <td className="border border-black px-3 py-2 text-center font-bold text-black">
                          {subject.percentage}%
                        </td>
                        <td className={`border border-black px-3 py-2 text-center font-bold ${subject.isPass ? 'text-black' : 'text-black underline'}`}>
                          {subject.grade || (subject.isPass ? 'P' : 'F')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="border-2 border-black px-3 py-2.5 font-black uppercase tracking-widest text-black" style={{ fontSize: '9px' }}>
                      Grand Total
                    </td>
                    {examTypes.map((type: string) => (
                      <td key={type} className="border-2 border-black px-2 py-2.5" />
                    ))}
                    <td className="border-2 border-black px-3 py-2.5 text-center">
                      <p style={{ fontSize: '8px' }} className="text-slate-500 uppercase tracking-wider mb-0.5">Overall</p>
                      <p className="text-[15px] font-black text-black leading-none">{reportCard.percentage}%</p>
                    </td>
                    <td className="border-2 border-black px-3 py-2.5 text-center">
                      <p className="text-[15px] font-black text-black leading-none">{reportCard.grade || '—'}</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${reportCard.resultStatus === 'PASS' ? 'text-black' : 'text-black'}`}>
                        {reportCard.resultStatus}
                      </p>
                      {reportCard.rankInClass && (
                        <p style={{ fontSize: '9px' }} className="text-slate-500 mt-0.5">
                          Rank #{reportCard.rankInClass}
                        </p>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ══ 4. NOTE ══ */}
            <div className="mt-2 mb-8 font-sans border-t border-slate-300 pt-3">
              <p className="font-bold uppercase tracking-[0.2em] text-slate-400 mb-1" style={{ fontSize: '8px' }}>
                Note
              </p>
              <p className="text-slate-500 leading-relaxed" style={{ fontSize: '9px' }}>
                {reportCard.resultRuleSnapshot
                  ? `Result calculated using: ${reportCard.resultRuleSnapshot}.`
                  : 'Result calculated per the configured academic rule.'}{' '}
                This is a system-generated document and is valid without a physical signature. For queries,
                contact the school office.
              </p>
            </div>

            {/* ══ 5. SIGNATURES ══ */}
            <div className="mt-6 pt-6 font-sans border-t border-slate-200">
              <div className="flex justify-between items-end">
                {['Class Teacher', 'Principal', 'Parent / Guardian', 'Authorised Signatory'].map((label) => (
                  <div key={label} className="text-center" style={{ width: '100px' }}>
                    <div className="border-b border-black mb-1.5" style={{ height: '36px' }} />
                    <p className="font-bold uppercase tracking-[0.14em] text-slate-600" style={{ fontSize: '8px' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ 6. FOOTER ══ */}
            <div className="mt-5 pt-2.5 border-t border-slate-200 font-sans text-center">
              <p className="text-slate-400 tracking-widest uppercase" style={{ fontSize: '8px' }}>
                Generated by HatSynk School Management System &bull; Authenticated Document
              </p>
            </div>

          </div>{/* end A4 page */}
        </div>{/* end scroll area */}
      </div>
    );
  }

  // ── KEY FIX: render via portal directly into document.body ────────────────
  // This escapes the `relative` stacking context on `.md-page` which was
  // clipping the fixed-position modal and hiding the Print / Close buttons
  // whenever a section filter was active.
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 sm:p-8 print:p-0 print:bg-white print:block"
      // Close on backdrop click
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {modalContent}
    </div>,
    document.body
  );
}