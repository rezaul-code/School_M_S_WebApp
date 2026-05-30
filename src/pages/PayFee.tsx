import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import {
  Search, UserX, Loader2, GraduationCap, LayoutGrid,
  ArrowLeft, CheckCircle, BadgeDollarSign, AlertCircle,
  ReceiptText, Banknote, CreditCard, Landmark, X,
} from "lucide-react";

import { getClassLevels, getClassSections, type IdLabel } from "@/lib/api/options";
import {
  searchPayFeeStudents, getStudentFees, collectBulkPayment,
  type PayFeeStudent, type StudentFeeLedgerResponse,
} from "@/lib/api/payFee";
import { listAcademicYears } from "@/lib/api/master";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { FeeLedgerRowResponse } from "@/lib/api/payFee";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLLECTIBLE = ["PENDING", "PARTIAL", "OVERDUE"];

const PAYMENT_MODES = [
  { value: "CASH",          label: "Cash",          icon: <Banknote  className="h-4 w-4" /> },
  { value: "CREDIT_CARD",   label: "Card",          icon: <CreditCard className="h-4 w-4" /> },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: <Landmark  className="h-4 w-4" /> },
] as const;

type PayMode = typeof PAYMENT_MODES[number]["value"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INR = (n: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(Number(n));

const selectStyle = (hasValue: boolean, disabled = false): React.CSSProperties => ({
  paddingLeft: "0.75rem", paddingRight: "0.875rem",
  paddingTop: "0.45rem",  paddingBottom: "0.45rem",
  fontSize: "0.8125rem",  borderRadius: "0.375rem",
  border: "1px solid #e2e8f0", background: "#ffffff",
  color: hasValue ? "#0f172a" : "#94a3b8",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  outline: "none", height: "2.5rem", minWidth: "150px",
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID:     "bg-emerald-100 text-emerald-800 border-emerald-200",
    PENDING:  "bg-amber-100 text-amber-800 border-amber-200",
    OVERDUE:  "bg-rose-100 text-rose-800 border-rose-200",
    PARTIAL:  "bg-blue-100 text-blue-800 border-blue-200",
    WAIVED:   "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${map[status] ?? map.PENDING}`}>
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PayFee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── View state ────────────────────────────────────────────────────────────
  type View = "search" | "payment";
  const [view, setView]                       = useState<View>("search");
  const [selectedStudent, setSelectedStudent] = useState<PayFeeStudent | null>(null);

  // ── Search filters ────────────────────────────────────────────────────────
  const [search,              setSearch]              = useState("");
  const [selectedClassLevel,  setSelectedClassLevel]  = useState("");
  const [selectedSection,     setSelectedSection]     = useState("");

  // ── Payment state ─────────────────────────────────────────────────────────
  const [paymentMode,   setPaymentMode]   = useState<PayMode>("CASH");
  const [txnRef,        setTxnRef]        = useState("");
  const [remarks,       setRemarks]       = useState("");
  // ledgerId → amount string (allows partial editing)
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  // which ledger rows are checked
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  // ── Options ───────────────────────────────────────────────────────────────
  const { data: classLevels = [] } = useQuery<IdLabel[]>({
    queryKey: ["options", "class-levels"],
    queryFn:  getClassLevels,
    staleTime: 10 * 60 * 1000,
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery<IdLabel[]>({
    queryKey: ["options", "class-sections", selectedClassLevel],
    queryFn:  () => getClassSections(Number(selectedClassLevel)),
    enabled:  Boolean(selectedClassLevel),
    staleTime: 5 * 60 * 1000,
  });

const { data: activeYear } = useActiveAcademicYear();
  const activeYearId = activeYear?.id;

  // ── Student search ────────────────────────────────────────────────────────
  const hasFilter = Boolean(search.trim() || selectedClassLevel || selectedSection);

  const searchQuery = useQuery({
    queryKey: ["pay-fee-students", search, selectedClassLevel, selectedSection],
    queryFn: () => searchPayFeeStudents({
      search:        search.trim() || undefined,
      classLevelId:  selectedClassLevel ? Number(selectedClassLevel) : undefined,
      classSectionId: selectedSection   ? Number(selectedSection)   : undefined,
    }),
    enabled:  hasFilter,
    placeholderData: (prev) => prev,
  });

  const students = searchQuery.data?.content ?? [];

  // ── Fee ledger ────────────────────────────────────────────────────────────
  const feeQuery = useQuery<StudentFeeLedgerResponse>({
    queryKey: ["student-fees", selectedStudent?.id, activeYearId],
    queryFn:  () => getStudentFees(selectedStudent!.id, activeYearId!),
    enabled:  Boolean(selectedStudent && activeYearId && view === "payment"),
    staleTime: 30_000,
  });

  const dueRows: FeeLedgerRowResponse[] = useMemo(
    () => (feeQuery.data?.rows ?? []).filter(r => COLLECTIBLE.includes(r.status as string)),
    [feeQuery.data]
  );

  // Initialise check/amount state when due rows load
  const initPaymentState = useCallback((rows: FeeLedgerRowResponse[]) => {
    const c: Record<number, boolean> = {};
    const a: Record<number, string>  = {};
    rows.forEach(r => {
      c[r.id] = r.status === "OVERDUE"; // pre-check overdue rows
      a[r.id] = String(r.balance);
    });
    setChecked(c);
    setAmounts(a);
  }, []);

  // ── Select student ────────────────────────────────────────────────────────
  const handleSelectStudent = useCallback((student: PayFeeStudent) => {
    setSelectedStudent(student);
    setView("payment");
    setPaymentMode("CASH");
    setTxnRef("");
    setRemarks("");
    setChecked({});
    setAmounts({});
  }, []);

  // Reinitialise when rows arrive
  useMemo(() => {
    if (dueRows.length > 0 && Object.keys(checked).length === 0) {
      initPaymentState(dueRows);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueRows]);

  // ── Computed totals ───────────────────────────────────────────────────────
  const selectedAllocations = useMemo(() =>
    dueRows
      .filter(r => checked[r.id])
      .map(r => ({ ledgerId: r.id, amountPaid: Number(amounts[r.id] ?? r.balance) }))
      .filter(a => a.amountPaid > 0),
    [dueRows, checked, amounts]
  );

  const totalCollecting = useMemo(
    () => selectedAllocations.reduce((s, a) => s + a.amountPaid, 0),
    [selectedAllocations]
  );

  // ── Collect mutation ──────────────────────────────────────────────────────
  const collectMutation = useMutation({
    mutationFn: () => collectBulkPayment(selectedStudent!.id, {
      paymentMode,
      transactionReference: txnRef.trim() || undefined,
      remarks:              remarks.trim() || undefined,
      allocations:          selectedAllocations,
    }),
    onSuccess: () => {
      toast({ title: "Payment Collected", description: `${INR(totalCollecting)} recorded successfully.` });
      queryClient.invalidateQueries({ queryKey: ["student-fees", selectedStudent?.id] });
      queryClient.invalidateQueries({ queryKey: ["fee-collections"] });
      // Refresh the fee query to show updated balances
      feeQuery.refetch();
      setChecked({});
      setAmounts({});
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title:   "Payment Failed",
        description: err.response?.data?.message ?? "Could not process payment.",
      });
    },
  });

  const needsTxnRef = paymentMode !== "CASH";
  const canCollect  =
    selectedAllocations.length > 0 &&
    totalCollecting > 0 &&
    (!needsTxnRef || txnRef.trim().length > 0) &&
    !collectMutation.isPending;

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH VIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "search") {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center gap-3">

            {/* Class */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <GraduationCap size={14} style={{ position: "absolute", left: "0.5rem", color: "#94a3b8", pointerEvents: "none" }} />
              <select
                value={selectedClassLevel}
                onChange={e => { setSelectedClassLevel(e.target.value); setSelectedSection(""); }}
                style={{ ...selectStyle(Boolean(selectedClassLevel)), paddingLeft: "1.75rem" }}
              >
                <option value="">All Classes</option>
                {classLevels.map(cl => <option key={cl.id} value={String(cl.id)}>{cl.label}</option>)}
              </select>
            </div>

            {/* Section */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <LayoutGrid size={14} style={{ position: "absolute", left: "0.5rem", color: "#94a3b8", pointerEvents: "none" }} />
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                disabled={!selectedClassLevel || sectionsLoading}
                style={{ ...selectStyle(Boolean(selectedSection), !selectedClassLevel || sectionsLoading), paddingLeft: "1.75rem" }}
              >
                <option value="">
                  {!selectedClassLevel ? "Select Class First" : sectionsLoading ? "Loading…" : "All Sections"}
                </option>
                {sections.map(s => <option key={s.id} value={String(s.id)}>{s.label}</option>)}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search by name or roll number…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="h-11 px-5 font-semibold text-slate-600 bg-slate-50 border-y border-slate-200">Roll #</th>
                  <th className="h-11 px-5 font-semibold text-slate-600 bg-slate-50 border-y border-slate-200">Student</th>
                  <th className="h-11 px-5 font-semibold text-slate-600 bg-slate-50 border-y border-slate-200">Section</th>
                  <th className="h-11 px-5 font-semibold text-slate-600 bg-slate-50 border-y border-slate-200">Status</th>
                  <th className="h-11 px-5 text-right font-semibold text-slate-600 bg-slate-50 border-y border-slate-200 pr-5">Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Idle */}
                {!hasFilter && (
                  <tr><td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BadgeDollarSign className="h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-base font-medium text-slate-900">Search by name or filter by class</p>
                      <p className="text-sm text-slate-400 mt-1">Only active students are shown</p>
                    </div>
                  </td></tr>
                )}

                {/* Loading */}
                {hasFilter && searchQuery.isLoading && (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </td></tr>
                )}

                {/* Empty */}
                {hasFilter && !searchQuery.isLoading && students.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-14">
                      <UserX className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-900">No active students found</p>
                    </div>
                  </td></tr>
                )}

                {/* Rows */}
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 border-b border-slate-100 font-medium text-slate-600 text-sm">
                      {student.rollNumber || "—"}
                    </td>
                    <td className="px-5 py-3.5 border-b border-slate-100 font-semibold text-slate-900">
                      {student.fullName}
                    </td>
                    <td className="px-5 py-3.5 border-b border-slate-100">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
                        {student.classSectionName ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 border-b border-slate-100">
                      <span className="px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 border-b border-slate-100 text-right pr-5">
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => handleSelectStudent(student)}
                      >
                        <BadgeDollarSign size={13} /> Collect Fee
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAYMENT VIEW
  // ─────────────────────────────────────────────────────────────────────────

  const ledger = feeQuery.data;

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Back */}
      <Button
        variant="ghost"
        className="gap-2 text-slate-500 hover:text-slate-800 -ml-4"
        onClick={() => setView("search")}
      >
        <ArrowLeft size={16} /> Back to Search
      </Button>

      {/* Student identity strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
          {selectedStudent!.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-base">{selectedStudent!.fullName}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Roll #{selectedStudent!.rollNumber} &nbsp;·&nbsp; {selectedStudent!.classSectionName} &nbsp;·&nbsp; {selectedStudent!.registrationNo}
          </p>
        </div>
        {/* Summary pills */}
        {ledger && (
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Balance Due</p>
              <p className="text-lg font-black text-rose-600">{INR(ledger.balanceRemaining)}</p>
            </div>
            {ledger.overdue > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Overdue</p>
                <p className="text-lg font-black text-amber-600">{INR(ledger.overdue)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fee rows */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Select dues to collect</h3>
          {dueRows.length > 0 && (
            <span className="ml-auto text-xs text-slate-400">{dueRows.length} outstanding row{dueRows.length > 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Loading */}
        {feeQuery.isLoading && (
          <div className="py-16 flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading fee ledger…</p>
          </div>
        )}

        {/* Error */}
        {feeQuery.isError && (
          <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <p className="text-sm font-medium text-slate-700">Could not load fee data</p>
          </div>
        )}

        {/* No dues */}
        {!feeQuery.isLoading && !feeQuery.isError && dueRows.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-2 text-slate-400">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
            <p className="text-base font-semibold text-slate-700">All dues cleared</p>
            <p className="text-sm text-slate-400">No outstanding fees for this student.</p>
          </div>
        )}

        {/* Due rows table */}
        {!feeQuery.isLoading && dueRows.length > 0 && (
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="h-10 w-10 px-4 bg-slate-50 border-b border-slate-200"></th>
                  <th className="h-10 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider bg-slate-50 border-b border-slate-200">Fee Type</th>
                  <th className="h-10 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider bg-slate-50 border-b border-slate-200">Period</th>
                  <th className="h-10 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-right">Net Due</th>
                  <th className="h-10 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-right">Balance</th>
                  <th className="h-10 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-center">Status</th>
                  <th className="h-10 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-right">Paying Now</th>
                </tr>
              </thead>
              <tbody>
                {dueRows.map(row => {
                  const isChecked = !!checked[row.id];
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${isChecked ? "bg-indigo-50/40" : "hover:bg-slate-50/50"}`}
                    >
                      <td className="px-4 py-3.5 border-b border-slate-100">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                          checked={isChecked}
                          onChange={e => setChecked(prev => ({ ...prev, [row.id]: e.target.checked }))}
                        />
                      </td>
                      <td className="px-4 py-3.5 border-b border-slate-100 font-semibold text-slate-800">
                        {String(row.feeType).replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3.5 border-b border-slate-100 text-slate-500 text-xs">
                        {row.period ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 border-b border-slate-100 text-right text-slate-700 font-medium">
                        {INR(row.netDue)}
                      </td>
                      <td className="px-4 py-3.5 border-b border-slate-100 text-right font-semibold text-rose-600">
                        {INR(row.balance)}
                      </td>
                      <td className="px-4 py-3.5 border-b border-slate-100 text-center">
                        <StatusBadge status={row.status as string} />
                      </td>
                      <td className="px-4 py-3.5 border-b border-slate-100 text-right">
                        <input
                          type="number"
                          min={0}
                          max={Number(row.balance)}
                          step={0.01}
                          disabled={!isChecked}
                          value={amounts[row.id] ?? row.balance}
                          onChange={e => setAmounts(prev => ({ ...prev, [row.id]: e.target.value }))}
                          className="w-28 h-8 rounded-md border border-slate-200 bg-white px-2 text-right text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment method + collect bar — only show when there are dues */}
      {!feeQuery.isLoading && dueRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">

          <div className="flex flex-wrap gap-6">
            {/* Payment mode */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Method</p>
              <div className="flex gap-2">
                {PAYMENT_MODES.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMode(m.value)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                      paymentMode === m.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Txn reference — required for non-cash */}
            {needsTxnRef && (
              <div className="space-y-2 flex-1 min-w-[200px]">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Transaction Reference <span className="text-rose-500">*</span>
                </p>
                <input
                  type="text"
                  placeholder="UTR / Cheque No. / Ref ID"
                  value={txnRef}
                  onChange={e => setTxnRef(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Remarks — optional */}
            <div className="space-y-2 flex-1 min-w-[180px]">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Remarks (optional)</p>
              <input
                type="text"
                placeholder="e.g. Term 1 fees"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Bottom collect bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-slate-500">
                {selectedAllocations.length} item{selectedAllocations.length !== 1 ? "s" : ""} selected
              </span>
              <span className="text-2xl font-black text-indigo-700">{INR(totalCollecting)}</span>
            </div>

            <Button
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white min-w-[180px] h-10 shadow-sm"
              disabled={!canCollect}
              onClick={() => collectMutation.mutate()}
            >
              {collectMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><CheckCircle size={16} /> Collect & Record</>
              }
            </Button>
          </div>

          {/* Validation hint */}
          {needsTxnRef && !txnRef.trim() && selectedAllocations.length > 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertCircle size={12} /> Transaction reference is required for {paymentMode === "CREDIT_CARD" ? "card" : "bank transfer"} payments.
            </p>
          )}
        </div>
      )}
    </div>
  );
}