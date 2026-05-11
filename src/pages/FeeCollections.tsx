// src/pages/FeeCollections.tsx

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Sparkles,
  BadgeDollarSign,
  Landmark,
  CreditCard,
  Smartphone,
  Banknote,
  CalendarDays,
  CalendarRange,
  Clock3,
  ServerCrash,
  ChevronLeft,
  ChevronRight,
  FileX,
  PenLine,
} from "lucide-react";

import { Input }   from "@/components/ui/input";
import { Button }  from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { listAcademicYears }     from "@/lib/api/master";
import { getApiErrorMessage }    from "@/lib/api/client";
import {
  getFeeCollections,
  type CollectionParams,
  type PaymentMode,
  type TimeFrame,
  type FeeCollection,
} from "@/lib/api/accounting";

import "@/styles/accounting.css";

/* =====================================================================
   CONSTANTS — computed once at module load, never recreated
===================================================================== */

const PAGE_SIZE = 10;

// Default date-range = first → last day of current month
const _now  = new Date();
const _y    = _now.getFullYear();
const _m    = _now.getMonth(); // 0-based

const MONTH_START = `${_y}-${String(_m + 1).padStart(2, "0")}-01`;
const MONTH_END   = (() => {
  const last = new Date(_y, _m + 1, 0); // last day of current month
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
})();

const PAYMENT_MODES: { value: PaymentMode | "ALL"; label: string }[] = [
  { value: "ALL",          label: "All Modes"     },
  { value: "CASH",         label: "Cash"          },
  { value: "UPI",          label: "UPI"           },
  { value: "CARD",         label: "Card"          },
  { value: "BANK_TRANSFER",label: "Bank Transfer" },
  { value: "CHEQUE",       label: "Cheque"        },
];

/* =====================================================================
   HELPERS
===================================================================== */

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date(iso));
  } catch { return iso; }
};

/* =====================================================================
   PAYMENT MODE BADGE
===================================================================== */

const MODE_META: Record<PaymentMode, { icon: React.ReactNode; label: string }> = {
  CASH:          { icon: <Banknote />,   label: "Cash"  },
  UPI:           { icon: <Smartphone />, label: "UPI"   },
  CARD:          { icon: <CreditCard />, label: "Card"  },
  BANK_TRANSFER: { icon: <Landmark />,   label: "Bank"  },
  CHEQUE:        { icon: <PenLine />,    label: "Cheque"},
};

function PaymentModeBadge({ mode }: { mode: PaymentMode }) {
  const meta = MODE_META[mode] ?? { icon: <CreditCard />, label: mode };
  return (
    <span className={`ac-mode-badge ac-mode-badge--${mode}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

/* =====================================================================
   SKELETON ROWS
===================================================================== */

const SKEL_COLS = [32, 130, 68, 110, 68, 72, 64, 120, 90];

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          {SKEL_COLS.map((w, j) => (
            <TableCell key={j}>
              <div className="ac-skel" style={{ height: 12, width: w }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/* =====================================================================
   STAT CARD
===================================================================== */

function StatCard({
  label, value, colorClass, icon, loading,
}: {
  label: string; value: string; colorClass: string;
  icon: React.ReactNode; loading: boolean;
}) {
  return (
    <div className={`ac-stat ${colorClass}`}>
      <div className="ac-stat-icon">{icon}</div>
      <div className="ac-stat-label">{label}</div>
      <div className="ac-stat-value">
        {loading
          ? <div className="ac-skel" style={{ height: 20, width: 88, marginTop: 2 }} />
          : value}
      </div>
    </div>
  );
}

/* =====================================================================
   COLLECTION TABLE (pure presentational, owns no state)
===================================================================== */

interface TableProps {
  rows:         FeeCollection[];
  busy:         boolean;
  isError:      boolean;
  error:        unknown;
  startRow:     number;
  totalItems:   number;
  totalPages:   number;
  currentPage:  number;
  pageSize:     number;
  onPageChange: (p: number) => void;
  onSizeChange: (s: number) => void;
}

function CollectionTable({
  rows, busy, isError, error, startRow, totalItems,
  totalPages, currentPage, pageSize, onPageChange, onSizeChange,
}: TableProps) {
  const endRow = Math.min(startRow + rows.length - 1, totalItems);

  // Page-number list with ellipsis — recalculated only when pagination changes
  const pageNumbers = useMemo(() =>
    Array.from({ length: totalPages }, (_, i) => i)
      .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1)
      .reduce<(number | "…")[]>((acc, i, idx, arr) => {
        if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push("…");
        acc.push(i);
        return acc;
      }, []),
    [totalPages, currentPage],
  );

  return (
    <div className="ac-table-card">

      {/* ── Table header bar ─────────────────────────────────── */}
      <div className="ac-table-header">
        <div>
          <p className="ac-table-title">Collection Ledger</p>
          <p className="ac-table-subtitle">
            {busy
              ? "Loading…"
              : isError
                ? "Failed to load records"
                : totalItems === 0
                  ? "No records found for this period"
                  : `Showing ${startRow}–${endRow} of ${totalItems} record${totalItems !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onSizeChange(Number(v))}
        >
          <SelectTrigger className="ac-select h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="ac-table-wrap">
        <Table className="ac-table">
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Roll No.</TableHead>
              <TableHead>Class / Section</TableHead>
              <TableHead>Fee Type</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead style={{ textAlign: "right" }}>Amount</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Txn Reference</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {busy ? (
              <SkeletonRows count={pageSize} />
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="ac-empty">
                    <ServerCrash className="ac-empty-icon" />
                    <p className="ac-empty-title">Could not load collections</p>
                    <p className="ac-empty-desc">
                      {getApiErrorMessage(error, "An error occurred. Please try again.")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="ac-empty">
                    <FileX className="ac-empty-icon" />
                    <p className="ac-empty-title">No collections found</p>
                    <p className="ac-empty-desc">
                      No fee payments recorded for this period or filter selection.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="ac-cell-num">{startRow + idx}</TableCell>
                  <TableCell className="ac-cell-name">{row.studentName}</TableCell>
                  <TableCell>
                    <span className="ac-cell-mono">{row.rollNumber}</span>
                  </TableCell>
                  <TableCell className="ac-cell-meta">{row.classSectionName}</TableCell>
                  <TableCell>
                    <span className="ac-chip">{row.feeType}</span>
                  </TableCell>
                  <TableCell>
                    <PaymentModeBadge mode={row.paymentMode} />
                  </TableCell>
                  <TableCell className="ac-cell-amount">
                    {INR(row.amountPaid)}
                  </TableCell>
                  <TableCell className="ac-cell-meta">
                    {fmtDate(row.paidAt)}
                  </TableCell>
                  <TableCell>
                    <span className="ac-cell-ref" title={row.transactionReference ?? ""}>
                      {row.transactionReference || "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ───────────────────────────────────────── */}
      {!busy && !isError && totalPages > 1 && (
        <div className="ac-pagination">
          <span className="ac-pagination-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="ac-pagination-controls">
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              disabled={currentPage === 0}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers.map((item, idx) =>
              item === "…" ? (
                <span key={`e-${idx}`} className="ac-page-ellipsis">…</span>
              ) : (
                <Button
                  key={item}
                  variant={item === currentPage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => onPageChange(item as number)}
                >
                  {(item as number) + 1}
                </Button>
              ),
            )}

            <Button
              variant="outline" size="icon" className="h-8 w-8"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   PER-TAB FILTER STATE
   Each tab's filter is fully isolated — switching tabs never
   contaminates another tab's state.
===================================================================== */

// Monthly tab: Academic Year + Payment Mode only. NO month field.
interface MonthlyFilters {
  academicYearId: number | ""; // "" = "all years" (not sent to API)
  paymentMode:    PaymentMode | "ALL";
}

// Date range tab: start + end + payment mode.
interface RangeFilters {
  startDate:   string;
  endDate:     string;
  paymentMode: PaymentMode | "ALL";
}

// ── Stable param builders (pure functions, called inside useMemo) ──

function todayParams(page: number, size: number): CollectionParams {
  return { timeFrame: "TODAY", page, size };
}

function monthlyParams(
  f: MonthlyFilters,
  page: number,
  size: number,
): CollectionParams {
  const p: CollectionParams = { timeFrame: "CURRENT_MONTH", page, size };
  // Only append academicYearId when a real ID is selected
  if (f.academicYearId !== "" && f.academicYearId > 0)
    p.academicYearId = f.academicYearId;
  // Only append paymentMode when a specific mode is selected
  if (f.paymentMode !== "ALL")
    p.paymentMode = f.paymentMode;
  return p;
}

function rangeParams(
  f: RangeFilters,
  page: number,
  size: number,
): CollectionParams {
  const p: CollectionParams = { timeFrame: "DATE_RANGE", page, size };
  if (f.startDate)           p.startDate   = f.startDate;
  if (f.endDate)             p.endDate     = f.endDate;
  if (f.paymentMode !== "ALL") p.paymentMode = f.paymentMode;
  return p;
}

/* =====================================================================
   MAIN PAGE COMPONENT
===================================================================== */

export default function FeeCollections() {

  // ── Active tab ──────────────────────────────────────────────────
  // Initialised to TODAY — loads automatically on mount.
  const [activeTab, setActiveTab] = useState<TimeFrame>("TODAY");

  // ── Per-tab pagination — completely independent ─────────────────
  const [todayPage, setTodayPage] = useState(0);
  const [todaySize, setTodaySize] = useState(PAGE_SIZE);
  const [monthPage, setMonthPage] = useState(0);
  const [monthSize, setMonthSize] = useState(PAGE_SIZE);
  const [rangePage, setRangePage] = useState(0);
  const [rangeSize, setRangeSize] = useState(PAGE_SIZE);

  // ── Per-tab filter state ─────────────────────────────────────────
  const [monthlyF, setMonthlyF] = useState<MonthlyFilters>({
    academicYearId: "",
    paymentMode:    "ALL",
  });
  const [rangeF, setRangeF] = useState<RangeFilters>({
    startDate:   MONTH_START,
    endDate:     MONTH_END,
    paymentMode: "ALL",
  });

  // ── Master data (shared, long staleTime) ────────────────────────
  const { data: academicYears = [] } = useQuery({
    queryKey:  ["academic-years"],
    queryFn:   listAcademicYears,
    staleTime: 5 * 60 * 1000,
  });

  // ── Build stable CollectionParams per tab (useMemo on primitives) ─
  // These objects are recreated ONLY when the relevant primitive values
  // change — not on every render — preventing spurious React Query refetches.
  const qpToday = useMemo(
    () => todayParams(todayPage, todaySize),
    [todayPage, todaySize],
  );
  const qpMonthly = useMemo(
    () => monthlyParams(monthlyF, monthPage, monthSize),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthlyF.academicYearId, monthlyF.paymentMode, monthPage, monthSize],
  );
  const qpRange = useMemo(
    () => rangeParams(rangeF, rangePage, rangeSize),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rangeF.startDate, rangeF.endDate, rangeF.paymentMode, rangePage, rangeSize],
  );

  // ── Three independent queries — each enabled only for its own tab ──
  //
  // Using three separate queries (rather than one with a changing key)
  // means switching tabs never triggers a new network request — the
  // previously fetched data for each tab is kept in cache and shown
  // instantly while a background refresh happens.
  //
  // placeholderData: (prev) => prev  ← keeps the last good data visible
  // during any subsequent refetch so KPI cards never reset to zero.

  const todayQ = useQuery({
    queryKey:        ["fee-collections", "TODAY", qpToday] as const,
    queryFn:         () => getFeeCollections(qpToday),
    enabled:         activeTab === "TODAY",
    staleTime:       60_000,
    placeholderData: (prev) => prev,
    retry:           1,
  });

  const monthQ = useQuery({
    queryKey:        ["fee-collections", "CURRENT_MONTH", qpMonthly] as const,
    queryFn:         () => getFeeCollections(qpMonthly),
    enabled:         activeTab === "CURRENT_MONTH",
    staleTime:       60_000,
    placeholderData: (prev) => prev,
    retry:           1,
  });

  const rangeQ = useQuery({
    queryKey:        ["fee-collections", "DATE_RANGE", qpRange] as const,
    queryFn:         () => getFeeCollections(qpRange),
    enabled:         activeTab === "DATE_RANGE",
    staleTime:       60_000,
    placeholderData: (prev) => prev,
    retry:           1,
  });

  // ── Active query alias ───────────────────────────────────────────
  const activeQ =
    activeTab === "TODAY"         ? todayQ :
    activeTab === "CURRENT_MONTH" ? monthQ : rangeQ;

  // result intentionally uses the previous successful data while refetching
  // (guaranteed by placeholderData above)
  const result = activeQ.data;
  const busy   = activeQ.isLoading || activeQ.isFetching;

  const rows        = result?.rows         ?? [];
  const totalItems  = result?.totalElements ?? 0;
  const totalPages  = result?.totalPages    ?? 0;
  const currentPage = result?.currentPage   ?? 0;
  const pageSize    =
    activeTab === "TODAY"         ? todaySize :
    activeTab === "CURRENT_MONTH" ? monthSize : rangeSize;
  const startRow = totalItems === 0 ? 0 : currentPage * pageSize + 1;

  // ── Tab switch ───────────────────────────────────────────────────
  const switchTab = useCallback((tab: TimeFrame) => {
    setActiveTab(tab);
    // Do NOT reset other tabs' pagination or filters on switch
  }, []);

  // ── Pagination callbacks ─────────────────────────────────────────
  const handlePageChange = useCallback((p: number) => {
    if      (activeTab === "TODAY")         setTodayPage(p);
    else if (activeTab === "CURRENT_MONTH") setMonthPage(p);
    else                                    setRangePage(p);
  }, [activeTab]);

  const handleSizeChange = useCallback((s: number) => {
    if (activeTab === "TODAY") {
      setTodaySize(s); setTodayPage(0);
    } else if (activeTab === "CURRENT_MONTH") {
      setMonthSize(s); setMonthPage(0);
    } else {
      setRangeSize(s); setRangePage(0);
    }
  }, [activeTab]);

  // ── Monthly filter setters ───────────────────────────────────────
  const setMonthlyField = useCallback(
    <K extends keyof MonthlyFilters>(key: K, val: MonthlyFilters[K]) => {
      setMonthlyF((prev) => ({ ...prev, [key]: val }));
      setMonthPage(0);
    },
    [],
  );

  // ── Range filter setters ─────────────────────────────────────────
  const setRangeField = useCallback(
    <K extends keyof RangeFilters>(key: K, val: RangeFilters[K]) => {
      setRangeF((prev) => ({ ...prev, [key]: val }));
      setRangePage(0);
    },
    [],
  );

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="ac-page">

      {/* ── Hero banner ────────────────────────────────────── */}
      <div className="ac-hero">
        <div className="ac-hero-glow" />
        <div className="ac-hero-inner">
          <div className="ac-hero-left">
            <div className="ac-hero-icon-wrap"><Wallet /></div>
            <div className="ac-hero-text">
              <h2 className="ac-hero-title">Fee Collections</h2>
              <p className="ac-hero-sub">
                Track all incoming fee payments — today, monthly, or by date range
              </p>
            </div>
          </div>
          <span className="ac-hero-badge">
            <Sparkles />
            Accounting
          </span>
        </div>
      </div>

      {/* ── API error alert (only shown on hard error, not loading) ── */}
      {activeQ.isError && (
        <Alert variant="destructive">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Failed to load collections</AlertTitle>
          <AlertDescription>
            {getApiErrorMessage(
              activeQ.error,
              "Could not fetch fee collection data. Please check your connection or contact support.",
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ── KPI cards ──────────────────────────────────────── */}
      {/* loading=true only on the very first fetch (no cached data yet).
          Once data exists, cards show the previous values while refetching. */}
      <div className="ac-stats">
        <StatCard
          label="Total Collected"
          value={INR(result?.totalCollected ?? 0)}
          colorClass="ac-stat--teal"
          icon={<BadgeDollarSign />}
          loading={activeQ.isLoading && !result}
        />
        <StatCard
          label="Cash"
          value={INR(result?.totalCash ?? 0)}
          colorClass="ac-stat--green"
          icon={<Banknote />}
          loading={activeQ.isLoading && !result}
        />
        <StatCard
          label="UPI"
          value={INR(result?.totalUpi ?? 0)}
          colorClass="ac-stat--violet"
          icon={<Smartphone />}
          loading={activeQ.isLoading && !result}
        />
        <StatCard
          label="Card / Bank"
          value={INR((result?.totalCard ?? 0) + (result?.totalBankTransfer ?? 0))}
          colorClass="ac-stat--amber"
          icon={<CreditCard />}
          loading={activeQ.isLoading && !result}
        />
      </div>

      {/* ── Mode switcher + contextual filters ─────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>

        {/* ── Tab toggle ─────────────────────────────────── */}
        <div className="ac-mode-switcher">
          <button
            className={`ac-mode-tab${activeTab === "TODAY" ? " ac-mode-tab--active" : ""}`}
            onClick={() => switchTab("TODAY")}
          >
            <Clock3 />
            <span>Today</span>
          </button>
          <button
            className={`ac-mode-tab${activeTab === "CURRENT_MONTH" ? " ac-mode-tab--active" : ""}`}
            onClick={() => switchTab("CURRENT_MONTH")}
          >
            <CalendarDays />
            <span>Current Month</span>
          </button>
          <button
            className={`ac-mode-tab${activeTab === "DATE_RANGE" ? " ac-mode-tab--active" : ""}`}
            onClick={() => switchTab("DATE_RANGE")}
          >
            <CalendarRange />
            <span>Custom Range</span>
          </button>
        </div>

        {/* ── MONTHLY filters: Academic Year + Payment Mode only ──
        {activeTab === "CURRENT_MONTH" && (
          <div className="ac-filter-panel">

            <div className="ac-filter-field ac-filter-field--md">
              <label className="ac-filter-panel-label">Academic Year</label>
              <Select
                value={String(monthlyF.academicYearId)}
                onValueChange={(v) =>
                  setMonthlyField("academicYearId", v === "ALL" ? "" : Number(v))
                }
              >
                <SelectTrigger className="ac-select h-9">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All years</SelectItem>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ac-filter-field ac-filter-field--md">
              <label className="ac-filter-panel-label">Payment Mode</label>
              <Select
                value={monthlyF.paymentMode}
                onValueChange={(v) =>
                  setMonthlyField("paymentMode", v as PaymentMode | "ALL")
                }
              >
                <SelectTrigger className="ac-select h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        )} */}

        {/* ── DATE RANGE filters: From + To + Payment Mode ── */}
        {activeTab === "DATE_RANGE" && (
          <div className="ac-filter-panel">

            <div className="ac-filter-field ac-filter-field--date">
              <label className="ac-filter-panel-label">From Date</label>
              <Input
                type="date"
                value={rangeF.startDate}
                onChange={(e) => setRangeField("startDate", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="ac-filter-field ac-filter-field--date">
              <label className="ac-filter-panel-label">To Date</label>
              <Input
                type="date"
                value={rangeF.endDate}
                onChange={(e) => setRangeField("endDate", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="ac-filter-field ac-filter-field--md">
              <label className="ac-filter-panel-label">Payment Mode</label>
              <Select
                value={rangeF.paymentMode}
                onValueChange={(v) =>
                  setRangeField("paymentMode", v as PaymentMode | "ALL")
                }
              >
                <SelectTrigger className="ac-select h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        )}

        {/* TODAY has no filter panel — intentionally minimal */}

      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <CollectionTable
        rows={rows}
        busy={busy}
        isError={activeQ.isError}
        error={activeQ.error}
        startRow={startRow}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSizeChange={handleSizeChange}
      />

    </div>
  );
}