// src/pages/FeeCollections.tsx

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Wallet,
  Sparkles,
  BadgeDollarSign,
  Landmark,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ServerCrash,
} from "lucide-react";

import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

import {
  listAcademicYears,
  getClassLevelOptions,
  getSectionOptions,
} from "@/lib/api/master";
import {
  getFeeCollections,
  type FeeCollectionFilters,
  type PaymentMode,
  type CollectionStatus,
} from "@/lib/api/accounting";
import { getApiErrorMessage } from "@/lib/api/client";

import "@/styles/accounting.css";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const PAYMENT_MODE_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: "CASH",          label: "Cash"          },
  { value: "UPI",           label: "UPI"           },
  { value: "CARD",          label: "Card"          },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

const FEE_TYPE_OPTIONS = [
  { value: "TUITION",   label: "Tuition"   },
  { value: "TRANSPORT", label: "Transport" },
  { value: "EXAM",      label: "Exam"      },
  { value: "LIBRARY",   label: "Library"   },
  { value: "SPORTS",    label: "Sports"    },
  { value: "OTHER",     label: "Other"     },
];

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

const formatDateTime = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day:    "2-digit",
      month:  "short",
      year:   "numeric",
      hour:   "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/* =========================================================
   UI STATE TYPE
   The UI keeps optional ID/enum fields as `number | ""` for
   controlled <Select> compatibility. They are converted to
   proper `number | undefined` before hitting the API.
========================================================= */

interface FilterUIState {
  academicYearId: number | "";
  classLevelId:   number | "";
  sectionId:      number | "";
  paymentMode:    PaymentMode | "";
  feeType:        string;
  fromDate:       string;
  toDate:         string;
  page:           number;
  size:           number;
}

// Converts UI state → API filter (strips empty-string sentinels)
function toApiFilters(ui: FilterUIState, search: string): FeeCollectionFilters {
  const f: FeeCollectionFilters = { page: ui.page, size: ui.size };
  if (ui.academicYearId !== "") f.academicYearId = ui.academicYearId;
  if (ui.classLevelId   !== "") f.classLevelId   = ui.classLevelId;
  if (ui.sectionId      !== "") f.sectionId      = ui.sectionId;
  if (ui.paymentMode    !== "") f.paymentMode     = ui.paymentMode;
  if (ui.feeType.trim())        f.feeType         = ui.feeType.trim();
  if (search.trim())            f.search          = search.trim();
  if (ui.fromDate)              f.fromDate        = ui.fromDate;
  if (ui.toDate)                f.toDate          = ui.toDate;
  return f;
}

/* =========================================================
   DEFAULT STATE
========================================================= */

const DEFAULT_UI: FilterUIState = {
  academicYearId: "",
  classLevelId:   "",
  sectionId:      "",
  paymentMode:    "",
  feeType:        "",
  fromDate:       "",
  toDate:         "",
  page:           0,
  size:           PAGE_SIZE,
};

/* =========================================================
   PAYMENT MODE BADGE
========================================================= */

function PaymentModeBadge({ mode }: { mode: PaymentMode }) {
  const map: Record<PaymentMode, { cls: string; icon: React.ReactNode; label: string }> = {
    CASH:          { cls: "ac-mode ac-mode--cash",          icon: <Banknote />,   label: "Cash" },
    UPI:           { cls: "ac-mode ac-mode--upi",           icon: <Smartphone />, label: "UPI"  },
    CARD:          { cls: "ac-mode ac-mode--card",          icon: <CreditCard />, label: "Card" },
    BANK_TRANSFER: { cls: "ac-mode ac-mode--bank-transfer", icon: <Landmark />,   label: "Bank" },
  };
  const cfg = map[mode] ?? map.CASH;
  return <span className={cfg.cls}>{cfg.icon}{cfg.label}</span>;
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }: { status: CollectionStatus }) {
  const map: Record<CollectionStatus, { cls: string; icon: React.ReactNode; label: string }> = {
    SUCCESS:  { cls: "ac-badge ac-badge--success",  icon: <CheckCircle2 />, label: "Success"  },
    PENDING:  { cls: "ac-badge ac-badge--pending",  icon: <AlertCircle />,  label: "Pending"  },
    FAILED:   { cls: "ac-badge ac-badge--failed",   icon: <XCircle />,      label: "Failed"   },
    REFUNDED: { cls: "ac-badge ac-badge--refunded", icon: <RotateCcw />,    label: "Refunded" },
  };
  const cfg = map[status] ?? map.PENDING;
  return <span className={cfg.cls}>{cfg.icon}{cfg.label}</span>;
}

/* =========================================================
   SKELETON ROWS
========================================================= */

const SKEL_WIDTHS = [28, 120, 64, 110, 72, 68, 68, 80, 100, 56];

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          {SKEL_WIDTHS.map((w, j) => (
            <TableCell key={j}>
              <div className="ac-skel" style={{ height: 13, width: w }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function FeeCollections() {

  // ── UI filter state (Select-compatible, uses "" as "not set") ──
  const [uiFilters, setUiFilters] = useState<FilterUIState>(DEFAULT_UI);

  // Search input is kept separate — only committed on Enter / button click
  // so every keystroke does NOT trigger a new API call.
  const [searchInput, setSearchInput] = useState("");
  // The committed search value that is actually sent to the API.
  const [committedSearch, setCommittedSearch] = useState("");

  // ── Convert UI state to API filters ───────────────────────────
  // useMemo ensures the object reference only changes when the
  // values actually change, preventing spurious React Query refetches.
  const apiFilters = useMemo(
    () => toApiFilters(uiFilters, committedSearch),
    [uiFilters, committedSearch],
  );

  // ── Stable query key — serialise to primitives so React Query
  // can do value-equality comparisons reliably. ──────────────────
  const queryKey = useMemo(
    () => ["fee-collections", apiFilters] as const,
    [apiFilters],
  );

  // ── Dropdown data ──────────────────────────────────────────────
  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn:  listAcademicYears,
    staleTime: 5 * 60 * 1000, // 5 min — master data rarely changes
  });
  const { data: classLevels = [] } = useQuery({
    queryKey: ["class-levels-options"],
    queryFn:  getClassLevelOptions,
    staleTime: 5 * 60 * 1000,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ["section-options"],
    queryFn:  getSectionOptions,
    staleTime: 5 * 60 * 1000,
  });

  // ── Main data query ────────────────────────────────────────────
  const {
    data: result,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn:         () => getFeeCollections(apiFilters),
    placeholderData: (prev) => prev, // keeps previous data visible while fetching
    staleTime:       30_000,         // 30 s — avoids refetch on every window focus
    retry:           1,
  });

  // ── Derive display values ──────────────────────────────────────
  const rows        = result?.page?.content       ?? [];
  const totalPages  = result?.page?.totalPages    ?? 0;
  const totalItems  = result?.page?.totalElements ?? 0;
  const currentPage = result?.page?.number        ?? 0;
  const busy        = isLoading || isFetching;

  // ── Handlers ──────────────────────────────────────────────────

  // Generic setter — resets to page 0 on any filter change.
  // useCallback with [] is correct here because setUiFilters is stable.
  const setFilter = useCallback(
    <K extends keyof FilterUIState>(key: K, value: FilterUIState[K]) => {
      setUiFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
    },
    [],
  );

  const handleSearch = useCallback(() => {
    setCommittedSearch(searchInput);
    setUiFilters((prev) => ({ ...prev, page: 0 }));
  }, [searchInput]);

  const handleReset = useCallback(() => {
    setUiFilters(DEFAULT_UI);
    setSearchInput("");
    setCommittedSearch("");
  }, []);

  const goToPage = useCallback((p: number) => {
    setUiFilters((prev) => ({ ...prev, page: p }));
  }, []);

  const startRow = currentPage * uiFilters.size + 1;
  const endRow   = Math.min(startRow + rows.length - 1, totalItems);

  // ── Page number list with ellipsis ─────────────────────────────
  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i)
      .filter(
        (i) =>
          i === 0 ||
          i === totalPages - 1 ||
          Math.abs(i - currentPage) <= 1,
      )
      .reduce<(number | "…")[]>((acc, i, idx, arr) => {
        if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1)
          acc.push("…");
        acc.push(i);
        return acc;
      }, []);
  }, [totalPages, currentPage]);

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="ac-page">

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="ac-hero">
        <div className="ac-hero-glow" />
        <div className="ac-hero-inner">
          <div className="ac-hero-left">
            <div className="ac-hero-icon-wrap">
              <Wallet />
            </div>
            <div className="ac-hero-text">
              <h2 className="ac-hero-title">Fee Collections</h2>
              <p className="ac-hero-sub">
                Track all incoming fee payments across students, modes and academic years
              </p>
            </div>
          </div>
          <span className="ac-hero-badge">
            <Sparkles />
            Accounting
          </span>
        </div>
      </div>

      {/* ── API error card ─────────────────────────────────── */}
      {isError && (
        <Alert variant="destructive">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Failed to load fee collections</AlertTitle>
          <AlertDescription>
            {getApiErrorMessage(error, "Could not fetch fee collections. Please check your connection or contact support.")}
          </AlertDescription>
        </Alert>
      )}

      {/* ── KPI strip ──────────────────────────────────────── */}
      <div className="ac-stats">
        <div className="ac-stat ac-stat--teal">
          <div className="ac-stat-icon"><BadgeDollarSign /></div>
          <div className="ac-stat-label">Total Collected</div>
          <div className="ac-stat-value">
            {isLoading ? "—" : INR(result?.totalCollected ?? 0)}
          </div>
        </div>
        <div className="ac-stat ac-stat--blue">
          <div className="ac-stat-icon"><Receipt /></div>
          <div className="ac-stat-label">Transactions</div>
          <div className="ac-stat-value">
            {isLoading ? "—" : (result?.totalTransactions ?? 0).toLocaleString("en-IN")}
          </div>
        </div>
        <div className="ac-stat ac-stat--green">
          <div className="ac-stat-icon"><Banknote /></div>
          <div className="ac-stat-label">Cash</div>
          <div className="ac-stat-value">
            {isLoading ? "—" : INR(result?.cashTotal ?? 0)}
          </div>
        </div>
        <div className="ac-stat ac-stat--violet">
          <div className="ac-stat-icon"><Smartphone /></div>
          <div className="ac-stat-label">UPI</div>
          <div className="ac-stat-value">
            {isLoading ? "—" : INR(result?.upiTotal ?? 0)}
          </div>
        </div>
        <div className="ac-stat ac-stat--amber">
          <div className="ac-stat-icon"><CreditCard /></div>
          <div className="ac-stat-label">Card / Bank</div>
          <div className="ac-stat-value">
            {isLoading
              ? "—"
              : INR((result?.cardTotal ?? 0) + (result?.bankTransferTotal ?? 0))}
          </div>
        </div>
      </div>

      {/* ── Filter card ────────────────────────────────────── */}
      <div className="ac-filter-card">
        <div className="ac-filter-header">
          <div>
            <p className="ac-filter-title">
              <SlidersHorizontal />
              Filters
            </p>
            <p className="ac-filter-subtitle">Narrow results using the options below</p>
          </div>
          <button className="ac-btn-ghost" onClick={handleReset}>
            <RotateCcw />
            Reset all
          </button>
        </div>

        <div className="ac-filter-body">
          {/* Row 1 — dropdowns */}
          <div className="ac-filter-grid">

            <div className="ac-field">
              <label>Academic Year</label>
              <Select
                value={String(uiFilters.academicYearId)}
                onValueChange={(v) =>
                  setFilter("academicYearId", v === "ALL" ? "" : Number(v))
                }
              >
                <SelectTrigger className="ac-select h-9">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All years</SelectItem>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ac-field">
              <label>Class</label>
              <Select
                value={String(uiFilters.classLevelId)}
                onValueChange={(v) =>
                  setFilter("classLevelId", v === "ALL" ? "" : Number(v))
                }
              >
                <SelectTrigger className="ac-select h-9">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All classes</SelectItem>
                  {classLevels.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.displayName ?? c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ac-field">
              <label>Section</label>
              <Select
                value={String(uiFilters.sectionId)}
                onValueChange={(v) =>
                  setFilter("sectionId", v === "ALL" ? "" : Number(v))
                }
              >
                <SelectTrigger className="ac-select h-9">
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.displayName ?? s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ac-field">
              <label>Payment Mode</label>
              <Select
                value={uiFilters.paymentMode}
                onValueChange={(v) =>
                  setFilter("paymentMode", v === "ALL" ? "" : (v as PaymentMode))
                }
              >
                <SelectTrigger className="ac-select h-9">
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All modes</SelectItem>
                  {PAYMENT_MODE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ac-field">
              <label>Fee Type</label>
              <Select
                value={uiFilters.feeType || "ALL"}
                onValueChange={(v) =>
                  setFilter("feeType", v === "ALL" ? "" : v)
                }
              >
                <SelectTrigger className="ac-select h-9">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {FEE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ac-field">
              <label>From Date</label>
              <Input
                type="date"
                value={uiFilters.fromDate}
                onChange={(e) => setFilter("fromDate", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="ac-field">
              <label>To Date</label>
              <Input
                type="date"
                value={uiFilters.toDate}
                onChange={(e) => setFilter("toDate", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

          </div>

          {/* Row 2 — search (committed only on Enter or button click) */}
          <div className="ac-search-row">
            <div className="ac-search-wrap">
              <Search className="ac-search-icon" />
              <Input
                placeholder="Search by student name or roll number…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9"
              />
            </div>
            <Button onClick={handleSearch} className="h-9 gap-2 text-sm">
              <Search className="h-3.5 w-3.5" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* ── Results table ──────────────────────────────────── */}
      <div className="ac-table-card">
        <div className="ac-table-header">
          <div>
            <p className="ac-table-title">Collection Ledger</p>
            <p className="ac-table-subtitle">
              {busy
                ? "Loading…"
                : isError
                  ? "Failed to load records"
                  : totalItems === 0
                    ? "No records match the selected filters"
                    : `Showing ${startRow}–${endRow} of ${totalItems} record${totalItems !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Per-page selector */}
          <Select
            value={String(uiFilters.size)}
            onValueChange={(v) =>
              setUiFilters((prev) => ({ ...prev, size: Number(v), page: 0 }))
            }
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

        {/* Table */}
        <div className="ac-table-wrap">
          <Table className="ac-table">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Class / Section</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead style={{ textAlign: "right" }}>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Paid At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {busy ? (
                <SkeletonRows count={uiFilters.size} />
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="ac-empty">
                      <ServerCrash className="ac-empty-icon" />
                      <p className="ac-empty-title">Could not load fee collections</p>
                      <p className="ac-empty-desc">
                        {getApiErrorMessage(error, "An error occurred while fetching data. Please try again.")}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="ac-empty">
                      <Wallet className="ac-empty-icon" />
                      <p className="ac-empty-title">No fee collections found</p>
                      <p className="ac-empty-desc">
                        Try adjusting your filters or search term.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell className="ac-cell-index">{startRow + idx}</TableCell>
                    <TableCell className="ac-cell-name">{row.studentName}</TableCell>
                    <TableCell>
                      <span className="ac-cell-id">{row.rollNumber}</span>
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
                    <TableCell>
                      <span
                        className="ac-cell-ref"
                        title={row.transactionReference ?? ""}
                      >
                        {row.transactionReference ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="ac-cell-meta">
                      {formatDateTime(row.paidAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="ac-pagination">
            <span className="ac-pagination-info">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="ac-pagination-controls">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 0 || busy}
                onClick={() => goToPage(currentPage - 1)}
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
                    disabled={busy}
                    onClick={() => goToPage(item as number)}
                  >
                    {(item as number) + 1}
                  </Button>
                ),
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages - 1 || busy}
                onClick={() => goToPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}