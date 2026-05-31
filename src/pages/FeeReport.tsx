// src/pages/FeeReport.tsx

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ReceiptText,
  BadgeDollarSign,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

import { api } from "@/lib/api/client"; 
import { listAcademicYears } from "@/lib/api/master";
import {
  getFeeReport,
  type FeeReportFilters,
  type FeeStatus,
  type FeeType,
} from "@/lib/api/reports";

import "@/styles/report.css";

/* =========================================================
   CONSTANTS & HELPERS
========================================================= */

const PAGE_SIZE = 10;

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

// Formats ENUM strings like "CREDIT_CARD" to "Credit Card"
const formatLabel = (str: string) =>
  str.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }: { status: FeeStatus }) {
  const map: Record<FeeStatus, { cls: string; icon: React.ReactNode; label: string }> = {
    PAID: { cls: "rpt-badge rpt-badge--paid", icon: <CheckCircle2 />, label: "Paid" },
    PENDING: { cls: "rpt-badge rpt-badge--pending", icon: <Clock />, label: "Pending" },
    PARTIAL: { cls: "rpt-badge rpt-badge--partial", icon: <Clock />, label: "Partial" },
    OVERDUE: { cls: "rpt-badge rpt-badge--overdue", icon: <AlertCircle />, label: "Overdue" },
    WAIVED: { cls: "rpt-badge rpt-badge--waived", icon: <Wallet />, label: "Waived" },
  };

  const cfg = map[status] ?? map.PENDING;

  return (
    <span className={cfg.cls}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* =========================================================
   SKELETON ROWS
========================================================= */

const SKEL_WIDTHS = [32, 130, 72, 120, 80, 72, 84, 72, 72, 72, 60];

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          {SKEL_WIDTHS.map((w, j) => (
            <TableCell key={j}>
              <div className="rpt-skel" style={{ height: 13, width: w }} />
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

export default function FeeReport() {

  /* ── Filter state ─────────────────────────────────────── */
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [filters, setFilters] = useState<FeeReportFilters>({
    academicYearId: "",
    classLevelId:   "",
    classSectionId:      "",
    status:         "",
    feeType:        "",
    search:         "",
    page:           0,
    size:           PAGE_SIZE,
  });

  const [searchInput, setSearchInput] = useState("");

  /* ── 1. Backend Dropdown Queries ──────────────────────── */
  
  const { data: academicYears = [], isSuccess: isYearsLoaded } = useQuery({
    queryKey: ["academic-years"],
    queryFn:  listAcademicYears, // using your existing master.ts function
  });

  const { data: classLevels = [], isLoading: classesLoading } = useQuery({
    queryKey: ["options", "class-levels"],
    queryFn: async () => {
      const res = await api.get("/api/options/class-levels");
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Dependent Section Fetch: Only runs if classLevelId exists
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["options", "class-sections", filters.classLevelId],
    queryFn: async () => {
      const res = await api.get(`/api/options/class-sections?classLevelId=${filters.classLevelId}`);
      return res.data?.data || [];
    },
    enabled: Boolean(filters.classLevelId), // Requirement 2
  });

  const { data: paymentStatuses = [], isLoading: statusLoading } = useQuery({
    queryKey: ["options", "payment-statuses"],
    queryFn: async () => {
      const res = await api.get("/api/options/payment-statuses");
      return res.data?.data || [];
    },
    staleTime: 60 * 60 * 1000, // Rarely changes
  });

  const { data: feeTypes = [], isLoading: feeTypesLoading } = useQuery({
    queryKey: ["options", "fee-types"],
    queryFn: async () => {
      const res = await api.get("/api/options/fee-types");
      return res.data?.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });

  /* ── 2. Auto-Select Active Academic Year ──────────────── */
 useEffect(() => {
    if (isInitialLoad && isYearsLoaded && academicYears.length > 0) {
      const active = academicYears.find((y: any) => y.active) || academicYears[0];
      setFilters((prev) => ({ ...prev, academicYearId: Number(active.id) })); // ✅ Wrapped in Number()
      setIsInitialLoad(false);
    }
  }, [academicYears, isInitialLoad, isYearsLoaded]);

  /* ── Report data ──────────────────────────────────────── */
  const { data: report, isLoading, isFetching } = useQuery({
    queryKey: ["fee-report", filters],
    queryFn:  () => getFeeReport(filters),
    placeholderData: (prev) => prev,
    enabled: !isInitialLoad, // Wait until the active academic year is safely set
  });

  const rows        = report?.data?.content       ?? [];
  const totalPages  = report?.data?.totalPages    ?? 0;
  const totalItems  = report?.data?.totalElements ?? 0;
  const currentPage = report?.data?.number        ?? 0;
  const busy        = isLoading || isFetching || isInitialLoad;

  /* ── Handlers ─────────────────────────────────────────── */
  const setFilter = useCallback(
    <K extends keyof FeeReportFilters>(key: K, value: FeeReportFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
    },
    []
  );

  // Requirement 2: Handling dependent selection
  const handleClassChange = (v: string) => {
    setFilters((prev) => ({
      ...prev,
      classLevelId: v === "ALL" ? "" : Number(v),
      sectionId: "", // Automatically reset section when class changes
      page: 0
    }));
  };

  const handleSearch = () =>
    setFilters((prev) => ({ ...prev, search: searchInput, page: 0 }));

  const handleReset = () => {
    const active = academicYears.find((y: any) => y.active) || academicYears[0];
    setFilters({
      academicYearId: active ? Number(active.id) : "", // ✅ Wrapped in Number()
      classLevelId:   "",
      classSectionId:      "",
      status:         "",
      feeType:        "",
      search:         "",
      page:           0,
      size:           PAGE_SIZE,
    });
    setSearchInput("");
  };

  const goToPage = (p: number) =>
    setFilters((prev) => ({ ...prev, page: p }));

  const startRow = currentPage * (filters.size ?? PAGE_SIZE) + 1;
  const endRow   = Math.min(startRow + rows.length - 1, totalItems);

  /* ── Page numbers with ellipsis ──────────────────────── */
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i)
    .filter(
      (i) =>
        i === 0 ||
        i === totalPages - 1 ||
        Math.abs(i - currentPage) <= 1
    )
    .reduce<(number | "…")[]>((acc, i, idx, arr) => {
      if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push("…");
      acc.push(i);
      return acc;
    }, []);

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="rpt-page">

      <div className="rpt-stats">
        <div className="rpt-stat rpt-stat--blue">
          <div className="rpt-stat-icon"><BadgeDollarSign /></div>
          <div>
            <div className="rpt-stat-label">Gross Amount</div>
            <div className="rpt-stat-value">
              {busy ? "—" : INR(report?.totalGrossAmount ?? 0)}
            </div>
          </div>
        </div>
        <div className="rpt-stat rpt-stat--violet">
          <div className="rpt-stat-icon"><TrendingDown /></div>
          <div>
            <div className="rpt-stat-label">Total Discount</div>
            <div className="rpt-stat-value">
              {busy ? "—" : INR(report?.totalDiscount ?? 0)}
            </div>
          </div>
        </div>
        <div className="rpt-stat rpt-stat--teal">
          <div className="rpt-stat-icon"><Wallet /></div>
          <div>
            <div className="rpt-stat-label">Net Amount</div>
            <div className="rpt-stat-value">
              {busy ? "—" : INR(report?.totalNetAmount ?? 0)}
            </div>
          </div>
        </div>
        <div className="rpt-stat rpt-stat--green">
          <div className="rpt-stat-icon"><CheckCircle2 /></div>
          <div>
            <div className="rpt-stat-label">Amount Paid</div>
            <div className="rpt-stat-value">
              {busy ? "—" : INR(report?.totalPaidAmount ?? 0)}
            </div>
          </div>
        </div>
        <div className="rpt-stat rpt-stat--rose">
          <div className="rpt-stat-icon"><AlertCircle /></div>
          <div>
            <div className="rpt-stat-label">Balance Due</div>
            <div className="rpt-stat-value">
              {busy ? "—" : INR(report?.totalBalanceAmount ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter card ──────────────────────────────────── */}
      <div className="rpt-filter-card">
        
        {/* HEADER: Academic Year alongside Reset All (Requirement 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
          <div>
            <p className="rpt-filter-title">
              <SlidersHorizontal className="mr-2" /> Filters
            </p>
            <p className="rpt-filter-subtitle">Narrow results using the options below</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600">Academic Year:</label>
              <Select
                value={String(filters.academicYearId ?? "")}
                onValueChange={(v) => setFilter("academicYearId", v === "ALL" ? "" : Number(v))}
              >
                <SelectTrigger className="rpt-select h-9 w-[180px] bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Loading..." />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y: any) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.name} {y.active ? "(Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="h-9 gap-2 text-slate-600 border-slate-200 hover:bg-slate-50" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> Reset all
            </Button>
          </div>
        </div>

        <div className="rpt-filter-body">
          {/* Row 1 — 4 dynamic dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

            <div className="rpt-field">
              <label>Class</label>
              <Select
                value={String(filters.classLevelId ?? "")}
                onValueChange={handleClassChange}
                disabled={classesLoading}
              >
                <SelectTrigger className="rpt-select h-9">
                  <SelectValue placeholder={classesLoading ? "Loading..." : "All classes"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All classes</SelectItem>
                  {classLevels.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.label ?? c.displayName ?? c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rpt-field">
              <label>Section</label>
              <Select
                value={String(filters.classSectionId ?? "")}
                onValueChange={(v) => setFilter("classSectionId", v === "ALL" ? "" : Number(v))}
                disabled={!filters.classLevelId || sectionsLoading}
              >
                <SelectTrigger className="rpt-select h-9">
                  <SelectValue placeholder={!filters.classLevelId ? "Select Class First" : "All sections"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All sections</SelectItem>
                  {sections.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label ?? s.displayName ?? s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rpt-field">
              <label>Payment Status</label>
              <Select
                value={filters.status ?? ""}
                onValueChange={(v) => setFilter("status", v === "ALL" ? "" : (v as FeeStatus))}
                disabled={statusLoading}
              >
                <SelectTrigger className="rpt-select h-9">
                  <SelectValue placeholder={statusLoading ? "Loading..." : "All statuses"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {paymentStatuses.map((status: string) => (
                    <SelectItem key={status} value={status}>{formatLabel(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rpt-field">
              <label>Fee Type</label>
              <Select
                value={filters.feeType ?? ""}
                onValueChange={(v) => setFilter("feeType", v === "ALL" ? "" : (v as FeeType))}
                disabled={feeTypesLoading}
              >
                <SelectTrigger className="rpt-select h-9">
                  <SelectValue placeholder={feeTypesLoading ? "Loading..." : "All types"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {feeTypes.map((type: string) => (
                    <SelectItem key={type} value={type}>{formatLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Row 2 — search */}
          <div className="rpt-search-row">
            <div className="rpt-search-wrap">
              <Search className="rpt-search-icon" />
              <Input
                placeholder="Search by student name or roll number…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9"
              />
            </div>
            <Button onClick={handleSearch} className="h-9 gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white">
              <Search className="h-3.5 w-3.5" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* ── Results table ────────────────────────────────── */}
      <div className="rpt-table-card">
        <div className="rpt-table-header">
          <div>
            <p className="rpt-table-title">Fee Ledger</p>
            <p className="rpt-table-subtitle">
              {busy
                ? "Loading…"
                : totalItems === 0
                  ? "No records match the selected filters"
                  : `Showing ${startRow}–${endRow} of ${totalItems} record${totalItems !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Per-page selector */}
          <Select
            value={String(filters.size ?? PAGE_SIZE)}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, size: Number(v), page: 0 }))
            }
          >
            <SelectTrigger className="rpt-select h-8 w-28">
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
        <div className="rpt-table-wrap">
          <Table className="rpt-table">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Class / Section</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead style={{ textAlign: "right" }}>Net Due</TableHead>
                <TableHead style={{ textAlign: "right" }}>Paid</TableHead>
                <TableHead style={{ textAlign: "right" }}>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {busy ? (
                <SkeletonRows count={filters.size ?? PAGE_SIZE} />
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11}>
                    <div className="rpt-empty">
                      <ReceiptText className="rpt-empty-icon" />
                      <p className="rpt-empty-title">No fee records found</p>
                      <p className="rpt-empty-desc">
                        Try adjusting your filters or search term.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={row.ledgerId}>
                    <TableCell className="rpt-cell-index">{startRow + idx}</TableCell>
                    <TableCell className="rpt-cell-name">{row.studentName}</TableCell>
                    <TableCell>
                      <span className="rpt-cell-id">{row.rollNumber}</span>
                    </TableCell>
                    <TableCell className="rpt-cell-meta">{row.classSectionName}</TableCell>
                    <TableCell>
                      <span className="rpt-chip">{formatLabel(row.feeType)}</span>
                    </TableCell>
                    <TableCell className="rpt-cell-meta">{row.periodLabel}</TableCell>
                    <TableCell className="rpt-cell-meta">{row.dueDate}</TableCell>
                    <TableCell className="rpt-cell-amount">{INR(row.netDue)}</TableCell>
                    <TableCell className="rpt-cell-amount-muted">{INR(row.amountPaid)}</TableCell>
                    <TableCell
                      className={
                        row.balance > 0
                          ? "rpt-cell-balance-due"
                          : "rpt-cell-amount-muted"
                      }
                    >
                      {INR(row.balance)}
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
        {!busy && totalPages > 1 && (
          <div className="rpt-pagination">
            <span className="rpt-pagination-info">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="rpt-pagination-controls">
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
                  <span key={`e-${idx}`} className="rpt-page-ellipsis">…</span>
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
                )
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