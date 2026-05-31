// src/pages/StudentFeeStatement.tsx
//
// New page: Reporting > Student Statement
// Route: /reports/student-statement
//
// Features:
//  – Academic year + class + section + student selectors
//  – Summary strip (gross / paid / partial / pending / overdue)
//  – Full ledger table with status badges
//  – "Export PDF" → opens /reports/student-statement/pdf?... in new tab
//  – "Send to parent" placeholder (wire to your notification service)

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Loader2, AlertCircle, FileDown, Mail,
  UserCircle2, ReceiptText, ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useActiveAcademicYear } from '@/hooks/useActiveAcademicYear';
import { getClassLevels, getClassSections, type IdLabel } from '@/lib/api/options';
import { getStudentFeeStatement, type StudentFeeStatementResponse, type StatementLineItem } from '@/lib/api/studentFeeStatement';

// Reuse the student search from payFee — only ACTIVE students
import { searchPayFeeStudents, type PayFeeStudent } from '@/lib/api/payFee';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INR = (n: number | string) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(Number(n));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  PAID:            'bg-emerald-100 text-emerald-800 border-emerald-200',
  PARTIAL:         'bg-blue-100   text-blue-800   border-blue-200',
  PENDING:         'bg-amber-100  text-amber-800  border-amber-200',
  OVERDUE:         'bg-rose-100   text-rose-800   border-rose-800',
  WAIVED:          'bg-slate-100  text-slate-600  border-slate-200',
  TRANSFER_CREDIT: 'bg-purple-100 text-purple-800 border-purple-200',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${STATUS_STYLE[status] ?? STATUS_STYLE.PENDING}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Fee type badge ────────────────────────────────────────────────────────────

const FEE_TYPE_STYLE: Record<string, string> = {
  TUITION:   'bg-violet-100 text-violet-800',
  TRANSPORT: 'bg-blue-100   text-blue-800',
  ACTIVITY:  'bg-amber-100  text-amber-800',
  EXAM:      'bg-pink-100   text-pink-800',
  ADMISSION: 'bg-teal-100   text-teal-800',
};

function FeeTypeBadge({ type, label }: { type: string; label: string }) {
  const cls = FEE_TYPE_STYLE[type] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${cls}`}>
      {label}
    </span>
  );
}

// ─── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, valueClass = 'text-slate-900',
}: {
  label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function StudentFeeStatement() {
  const { data: activeYear } = useActiveAcademicYear();
  const activeYearId = activeYear?.id;

  // Filters
  const [classLevelId,   setClassLevelId]   = useState('');
  const [classSectionId, setClassSectionId] = useState('');
  const [studentSearch,  setStudentSearch]  = useState('');
  const [selectedStudent, setSelectedStudent] = useState<PayFeeStudent | null>(null);

  // Options
  const { data: classLevels = [] } = useQuery<IdLabel[]>({
    queryKey: ['options', 'class-levels'],
    queryFn:  getClassLevels,
    staleTime: 10 * 60 * 1000,
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery<IdLabel[]>({
    queryKey: ['options', 'class-sections', classLevelId],
    queryFn:  () => getClassSections(Number(classLevelId)),
    enabled:  Boolean(classLevelId),
    staleTime: 5 * 60 * 1000,
  });

  // Student search
  const hasFilter = Boolean(studentSearch.trim() || classLevelId || classSectionId);

  const studentQuery = useQuery({
    queryKey: ['statement-students', studentSearch, classLevelId, classSectionId],
    queryFn:  () => searchPayFeeStudents({
      search:         studentSearch.trim() || undefined,
      classLevelId:   classLevelId  ? Number(classLevelId)  : undefined,
      classSectionId: classSectionId ? Number(classSectionId) : undefined,
    }),
    enabled: hasFilter,
    placeholderData: prev => prev,
  });

  const students = studentQuery.data?.content ?? [];

  // Statement data
  const statementQuery = useQuery<StudentFeeStatementResponse>({
    queryKey: ['student-statement', selectedStudent?.id, activeYearId],
    queryFn:  () => getStudentFeeStatement(selectedStudent!.id, Number(activeYearId)),
    enabled:  Boolean(selectedStudent && activeYearId),
    staleTime: 30_000,
  });

  const stmt = statementQuery.data;

  // Overdue rows highlight
  const overdueIds = useMemo(
    () => new Set((stmt?.lineItems ?? []).filter(r => r.status === 'OVERDUE').map(r => r.ledgerId)),
    [stmt]
  );

  // PDF export — opens a printable page in a new tab
  const handleExportPdf = () => {
    if (!selectedStudent || !activeYearId) return;
    window.open(
      `/reports/student-statement/pdf?studentId=${selectedStudent.id}&academicYearId=${activeYearId}`,
      '_blank'
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-5 pb-10 pt-2">

      

      {/* ── Selector card ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Select student
        </p>
        <div className="flex flex-wrap justify-between gap-4 items-end">
  {/* Left side - Filters */}
  <div className="flex flex-wrap gap-3 items-end flex-1">

          {/* Class */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-[11px] text-slate-500">Class</label>
            <select
              value={classLevelId}
              onChange={e => { setClassLevelId(e.target.value); setClassSectionId(''); setSelectedStudent(null); }}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All classes</option>
              {classLevels.map(cl => (
                <option key={cl.id} value={String(cl.id)}>{cl.label}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-[11px] text-slate-500">Section</label>
            <select
              value={classSectionId}
              onChange={e => { setClassSectionId(e.target.value); setSelectedStudent(null); }}
              disabled={!classLevelId || sectionsLoading}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!classLevelId ? 'Select class first' : sectionsLoading ? 'Loading…' : 'All sections'}
              </option>
              {sections.map(s => (
                <option key={s.id} value={String(s.id)}>{s.label}</option>
              ))}
            </select>
          </div>

                    {/* Search */}
          <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label className="text-[11px] text-slate-500">Search student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name or roll number…"
                value={studentSearch}
                onChange={e => {
                  setStudentSearch(e.target.value);
                  setSelectedStudent(null);
                }}
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={handleExportPdf}
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Mail className="h-4 w-4" />
            Send to Parent
          </Button>
        </div>
      </div>
        

        {/* Student results */}
        {hasFilter && studentQuery.isLoading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching…
          </div>
        )}

        {hasFilter && !studentQuery.isLoading && students.length > 0 && !selectedStudent && (
          <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {students.slice(0, 8).map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                  {s.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{s.fullName}</p>
                  <p className="text-xs text-slate-400">Roll #{s.rollNumber} · {s.classSectionName}</p>
                </div>
                <span className="text-xs text-slate-400">{s.registrationNo}</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected student pill */}
        {selectedStudent && (
          <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">
            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
              {selectedStudent.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-indigo-900">{selectedStudent.fullName}</p>
              <p className="text-xs text-indigo-600">
                Roll #{selectedStudent.rollNumber} · {selectedStudent.classSectionName} · {selectedStudent.registrationNo}
              </p>
            </div>
            <button
              onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
              className="text-xs text-indigo-400 hover:text-indigo-700 font-medium"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* ── Loading / error states ─────────────────────────────────────── */}
      {selectedStudent && statementQuery.isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center gap-3 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Loading fee statement…</p>
        </div>
      )}

      {selectedStudent && statementQuery.isError && (
        <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center gap-3 shadow-sm">
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <p className="text-base font-semibold text-slate-700">Could not load statement</p>
          <p className="text-sm text-slate-400">
            {(statementQuery.error as any)?.response?.data?.message ?? 'Please try again.'}
          </p>
        </div>
      )}

      {/* ── Statement content ──────────────────────────────────────────── */}
      {stmt && (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <SummaryCard label="Gross amount"  value={INR(stmt.grossAmount)} />
            <SummaryCard label="Total paid"    value={INR(stmt.totalPaid)}    valueClass="text-emerald-700" />
            <SummaryCard label="Partial"       value={INR(stmt.totalPartial)} valueClass="text-blue-700" />
            <SummaryCard label="Pending"       value={INR(stmt.totalPending)} valueClass="text-amber-700" />
            <SummaryCard label="Overdue"       value={INR(stmt.totalOverdue)} valueClass="text-rose-700" />
          </div>

          {/* Student meta strip */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
            <UserCircle2 className="h-10 w-10 text-slate-300 flex-shrink-0" />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="text-[11px] text-slate-400 block">Student</span>
                <span className="font-semibold text-slate-900">{stmt.studentName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Class / Section</span>
                <span className="font-semibold text-slate-900">{stmt.classSectionName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Academic year</span>
                <span className="font-semibold text-slate-900">{stmt.academicYearName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Parent / Guardian</span>
                <span className="font-semibold text-slate-900">{stmt.parentName ?? '—'}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 hidden sm:block">
              <p className="text-[11px] text-slate-400">Balance due</p>
              <p className="text-xl font-black text-rose-600">{INR(stmt.balanceDue)}</p>
            </div>
          </div>

          {/* Ledger table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-indigo-400" />
              <h2 className="font-semibold text-slate-800">
                Annual fee ledger — {stmt.academicYearName}
              </h2>
              <span className="ml-auto text-xs text-slate-400">
                {stmt.lineItems.length} line items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr>
                    {['#', 'Fee type', 'Period', 'Due date', 'Gross', 'Discount', 'Net due', 'Paid', 'Balance', 'Status'].map(h => (
                      <th
                        key={h}
                        className="h-10 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stmt.lineItems.map((row: StatementLineItem, idx: number) => {
                    const isOverdue = overdueIds.has(row.ledgerId);
                    return (
                      <tr
                        key={row.ledgerId}
                        className={`border-b border-slate-100 transition-colors ${isOverdue ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <FeeTypeBadge type={row.feeType} label={row.feeTypeLabel} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{row.period ?? '—'}</td>
                        <td className={`px-4 py-3 text-xs whitespace-nowrap ${isOverdue ? 'text-rose-700 font-semibold' : 'text-slate-600'}`}>
                          {fmtDate(row.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 font-medium">{INR(row.grossAmount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">
                          {row.discount > 0 ? `–${INR(row.discount)}` : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{INR(row.netDue)}</td>
                        <td className="px-4 py-3 text-right text-emerald-700 font-semibold">{INR(row.amountPaid)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${isOverdue ? 'text-rose-700' : row.balance > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          {INR(row.balance)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300">
                    <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{INR(stmt.grossAmount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {stmt.totalDiscount > 0 ? `–${INR(stmt.totalDiscount)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{INR(stmt.netAmount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{INR(stmt.totalPaid)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${stmt.balanceDue > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                      {INR(stmt.balanceDue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Statement metadata footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Ref: {stmt.referenceNo} · Generated: {fmtDate(stmt.generatedOn)} · By: {stmt.generatedBy}</span>
              <span>{stmt.statementPeriod}</span>
            </div>
          </div>
        </>
      )}

      {/* ── Empty prompt ───────────────────────────────────────────────── */}
      {!selectedStudent && !statementQuery.isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl p-20 flex flex-col items-center gap-3 shadow-sm">
          <ReceiptText className="h-12 w-12 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">Select a student to view their statement</p>
          <p className="text-sm text-slate-400">Search by name, roll number, or filter by class and section.</p>
        </div>
      )}
    </div>
  );
}