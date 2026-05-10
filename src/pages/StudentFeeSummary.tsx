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

import type { FeeRow, StudentFeeSummary } from "@/types/api";
import { getStudentFeeSummary } from "@/lib/api/students";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";

import RecordPaymentDialog from "@/components/fees/RecordPaymentDialog";
import ApplyDiscountDialog from "@/components/fees/ApplyDiscountDialog";
import WaiveFeeDialog      from "@/components/fees/WaiveFeeDialog";

import "@/styles/student-pages.css";
import "@/styles/fee-payment.css";

// ── Currency ──────────────────────────────────────────────────────

function formatINR(v?: number): string {
  if (typeof v !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

// ── Status badge ──────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { cls: string; icon: React.ElementType; label: string }
> = {
  PAID:    { cls: "fp-badge fp-badge--paid",    icon: CheckCircle2,  label: "Paid"    },
  PARTIAL: { cls: "fp-badge fp-badge--partial", icon: Clock,         label: "Partial" },
  PENDING: { cls: "fp-badge fp-badge--pending", icon: AlertTriangle, label: "Pending" },
  OVERDUE: { cls: "fp-badge fp-badge--overdue", icon: XCircle,       label: "Overdue" },
  WAIVED:  { cls: "fp-badge fp-badge--waived",  icon: Minus,         label: "Waived"  },
};

function StatusBadge({ status }: { status: string }) {
  const s    = (status ?? "").toUpperCase();
  const meta = STATUS_META[s] ?? {
    cls: "fp-badge fp-badge--pending",
    icon: AlertTriangle,
    label: status || "—",
  };
  const Icon = meta.icon;
  return (
    <span className={meta.cls}>
      <Icon size={10} />
      {meta.label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────

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
          <div key={i} style={{
            borderRadius: "0.875rem",
            border: "1px solid hsl(var(--border))",
            padding: "1.125rem 1.25rem",
            background: "hsl(var(--card))",
            display: "flex", flexDirection: "column", gap: "0.5rem",
          }}>
            <Skel style={{ height: "0.7rem", width: "6rem" }} />
            <Skel style={{ height: "1.375rem", width: "8rem" }} />
          </div>
        ))}
      </div>
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

// ── Group rows by feeType ─────────────────────────────────────────

interface FeeGroup {
  feeType: string;
  gross: number;
  amountPaid: number;
  balance: number;
  discount: number;
  rows: FeeRow[];
}

function groupRowsByFeeType(rows: FeeRow[]): FeeGroup[] {
  const map = new Map<string, FeeGroup>();
  for (const row of rows) {
    const existing = map.get(row.feeType);
    if (existing) {
      existing.gross      += row.gross;
      existing.amountPaid += row.amountPaid;
      existing.balance    += row.balance;
      existing.discount   += row.discount;
      existing.rows.push(row);
    } else {
      map.set(row.feeType, {
        feeType:    row.feeType,
        gross:      row.gross,
        amountPaid: row.amountPaid,
        balance:    row.balance,
        discount:   row.discount,
        rows:       [row],
      });
    }
  }
  return Array.from(map.values());
}

// ── Action helper ─────────────────────────────────────────────────

function canAct(status: string) {
  const s = status.toUpperCase();
  return s !== "PAID" && s !== "WAIVED";
}

// ── Page ──────────────────────────────────────────────────────────

export default function StudentFeeSummaryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate      = useNavigate();

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [payTarget,      setPayTarget]      = useState<FeeRow | null>(null);
  const [discountTarget, setDiscountTarget] = useState<FeeRow | null>(null);
  const [waiveTarget,    setWaiveTarget]    = useState<FeeRow | null>(null);

  const { data: activeYear, isLoading: academicYearLoading } = useActiveAcademicYear();

  // Always coerce to number — backend id may arrive as string at runtime
  // even though the type says number|string.
  const academicYearId: number | undefined = activeYear?.id
    ? Number(activeYear.id)
    : undefined;

  const isWaitingForAcademicYear =
    academicYearLoading || !academicYearId || isNaN(academicYearId) || academicYearId <= 0;

  const q = useQuery({
    queryKey: ["student-fee-summary", studentId, academicYearId],
    queryFn:  () => {
      console.log("[StudentFeeSummary] fetching fees for studentId:", studentId, "academicYearId:", academicYearId);
      return getStudentFeeSummary(studentId as string, academicYearId as number);
    },
    enabled: !!studentId && !isWaitingForAcademicYear,
  });

  // Log raw query result every render to confirm shape
  console.log("[StudentFeeSummary] query state:", {
    isLoading: q.isLoading,
    isError: q.isError,
    data: q.data,
    academicYearId,
    isWaitingForAcademicYear,
  });

  const summary = q.data ?? null;

  // Safely read rows — guard against undefined/null
  const rows: FeeRow[] = Array.isArray(summary?.rows) ? summary!.rows : [];

  const groups = useMemo(() => {
    console.log("[StudentFeeSummary] rows to group:", rows);
    return groupRowsByFeeType(rows);
  }, [rows]);

  // ── Loading ───────────────────────────────────────────────────
  if (q.isLoading || isWaitingForAcademicYear) return <LoadingSkeleton />;

  // ── Error ─────────────────────────────────────────────────────
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

  // ── No data ───────────────────────────────────────────────────
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
            {groups.length > 0
              ? `${groups.length} fee type${groups.length !== 1 ? "s" : ""}`
              : "No records"}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="sp-stat-grid">
        <StatCard
          label="Gross Due"
          value={formatINR(summary.grossDueYear)}
          colorClass="sp-stat--blue"
          icon={TrendingUp}
        />
        <StatCard
          label="Collected"
          value={formatINR(summary.collectedSoFar)}
          colorClass="sp-stat--green"
          icon={Wallet}
        />
        <StatCard
          label="Balance Remaining"
          value={formatINR(summary.balanceRemaining)}
          colorClass="sp-stat--amber"
          icon={TrendingDown}
        />
        <StatCard
          label="Overdue"
          value={formatINR(summary.overdue)}
          colorClass="sp-stat--red"
          icon={CircleAlert}
        />
      </div>

      {/* ── Fee breakdown ── */}
      <div className="sp-card sp-card--teal">
        <div className="sp-card-header">
          <div className="sp-card-header-icon"><Receipt size={15} /></div>
          <div>
            <h2 className="sp-card-title">Fee Breakdown by Type</h2>
            <p className="sp-card-subtitle">
              Expand each fee type to view records and manage payments
            </p>
          </div>
        </div>

        <div className="sp-card-body">
          {groups.length === 0 ? (
            <div className="sp-empty">
              <FileX className="sp-empty-icon" />
              <p className="sp-empty-title">No fee records found</p>
              <p className="sp-empty-desc">
                The student has no fee records for this academic year.
              </p>
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <Accordion
                  key={group.feeType}
                  type="single"
                  collapsible
                  value={
                    expandedGroups.includes(group.feeType)
                      ? group.feeType
                      : undefined
                  }
                  onValueChange={(v) => {
                    setExpandedGroups((prev) => {
                      if (!v) return prev.filter((x) => x !== group.feeType);
                      if (prev.includes(group.feeType)) return prev;
                      return [group.feeType];
                    });
                  }}
                >
                  <AccordionItem value={group.feeType} className="sp-accord border-0">
                    <AccordionTrigger
                      className="px-4 py-3.5 hover:no-underline [&>svg]:shrink-0"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="sp-accord-trigger">
                        <div className="sp-accord-left">
                          <div className="sp-accord-name">{group.feeType}</div>
                          <div className="sp-accord-sub">
                            {group.rows.length} record{group.rows.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="sp-accord-right" style={{ marginRight: "0.5rem" }}>
                          <span className="sp-accord-right-label">Balance</span>
                          <span className="sp-accord-right-value">{formatINR(group.balance)}</span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4">
                      {/* Mini metrics */}
                      <div className="sp-chips">
                        <div className="sp-chip">
                          <div className="sp-chip-label">Gross</div>
                          <div className="sp-chip-value">{formatINR(group.gross)}</div>
                        </div>
                        <div className="sp-chip">
                          <div className="sp-chip-label">Paid</div>
                          <div className="sp-chip-value">{formatINR(group.amountPaid)}</div>
                        </div>
                        <div className="sp-chip">
                          <div className="sp-chip-label">Balance</div>
                          <div className="sp-chip-value">{formatINR(group.balance)}</div>
                        </div>
                        <div className="sp-chip">
                          <div className="sp-chip-label">Discount</div>
                          <div className="sp-chip-value">{formatINR(group.discount)}</div>
                        </div>
                      </div>

                      {/* Rows table */}
                      <div className="sp-tbl-wrap">
                        <table className="sp-tbl">
                          <thead>
                            <tr>
                              <th>Period / Due Date</th>
                              <th>Gross</th>
                              <th>Paid</th>
                              <th>Balance</th>
                              <th>Discount</th>
                              <th>Status</th>
                              <th style={{ width: "3rem", textAlign: "center" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.rows.map((row) => {
                              const label = row.period ?? row.dueDate ?? "—";
                              return (
                                <tr key={row.id}>
                                  <td className="font-medium">{label}</td>
                                  <td>{formatINR(row.gross)}</td>
                                  <td>{formatINR(row.amountPaid)}</td>
                                  <td>
                                    {row.balance > 0
                                      ? <span className="fp-balance-due">{formatINR(row.balance)}</span>
                                      : <span>{formatINR(row.balance)}</span>
                                    }
                                  </td>
                                  <td>
                                    {row.discount > 0
                                      ? <span className="fp-discount-value">{formatINR(row.discount)}</span>
                                      : <span className="text-muted-foreground">—</span>
                                    }
                                  </td>
                                  <td><StatusBadge status={row.status} /></td>
                                  <td style={{ textAlign: "center" }}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          disabled={!canAct(row.status)}
                                        >
                                          <MoreVertical size={14} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem
                                          disabled={!canAct(row.status)}
                                          onSelect={() => {
                                            console.log("[StudentFeeSummary] Pay Fee row:", row);
                                            setPayTarget(row);
                                          }}
                                        >
                                          <CreditCard size={13} className="mr-2 text-emerald-600" />
                                          Pay Fee
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                          disabled={!canAct(row.status)}
                                          onSelect={() => {
                                            console.log("[StudentFeeSummary] Apply Discount row:", row);
                                            setDiscountTarget(row);
                                          }}
                                        >
                                          <Tag size={13} className="mr-2 text-violet-600" />
                                          Apply Discount
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                          disabled={!canAct(row.status)}
                                          className="text-destructive focus:text-destructive"
                                          onSelect={() => {
                                            console.log("[StudentFeeSummary] Waive Fee row:", row);
                                            setWaiveTarget(row);
                                          }}
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
          feeId={payTarget.id}
          period={payTarget.period ?? payTarget.dueDate ?? ""}
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
          feeId={discountTarget.id}
          period={discountTarget.period ?? discountTarget.dueDate ?? ""}
          feeType={discountTarget.feeType}
          grossAmount={discountTarget.gross}
          academicYearId={academicYearId!}
        />
      )}
      {waiveTarget && (
        <WaiveFeeDialog
          open={!!waiveTarget}
          onOpenChange={(v) => !v && setWaiveTarget(null)}
          studentId={studentId!}
          feeId={waiveTarget.id}
          period={waiveTarget.period ?? waiveTarget.dueDate ?? ""}
          feeType={waiveTarget.feeType}
          grossAmount={waiveTarget.gross}
          academicYearId={academicYearId!}
        />
      )}
    </div>
  );
}