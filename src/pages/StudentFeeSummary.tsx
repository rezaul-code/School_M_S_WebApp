// src/pages/StudentFeeSummary.tsx

import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Receipt,
  AlertCircle,
  FileX,
  TrendingDown,
  Wallet,
  BadgeIndianRupee,
  CircleAlert,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { MonthlyFeeDetail, StudentFeeSummary } from "@/types/api";
import { getStudentFeeSummary } from "@/lib/api/students";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { cn } from "@/lib/utils";

import "@/styles/student-pages.css";

// ── Currency formatting — INR ──────────────────────────────

function formatINR(v?: number): string {
  if (typeof v !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

// ── Status badge helpers (preserved from FeeSummaryDrawer) ─

function getStatusVariant(status: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "OVERDUE") return "destructive";
  if (s === "PAID")    return "default";
  return "outline";
}

function getStatusClassName(status: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "OVERDUE")
    return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  if (s === "PAID")
    return "bg-green-600 text-white border-green-600 hover:bg-green-600/90";
  if (s === "PARTIAL")
    return "bg-amber-500 text-black border-amber-500 hover:bg-amber-500/90";
  return "";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={getStatusVariant(status) as any}
      className={cn("capitalize text-[0.7rem] font-semibold px-2 py-0.5", getStatusClassName(status))}
    >
      {status || "—"}
    </Badge>
  );
}

// ── Stat card ──────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  colorClass: string;
  icon: React.ElementType;
}

function StatCard({ label, value, colorClass, icon: Icon }: StatCardProps) {
  return (
    <div className={`sp-stat-card ${colorClass}`}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.25rem",
        }}
      >
        <span className="sp-stat-label">{label}</span>
        <Icon
          size={15}
          style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}
        />
      </div>
      <div className="sp-stat-value">{value}</div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="sp-page">
      <Skeleton className="h-8 w-36 rounded-md" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="sp-stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function StudentFeeSummaryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [expandedFeeTypes, setExpandedFeeTypes] = useState<string[]>([]);

  const { data: activeYear, isLoading: academicYearLoading } =
    useActiveAcademicYear();
  const academicYearId = activeYear?.id as number | undefined;

  const isWaitingForAcademicYear =
    academicYearLoading || !academicYearId || academicYearId === 0;

  const q = useQuery({
    queryKey: ["student-fee-summary", studentId, academicYearId],
    queryFn: () =>
      getStudentFeeSummary(studentId as string, academicYearId as number),
    enabled: !!studentId && !!academicYearId && academicYearId > 0,
  });

  const summary = (q.data ?? null) as StudentFeeSummary | null;

  const totals = useMemo(() => {
    if (!summary) return null;
    return {
      totalGross:   summary.totalGross,
      totalPaid:    summary.totalPaid,
      totalBalance: summary.totalBalance,
      totalOverdue: summary.totalOverdue,
    };
  }, [summary]);

  const hasAnyBreakdown = (summary?.breakdown?.length ?? 0) > 0;

  // ── Loading state
  if (q.isLoading || isWaitingForAcademicYear) return <LoadingSkeleton />;

  // ── Error state
  if (q.isError) {
    return (
      <div className="sp-page">
        <button className="sp-back-btn" onClick={() => navigate("/students")}>
          <ArrowLeft size={14} /> Back to Students
        </button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load fee summary</AlertTitle>
          <AlertDescription>
            {(q.error as any)?.message ??
              "Something went wrong while fetching fee summary."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── No data state
  if (!summary) {
    return (
      <div className="sp-page">
        <button className="sp-back-btn" onClick={() => navigate("/students")}>
          <ArrowLeft size={14} /> Back to Students
        </button>

        {/* Hero */}
        <div className="sp-hero">
          <div className="sp-hero-inner">
            <div className="sp-hero-icon-wrap">
              <Receipt />
            </div>
            <div className="sp-hero-text">
              <h1 className="sp-hero-title">Fee Summary</h1>
              <p className="sp-hero-subtitle">
                Gross, paid and outstanding amounts by fee type
              </p>
            </div>
          </div>
        </div>

        <div className="sp-empty">
          <FileX className="sp-empty-icon" />
          <p className="sp-empty-title">Fee summary unavailable</p>
          <p className="sp-empty-desc">
            No fee data found for this student in the current academic year.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      {/* Back nav */}
      <button className="sp-back-btn" onClick={() => navigate("/students")}>
        <ArrowLeft size={14} /> Back to Students
      </button>

      {/* Hero banner */}
      <div className="sp-hero">
        <div className="sp-hero-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="sp-hero-icon-wrap">
              <Receipt />
            </div>
            <div className="sp-hero-text">
              <h1 className="sp-hero-title">Fee Summary</h1>
              <p className="sp-hero-subtitle">
                {activeYear?.name
                  ? `Academic Year: ${activeYear.name}`
                  : "Gross, paid and outstanding amounts by fee type"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="sp-stat-grid">
        <StatCard
          label="Total Gross"
          value={formatINR(totals?.totalGross)}
          colorClass="sp-stat-card--blue"
          icon={BadgeIndianRupee}
        />
        <StatCard
          label="Total Paid"
          value={formatINR(totals?.totalPaid)}
          colorClass="sp-stat-card--green"
          icon={Wallet}
        />
        <StatCard
          label="Total Balance"
          value={formatINR(totals?.totalBalance)}
          colorClass="sp-stat-card--amber"
          icon={TrendingDown}
        />
        <StatCard
          label="Total Overdue"
          value={formatINR(totals?.totalOverdue)}
          colorClass="sp-stat-card--red"
          icon={CircleAlert}
        />
      </div>

      {/* Fee breakdown section */}
      <div className="sp-section">
        <div className="sp-section-header">
          <Receipt size={15} />
          <h2 className="sp-section-header-title">Fee Breakdown by Type</h2>
        </div>

        <div className="sp-section-body">
          {!hasAnyBreakdown ? (
            <div className="sp-empty">
              <FileX className="sp-empty-icon" />
              <p className="sp-empty-title">No fee breakdown found</p>
              <p className="sp-empty-desc">
                The student has no fee records for this academic year.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {summary.breakdown.map((b, idx) => (
                <Accordion
                  key={`${b.feeType}-${idx}`}
                  type="single"
                  collapsible
                  value={
                    expandedFeeTypes.includes(b.feeType) ? b.feeType : undefined
                  }
                  onValueChange={(v) => {
                    setExpandedFeeTypes((prev) => {
                      if (!v) return prev.filter((x) => x !== b.feeType);
                      if (prev.includes(b.feeType)) return prev;
                      return [b.feeType];
                    });
                  }}
                >
                  <AccordionItem
                    value={b.feeType}
                    className="sp-accordion-item border-0"
                  >
                    <AccordionTrigger
                      className="px-4 py-3 hover:no-underline"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="sp-accordion-trigger-inner">
                        <div style={{ textAlign: "left" }}>
                          <div className="sp-accordion-fee-type">{b.feeType}</div>
                          <div className="sp-accordion-fee-sub">
                            Monthly details
                          </div>
                        </div>
                        <div className="sp-accordion-balance">
                          <span className="sp-accordion-balance-label">
                            Balance
                          </span>
                          <span className="sp-accordion-balance-value">
                            {formatINR(b.balanceAmount)}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4">
                      {/* Mini metrics */}
                      <div className="sp-mini-grid">
                        <div className="sp-mini-chip">
                          <div className="sp-mini-chip-label">Gross</div>
                          <div className="sp-mini-chip-value">
                            {formatINR(b.grossAmount)}
                          </div>
                        </div>
                        <div className="sp-mini-chip">
                          <div className="sp-mini-chip-label">Paid</div>
                          <div className="sp-mini-chip-value">
                            {formatINR(b.paidAmount)}
                          </div>
                        </div>
                        <div className="sp-mini-chip">
                          <div className="sp-mini-chip-label">Balance</div>
                          <div className="sp-mini-chip-value">
                            {formatINR(b.balanceAmount)}
                          </div>
                        </div>
                        <div className="sp-mini-chip">
                          <div className="sp-mini-chip-label">Discount</div>
                          <div className="sp-mini-chip-value">
                            {formatINR(b.discount)}
                          </div>
                        </div>
                      </div>

                      {/* Monthly details table */}
                      {b.monthlyDetails && b.monthlyDetails.length > 0 ? (
                        <div className="sp-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Period</th>
                                <th>Gross Amount</th>
                                <th>Paid Amount</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.monthlyDetails.map(
                                (m: MonthlyFeeDetail, i: number) => (
                                  <tr key={`${b.feeType}-${i}-${m.period}`}>
                                    <td>{m.period}</td>
                                    <td>{formatINR(m.grossAmount)}</td>
                                    <td>{formatINR(m.paidAmount)}</td>
                                    <td>
                                      <StatusBadge status={m.status} />
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="sp-empty" style={{ padding: "1.25rem" }}>
                          <p className="sp-empty-title" style={{ fontSize: "0.8rem" }}>
                            No monthly details
                          </p>
                          <p className="sp-empty-desc">
                            Monthly records are not available for this fee type.
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}