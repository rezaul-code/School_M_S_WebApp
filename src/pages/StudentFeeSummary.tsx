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
  Wallet,
  TrendingUp,
  TrendingDown,
  CircleAlert,
  IndianRupee,
  CreditCard,
  Tag,
  ShieldOff,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Minus,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import type { MonthlyFeeDetail, StudentFeeSummary } from "@/types/api";
import { getStudentFeeSummary } from "@/lib/api/students";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";

import RecordPaymentDialog from "@/components/fees/RecordPaymentDialog";
import ApplyDiscountDialog from "@/components/fees/ApplyDiscountDialog";
import WaiveFeeDialog      from "@/components/fees/WaiveFeeDialog";

import "@/styles/student-pages.css";
import "@/styles/fee-payment.css";

// ── Currency ─────────────────────────────────────────────────────

function formatINR(v?: number): string {
  if (typeof v !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

// ── Status badge ─────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { cls: string; icon: React.ElementType; label: string }
> = {
  PAID:    { cls: "fp-badge fp-badge--paid",    icon: CheckCircle2,   label: "Paid"    },
  PARTIAL: { cls: "fp-badge fp-badge--partial", icon: Clock,          label: "Partial" },
  PENDING: { cls: "fp-badge fp-badge--pending", icon: AlertTriangle,  label: "Pending" },
  OVERDUE: { cls: "fp-badge fp-badge--overdue", icon: XCircle,        label: "Overdue" },
  WAIVED:  { cls: "fp-badge fp-badge--waived",  icon: Minus,          label: "Waived"  },
};

function StatusBadge({ status }: { status: string }) {
  const s   = (status ?? "").toUpperCase();
  const meta = STATUS_META[s] ?? { cls: "fp-badge fp-badge--pending", icon: AlertTriangle, label: status || "—" };
  const Icon = meta.icon;
  return (
    <span className={meta.cls}>
      <Icon size={10} />
      {meta.label}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────

function Skel({ style }: { style?: React.CSSProperties }) {
  return <div className="sp-skel" style={style} />;
}

function LoadingSkeleton() {
  return (
    <div className="sp-page">
      <Skel style={{ height: "2rem", width: "9rem", borderRadius: "0.5rem" }} />
      <div className="sp-hero" style={{ padding: "1.75rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Skel style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.625rem", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Skel style={{ height: "1.125rem", width: "10rem" }} />
            <Skel style={{ height: "0.8rem", width: "7rem" }} />
          </div>
        </div>
      </div>
      <div className="sp-stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ borderRadius: "0.875rem", border: "1px solid hsl(var(--border))", padding: "1.125rem 1.25rem", background: "hsl(var(--card))", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Skel style={{ height: "0.7rem", width: "6rem" }} />
            <Skel style={{ height: "1.375rem", width: "8rem" }} />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", padding: "1rem 1.25rem", background: "hsl(var(--card))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Skel style={{ height: "0.875rem", width: "8rem" }} />
            <Skel style={{ height: "0.7rem", width: "5rem" }} />
          </div>
          <Skel style={{ height: "0.9375rem", width: "6rem" }} />
        </div>
      ))}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  colorClass: string;
  icon: React.ElementType;
}

function StatCard({ label, value, colorClass, icon: Icon }: StatCardProps) {
  return (
    <div className={`sp-stat ${colorClass}`}>
      <div className="sp-stat-icon"><Icon size={16} /></div>
      <div className="sp-stat-label">{label}</div>
      <div className="sp-stat-value">{value}</div>
    </div>
  );
}

// ── Action state ──────────────────────────────────────────────────

interface ActionTarget {
  feeId: number;
  period: string;
  feeType: string;
  grossAmount: number;
  balance: number;
  status: string;
}

// ── Page ──────────────────────────────────────────────────────────

export default function StudentFeeSummaryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [expandedFeeTypes, setExpandedFeeTypes] = useState<string[]>([]);

  // Dialogs
  const [payTarget,      setPayTarget]      = useState<ActionTarget | null>(null);
  const [discountTarget, setDiscountTarget] = useState<ActionTarget | null>(null);
  const [waiveTarget,    setWaiveTarget]    = useState<ActionTarget | null>(null);

  const { data: activeYear, isLoading: academicYearLoading } = useActiveAcademicYear();
  const academicYearId = activeYear?.id as number | undefined;
  const isWaitingForAcademicYear = academicYearLoading || !academicYearId || academicYearId === 0;

  const q = useQuery({
    queryKey: ["student-fee-summary", studentId, academicYearId],
    queryFn: () => getStudentFeeSummary(studentId as string, academicYearId as number),
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

  // ── Helpers ──────────────────────────────────────────────────

  function canPay(status: string) {
    const s = status.toUpperCase();
    return s !== "PAID" && s !== "WAIVED";
  }
  function canDiscount(status: string) {
    const s = status.toUpperCase();
    return s !== "PAID" && s !== "WAIVED";
  }
  function canWaive(status: string) {
    const s = status.toUpperCase();
    return s !== "PAID" && s !== "WAIVED";
  }

  // ── Loading
  if (q.isLoading || isWaitingForAcademicYear) return <LoadingSkeleton />;

  // ── Error
  if (q.isError) {
    return (
      <div className="sp-page">
        <button className="sp-back" onClick={() => navigate("/students")}>
          <ArrowLeft /> Back to Students
        </button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load fee summary</AlertTitle>
          <AlertDescription>
            {(q.error as any)?.message ?? "Something went wrong while fetching fee summary."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── No data
  if (!summary) {
    return (
      <div className="sp-page">
        <button className="sp-back" onClick={() => navigate("/students")}>
          <ArrowLeft /> Back to Students
        </button>
        <div className="sp-hero">
          <div className="sp-hero-glow2" />
          <div className="sp-hero-inner">
            <div className="sp-hero-left">
              <div className="sp-hero-icon"><Receipt /></div>
              <div className="sp-hero-text">
                <h1 className="sp-hero-title">Fee Summary</h1>
                <p className="sp-hero-sub">{activeYear?.name ?? "Current academic year"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="sp-empty">
          <FileX className="sp-empty-icon" />
          <p className="sp-empty-title">Fee summary unavailable</p>
          <p className="sp-empty-desc">No fee data found for this student in the current academic year.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      {/* Back */}
      <button className="sp-back" onClick={() => navigate("/students")}>
        <ArrowLeft /> Back to Students
      </button>

      {/* ── Hero banner ── */}
      <div className="sp-hero">
        <div className="sp-hero-glow2" />
        <div className="sp-hero-inner">
          <div className="sp-hero-left">
            <div className="sp-hero-icon"><Receipt /></div>
            <div className="sp-hero-text">
              <h1 className="sp-hero-title">Fee Summary</h1>
              <p className="sp-hero-sub">
                {activeYear?.name
                  ? `Academic Year: ${activeYear.name}`
                  : "Gross, paid and outstanding amounts by fee type"}
              </p>
            </div>
          </div>
          <div className="sp-hero-badge">
            <IndianRupee size={11} />
            {hasAnyBreakdown
              ? `${summary.breakdown.length} fee type${summary.breakdown.length !== 1 ? "s" : ""}`
              : "No records"}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="sp-stat-grid">
        <StatCard label="Total Gross"   value={formatINR(totals?.totalGross)}   colorClass="sp-stat--blue"  icon={TrendingUp}  />
        <StatCard label="Total Paid"    value={formatINR(totals?.totalPaid)}    colorClass="sp-stat--green" icon={Wallet}      />
        <StatCard label="Total Balance" value={formatINR(totals?.totalBalance)} colorClass="sp-stat--amber" icon={TrendingDown} />
        <StatCard label="Total Overdue" value={formatINR(totals?.totalOverdue)} colorClass="sp-stat--red"   icon={CircleAlert} />
      </div>

      {/* ── Fee breakdown ── */}
      <div className="sp-card sp-card--teal">
        <div className="sp-card-header">
          <div className="sp-card-header-icon"><Receipt size={15} /></div>
          <div>
            <h2 className="sp-card-title">Fee Breakdown by Type</h2>
            <p className="sp-card-subtitle">Expand each fee type to view monthly details and manage payments</p>
          </div>
        </div>

        <div className="sp-card-body">
          {!hasAnyBreakdown ? (
            <div className="sp-empty">
              <FileX className="sp-empty-icon" />
              <p className="sp-empty-title">No fee breakdown found</p>
              <p className="sp-empty-desc">The student has no fee records for this academic year.</p>
            </div>
          ) : (
            <div>
              {summary.breakdown.map((b, idx) => (
                <Accordion
                  key={`${b.feeType}-${idx}`}
                  type="single"
                  collapsible
                  value={expandedFeeTypes.includes(b.feeType) ? b.feeType : undefined}
                  onValueChange={(v) => {
                    setExpandedFeeTypes((prev) => {
                      if (!v) return prev.filter((x) => x !== b.feeType);
                      if (prev.includes(b.feeType)) return prev;
                      return [b.feeType];
                    });
                  }}
                >
                  <AccordionItem value={b.feeType} className="sp-accord border-0">
                    <AccordionTrigger
                      className="px-4 py-3.5 hover:no-underline [&>svg]:shrink-0"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="sp-accord-trigger">
                        <div className="sp-accord-left">
                          <div className="sp-accord-name">{b.feeType}</div>
                          <div className="sp-accord-sub">Monthly details</div>
                        </div>
                        <div className="sp-accord-right" style={{ marginRight: "0.5rem" }}>
                          <span className="sp-accord-right-label">Balance</span>
                          <span className="sp-accord-right-value">{formatINR(b.balanceAmount)}</span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4">
                      {/* Mini metrics */}
                      <div className="sp-chips">
                        <div className="sp-chip"><div className="sp-chip-label">Gross</div><div className="sp-chip-value">{formatINR(b.grossAmount)}</div></div>
                        <div className="sp-chip"><div className="sp-chip-label">Paid</div><div className="sp-chip-value">{formatINR(b.paidAmount)}</div></div>
                        <div className="sp-chip"><div className="sp-chip-label">Balance</div><div className="sp-chip-value">{formatINR(b.balanceAmount)}</div></div>
                        <div className="sp-chip"><div className="sp-chip-label">Discount</div><div className="sp-chip-value">{formatINR(b.discount)}</div></div>
                      </div>

                      {/* Monthly details table */}
                      {b.monthlyDetails && b.monthlyDetails.length > 0 ? (
                        <div className="sp-tbl-wrap">
                          <table className="sp-tbl">
                            <thead>
                              <tr>
                                <th>Period</th>
                                <th>Gross</th>
                                <th>Paid</th>
                                <th>Balance</th>
                                <th>Discount</th>
                                <th>Status</th>
                                <th style={{ width: "3rem", textAlign: "center" }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.monthlyDetails.map((m: MonthlyFeeDetail, i: number) => {
                                const balance  = m.balance  ?? (m.grossAmount - m.paidAmount);
                                const discount = m.discount ?? 0;
                                const status   = (m.status ?? "").toUpperCase();

                                return (
                                  <tr key={`${b.feeType}-${i}-${m.period}`}>
                                    <td className="font-medium">{m.period}</td>
                                    <td>{formatINR(m.grossAmount)}</td>
                                    <td>{formatINR(m.paidAmount)}</td>
                                    <td>
                                      {balance > 0
                                        ? <span className="fp-balance-due">{formatINR(balance)}</span>
                                        : <span>{formatINR(balance)}</span>
                                      }
                                    </td>
                                    <td>
                                      {discount > 0
                                        ? <span className="fp-discount-value">{formatINR(discount)}</span>
                                        : <span className="text-muted-foreground">—</span>
                                      }
                                    </td>
                                    <td><StatusBadge status={m.status} /></td>
                                    <td style={{ textAlign: "center" }}>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={status === "PAID" || status === "WAIVED"}
                                          >
                                            <MoreVertical size={14} />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                          <DropdownMenuItem
                                            disabled={!canPay(m.status)}
                                            onSelect={() =>
                                              canPay(m.status) &&
                                              setPayTarget({
                                                feeId:       m.feeId,
                                                period:      m.period,
                                                feeType:     b.feeType,
                                                grossAmount: m.grossAmount,
                                                balance,
                                                status:      m.status,
                                              })
                                            }
                                          >
                                            <CreditCard size={13} className="mr-2 text-emerald-600" />
                                            Pay Fee
                                          </DropdownMenuItem>

                                          <DropdownMenuItem
                                            disabled={!canDiscount(m.status)}
                                            onSelect={() =>
                                              canDiscount(m.status) &&
                                              setDiscountTarget({
                                                feeId:       m.feeId,
                                                period:      m.period,
                                                feeType:     b.feeType,
                                                grossAmount: m.grossAmount,
                                                balance,
                                                status:      m.status,
                                              })
                                            }
                                          >
                                            <Tag size={13} className="mr-2 text-violet-600" />
                                            Apply Discount
                                          </DropdownMenuItem>

                                          <DropdownMenuSeparator />

                                          <DropdownMenuItem
                                            disabled={!canWaive(m.status)}
                                            className="text-destructive focus:text-destructive"
                                            onSelect={() =>
                                              canWaive(m.status) &&
                                              setWaiveTarget({
                                                feeId:       m.feeId,
                                                period:      m.period,
                                                feeType:     b.feeType,
                                                grossAmount: m.grossAmount,
                                                balance,
                                                status:      m.status,
                                              })
                                            }
                                          >
                                            <ShieldOff size={13} className="mr-2" />
                                            Waive Fee
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="sp-empty" style={{ padding: "1.25rem 1rem" }}>
                          <p className="sp-empty-title" style={{ fontSize: "0.8rem" }}>No monthly details</p>
                          <p className="sp-empty-desc">Monthly records are not available for this fee type.</p>
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

      {/* ── Dialogs ── */}
      {payTarget && (
        <RecordPaymentDialog
          open={!!payTarget}
          onOpenChange={(v) => !v && setPayTarget(null)}
          studentId={studentId!}
          feeId={payTarget.feeId}
          period={payTarget.period}
          feeType={payTarget.feeType}
          balance={payTarget.balance}
          academicYearId={academicYearId!}
        />
      )}

      {discountTarget && (
        <ApplyDiscountDialog
          open={!!discountTarget}
          onOpenChange={(v) => !v && setDiscountTarget(null)}
          studentId={studentId!}
          feeId={discountTarget.feeId}
          period={discountTarget.period}
          feeType={discountTarget.feeType}
          grossAmount={discountTarget.grossAmount}
          academicYearId={academicYearId!}
        />
      )}

      {waiveTarget && (
        <WaiveFeeDialog
          open={!!waiveTarget}
          onOpenChange={(v) => !v && setWaiveTarget(null)}
          studentId={studentId!}
          feeId={waiveTarget.feeId}
          period={waiveTarget.period}
          feeType={waiveTarget.feeType}
          grossAmount={waiveTarget.grossAmount}
          academicYearId={academicYearId!}
        />
      )}
    </div>
  );
}