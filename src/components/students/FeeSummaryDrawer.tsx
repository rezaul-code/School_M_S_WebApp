// src/components/fees/FeeSummaryDrawer.tsx

import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
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

import type { MonthlyFeeDetail, StudentFeeSummary } from "@/types/api";
import { getStudentFeeSummary } from "@/lib/api/students";
import { cn } from "@/lib/utils";

import RecordPaymentDialog from "@/components/fees/RecordPaymentDialog";
import ApplyDiscountDialog from "@/components/fees/ApplyDiscountDialog";
import WaiveFeeDialog      from "@/components/fees/WaiveFeeDialog";

import "@/styles/fee-payment.css";

// ── Helpers ──────────────────────────────────────────────────────

function formatINR(v?: number) {
  if (typeof v !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

// ── Status badge ─────────────────────────────────────────────────

const STATUS_META: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  PAID:    { cls: "fp-badge fp-badge--paid",    icon: CheckCircle2,  label: "Paid"    },
  PARTIAL: { cls: "fp-badge fp-badge--partial", icon: Clock,         label: "Partial" },
  PENDING: { cls: "fp-badge fp-badge--pending", icon: AlertTriangle, label: "Pending" },
  OVERDUE: { cls: "fp-badge fp-badge--overdue", icon: XCircle,       label: "Overdue" },
  WAIVED:  { cls: "fp-badge fp-badge--waived",  icon: Minus,         label: "Waived"  },
};

function StatusBadge({ status }: { status: string }) {
  const s    = (status ?? "").toUpperCase();
  const meta = STATUS_META[s] ?? { cls: "fp-badge fp-badge--pending", icon: AlertTriangle, label: status || "—" };
  const Icon = meta.icon;
  return (
    <span className={meta.cls}>
      <Icon size={10} />
      {meta.label}
    </span>
  );
}

// ── Metric cards ─────────────────────────────────────────────────

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xl font-semibold font-mono">{value}</div>
      </CardContent>
    </Card>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium font-mono">{value}</div>
    </div>
  );
}

// ── Action target ─────────────────────────────────────────────────

interface ActionTarget {
  feeId: number;
  period: string;
  feeType: string;
  grossAmount: number;
  balance: number;
  status: string;
}

// ── Drawer ────────────────────────────────────────────────────────

export default function FeeSummaryDrawer({
  studentId,
  open,
  onOpenChange,
  academicYearId,
}: {
  studentId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  academicYearId: number | undefined;
}) {
  const [expandedFeeTypes, setExpandedFeeTypes] = useState<string[]>([]);

  const [payTarget,      setPayTarget]      = useState<ActionTarget | null>(null);
  const [discountTarget, setDiscountTarget] = useState<ActionTarget | null>(null);
  const [waiveTarget,    setWaiveTarget]    = useState<ActionTarget | null>(null);

  React.useEffect(() => {
    if (!open) {
      setExpandedFeeTypes([]);
      setPayTarget(null);
      setDiscountTarget(null);
      setWaiveTarget(null);
    }
  }, [open]);

  const q = useQuery({
    queryKey: ["student-fee-summary", studentId, academicYearId],
    queryFn: () => getStudentFeeSummary(studentId as string, academicYearId as number),
    enabled: open && !!studentId && !!academicYearId && academicYearId > 0,
  });

  const summary = (q.data ?? null) as StudentFeeSummary | null;
  const isWaitingForAcademicYear = !academicYearId || academicYearId === 0;

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

  function canPay(status: string)      { const s = status.toUpperCase(); return s !== "PAID" && s !== "WAIVED"; }
  function canDiscount(status: string) { const s = status.toUpperCase(); return s !== "PAID" && s !== "WAIVED"; }
  function canWaive(status: string)    { const s = status.toUpperCase(); return s !== "PAID" && s !== "WAIVED"; }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Fee Summary</SheetTitle>
            <SheetDescription>Gross, paid and outstanding amounts by fee type.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-10">
            {/* Loading */}
            {(q.isLoading || isWaitingForAcademicYear) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="py-4"><Skeleton className="h-4 w-24" /></CardHeader>
                      <CardContent className="pt-0"><Skeleton className="h-6 w-36" /></CardContent>
                    </Card>
                  ))}
                </div>
                <Skeleton className="h-[220px] w-full" />
              </div>
            )}

            {/* Error */}
            {!q.isLoading && q.isError && (
              <Alert variant="destructive">
                <AlertTitle>Failed to load fee summary</AlertTitle>
                <AlertDescription>
                  {(q.error as any)?.message ?? "Something went wrong while fetching fee summary."}
                </AlertDescription>
              </Alert>
            )}

            {/* Data */}
            {!q.isLoading && !q.isError && summary && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <MetricCard title="Total Gross"   value={formatINR(totals?.totalGross)}   />
                  <MetricCard title="Total Paid"    value={formatINR(totals?.totalPaid)}    />
                  <MetricCard title="Total Balance" value={formatINR(totals?.totalBalance)} />
                  <MetricCard title="Total Overdue" value={formatINR(totals?.totalOverdue)} />
                </div>

                {!hasAnyBreakdown ? (
                  <Alert>
                    <AlertTitle>No fee breakdown found</AlertTitle>
                    <AlertDescription>The student has no fee records for this academic year.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
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
                        <AccordionItem value={b.feeType} className="border rounded-lg px-4">
                          <AccordionTrigger className="py-4">
                            <div className="flex items-start justify-between w-full gap-3">
                              <div className="text-left">
                                <div className="font-semibold">{b.feeType}</div>
                                <div className="text-xs text-muted-foreground">Monthly details</div>
                              </div>
                              <div className="text-sm text-right">
                                <span className="text-muted-foreground">Balance: </span>
                                <span className="font-medium font-mono">{formatINR(b.balanceAmount)}</span>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                              <SmallMetric label="Gross"    value={formatINR(b.grossAmount)}   />
                              <SmallMetric label="Paid"     value={formatINR(b.paidAmount)}    />
                              <SmallMetric label="Balance"  value={formatINR(b.balanceAmount)} />
                              <SmallMetric label="Discount" value={formatINR(b.discount)}      />
                            </div>

                            {b.monthlyDetails && b.monthlyDetails.length > 0 ? (
                              <div className="rounded-md border overflow-hidden">
                                <div className="overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Gross</TableHead>
                                        <TableHead>Paid</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-10 text-center">Act.</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {b.monthlyDetails.map((m: MonthlyFeeDetail, i: number) => {
                                        const balance  = m.balance ?? (m.grossAmount - m.paidAmount);
                                        const status   = (m.status ?? "").toUpperCase();

                                        return (
                                          <TableRow key={`${b.feeType}-${i}-${m.period}`}>
                                            <TableCell className="font-medium">{m.period}</TableCell>
                                            <TableCell className="font-mono text-xs">{formatINR(m.grossAmount)}</TableCell>
                                            <TableCell className="font-mono text-xs">{formatINR(m.paidAmount)}</TableCell>
                                            <TableCell>
                                              {balance > 0
                                                ? <span className="fp-balance-due font-mono text-xs">{formatINR(balance)}</span>
                                                : <span className="font-mono text-xs">{formatINR(balance)}</span>
                                              }
                                            </TableCell>
                                            <TableCell><StatusBadge status={m.status} /></TableCell>
                                            <TableCell className="text-center">
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    disabled={status === "PAID" || status === "WAIVED"}
                                                  >
                                                    <MoreVertical size={13} />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                  <DropdownMenuItem
                                                    disabled={!canPay(m.status)}
                                                    onSelect={() =>
                                                      canPay(m.status) &&
                                                      setPayTarget({ feeId: m.feeId, period: m.period, feeType: b.feeType, grossAmount: m.grossAmount, balance, status: m.status })
                                                    }
                                                  >
                                                    <CreditCard size={13} className="mr-2 text-emerald-600" />
                                                    Pay Fee
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    disabled={!canDiscount(m.status)}
                                                    onSelect={() =>
                                                      canDiscount(m.status) &&
                                                      setDiscountTarget({ feeId: m.feeId, period: m.period, feeType: b.feeType, grossAmount: m.grossAmount, balance, status: m.status })
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
                                                      setWaiveTarget({ feeId: m.feeId, period: m.period, feeType: b.feeType, grossAmount: m.grossAmount, balance, status: m.status })
                                                    }
                                                  >
                                                    <ShieldOff size={13} className="mr-2" />
                                                    Waive Fee
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            ) : (
                              <Alert className="mt-2">
                                <AlertTitle>No monthly details</AlertTitle>
                                <AlertDescription>Monthly records are not available for this fee type.</AlertDescription>
                              </Alert>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* No data */}
            {!q.isLoading && !isWaitingForAcademicYear && !q.isError && !summary && (
              <Alert>
                <AlertTitle>Fee summary unavailable</AlertTitle>
                <AlertDescription>No fee data found for this student in the current academic year.</AlertDescription>
              </Alert>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs rendered outside Sheet to avoid stacking context issues */}
      {payTarget && studentId && (
        <RecordPaymentDialog
          open={!!payTarget}
          onOpenChange={(v) => !v && setPayTarget(null)}
          studentId={studentId}
          feeId={payTarget.feeId}
          period={payTarget.period}
          feeType={payTarget.feeType}
          balance={payTarget.balance}
          academicYearId={academicYearId!}
        />
      )}
      {discountTarget && studentId && (
        <ApplyDiscountDialog
          open={!!discountTarget}
          onOpenChange={(v) => !v && setDiscountTarget(null)}
          studentId={studentId}
          feeId={discountTarget.feeId}
          period={discountTarget.period}
          feeType={discountTarget.feeType}
          grossAmount={discountTarget.grossAmount}
          academicYearId={academicYearId!}
        />
      )}
      {waiveTarget && studentId && (
        <WaiveFeeDialog
          open={!!waiveTarget}
          onOpenChange={(v) => !v && setWaiveTarget(null)}
          studentId={studentId}
          feeId={waiveTarget.feeId}
          period={waiveTarget.period}
          feeType={waiveTarget.feeType}
          grossAmount={waiveTarget.grossAmount}
          academicYearId={academicYearId!}
        />
      )}
    </>
  );
}