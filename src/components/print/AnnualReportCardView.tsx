import React, { useRef } from 'react';
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-lg shadow-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Generating Report Card...</p>
      </div>
    );
  }

  if (isError || !reportCard) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-lg shadow-xl p-8 text-center">
        <p className="text-destructive font-semibold text-lg mb-2">Error Loading Report Card</p>
        <p className="text-muted-foreground mb-6">Could not fetch result details. Please ensure the calculation engine ran successfully.</p>
        <Button onClick={onClose} variant="outline">Close</Button>
      </div>
    );
  }

  // Group snapshots by exam type for the dynamic table headers
  const examTypes = Array.from(new Set(reportCard.examMarkSnapshots.map((s: any) => s.examTypeCode)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
      
      {/* Container holding the Print Controls and the A4 Page */}
      <div className="w-full max-w-[210mm] max-h-[90vh] flex flex-col bg-slate-100 rounded-xl shadow-2xl overflow-hidden relative">
        
        {/* Top Action Bar (Will not be printed) */}
        <div className="flex justify-between items-center bg-white border-b px-6 py-4 shadow-sm z-10 sticky top-0">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm">Preview Mode</span>
            Report Card
          </h2>
          <div className="flex gap-3">
            <Button onClick={handlePrint} className="gap-2 shadow-sm">
              <Printer className="h-4 w-4" /> Print A4
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable area for the UI Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-slate-100 flex justify-center">
          
          {/* THE PHYSICAL A4 PAGE */}
          <div 
            ref={componentRef} 
            /* Added flex, flex-col, and print-specific reset classes */
            className="bg-white shadow-md p-8 sm:p-12 w-full max-w-[210mm] min-h-[297mm] mx-auto flex flex-col print:shadow-none print:m-0 print:p-8 print:w-auto print:h-auto print:overflow-visible"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* 1. Header Section */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8 print:border-black">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary print:border-black print:text-black">
                  SISHU
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight print:text-black">SISHU ACADEMY</h1>
                  <p className="text-sm text-slate-500 font-medium tracking-wide uppercase mt-1 print:text-slate-700">Excellence in Education</p>
                  <p className="text-xs text-slate-400 mt-0.5 print:text-slate-600">Hyderabad, Telangana</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-slate-800 bg-slate-100 px-4 py-1.5 rounded inline-block print:border print:border-black print:bg-transparent">REPORT CARD</h2>
                <p className="text-sm font-semibold text-primary mt-2 print:text-black">Academic Session: {reportCard.academicYearName}</p>
                <p className="text-xs text-slate-500 mt-1 print:text-slate-700">Generated: {format(new Date(reportCard.calculatedAt), 'dd MMM yyyy')}</p>
              </div>
            </div>

            {/* 2. Student Details Grid */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200 print:bg-transparent print:border-black">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 print:text-slate-700">Student Name</p>
                <p className="text-lg font-bold text-slate-900 print:text-black">{reportCard.studentFirstName} {reportCard.studentLastName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 print:text-slate-700">Class Level</p>
                <p className="text-lg font-bold text-slate-900 print:text-black">{reportCard.className}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 print:text-slate-700">Registration Number</p>
                <p className="text-sm font-medium text-slate-700 print:text-black">{reportCard.studentRegistrationNo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 print:text-slate-700">Enrollment ID</p>
                <p className="text-sm font-medium text-slate-700 print:text-black">{reportCard.enrollmentNo}</p>
              </div>
            </div>

            {/* 3. Academic Performance Table */}
            {/* Removed overflow-hidden which causes print scrollbars */}
            <div className="mb-8 border border-slate-300 rounded-lg print:border-black print:rounded-none">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-800 text-white font-semibold uppercase text-xs tracking-wider print:bg-slate-200 print:text-black">
                  <tr>
                    <th className="px-4 py-3 border-b print:border-black">Subject</th>
                    {examTypes.map((type: string) => (
                      <th key={type} className="px-4 py-3 text-center border-b print:border-black">{type.replace('_', ' ')}</th>
                    ))}
                    <th className="px-4 py-3 text-center bg-slate-700 border-b print:bg-slate-300 print:border-black">Consolidated %</th>
                    <th className="px-4 py-3 text-center bg-slate-700 border-b print:bg-slate-300 print:border-black">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-black">
                  {reportCard.subjectResults.map((subject: any) => {
                    const snapshotsForSubject = reportCard.examMarkSnapshots.filter(
                      (snap: any) => snap.subjectCode === subject.subjectCode
                    );

                    return (
                      <tr key={subject.id} className="hover:bg-slate-50 print:bg-transparent">
                        <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-200 print:border-black print:text-black">
                          {subject.subjectName}
                        </td>
                        {examTypes.map((type: string) => {
                          const snap = snapshotsForSubject.find((s: any) => s.examTypeCode === type);
                          return (
                            <td key={type} className="px-4 py-3 text-center border-r border-slate-200 print:border-black">
                              {snap ? (
                                snap.isAbsent ? (
                                  <span className="text-amber-600 font-medium text-xs print:text-black">AB</span>
                                ) : snap.isExempted ? (
                                  <span className="text-blue-600 font-medium text-xs print:text-black">EX</span>
                                ) : (
                                  <span className={snap.isPass ? 'text-slate-700 print:text-black' : 'text-red-600 font-semibold print:text-black'}>
                                    {snap.marksObtained}
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-300 print:text-slate-500">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center font-bold bg-slate-50 border-r border-slate-200 print:bg-transparent print:border-black print:text-black">
                          {subject.percentage}%
                        </td>
                        <td className={`px-4 py-3 text-center font-bold bg-slate-50 print:bg-transparent print:text-black ${subject.isPass ? 'text-green-600' : 'text-red-600'}`}>
                          {subject.grade || (subject.isPass ? 'PASS' : 'FAIL')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Final Result Summary Box */}
            <div className="flex gap-6 mb-8">
              <div className="flex-1 bg-slate-50 border-l-4 border-primary p-5 rounded-r-lg print:bg-transparent print:border-black print:border-l-4 print:border-t print:border-r print:border-b">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 print:text-black">Final Evaluation</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold text-slate-900 print:text-black">{reportCard.percentage}%</span>
                  <span className="text-lg font-medium text-slate-600 mb-1 print:text-slate-800">Overall Score</span>
                </div>
                <div className="mt-3 flex gap-4 text-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 print:text-black">Status:</span>
                    <span className={reportCard.resultStatus === 'PASS' ? 'text-green-600 font-bold print:text-black' : 'text-red-600 font-bold print:text-black'}>
                      {reportCard.resultStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 print:text-black">Grade:</span>
                    <span className="text-slate-900 font-bold print:text-black">{reportCard.grade || 'N/A'}</span>
                  </div>
                  {reportCard.rankInClass && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 print:text-black">Class Rank:</span>
                      <span className="text-amber-600 font-bold print:text-black">#{reportCard.rankInClass}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-1/3 text-xs text-slate-500 border border-slate-200 rounded-lg p-4 bg-white print:border-black print:text-black">
                <p className="font-semibold text-slate-700 mb-2 uppercase print:text-black">Result Rule Details</p>
                <p className="mb-1"><span className="font-medium text-slate-600 print:text-black">Configuration:</span> {reportCard.resultRuleSnapshot}</p>
                <p><span className="font-medium text-slate-600 print:text-black">Calculated On:</span> {format(new Date(reportCard.calculatedAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
            </div>

            {/* 5. Signatures (Uses mt-auto to naturally push to the bottom without absolute overlap) */}
            <div className="mt-auto pt-16 flex justify-between items-end">
              <div className="text-center w-40">
                <div className="h-12 border-b border-slate-400 mb-2 print:border-black"></div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider print:text-black">Class Teacher</p>
              </div>
              <div className="text-center w-40">
                <div className="h-12 border-b border-slate-400 mb-2 print:border-black"></div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider print:text-black">Principal</p>
              </div>
              <div className="text-center w-40">
                <div className="h-12 border-b border-slate-400 mb-2 print:border-black"></div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider print:text-black">Parent / Guardian</p>
              </div>
            </div>

            {/* Print Footer Watermark */}
            <div className="mt-8 text-center border-t border-slate-100 pt-3 print:border-black">
              <p className="text-[10px] text-slate-400 font-medium print:text-black">Generated by HatSynk School Management System • Authenticated Document</p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}