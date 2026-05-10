// src/components/fees/FeeSummaryDrawer.tsx

import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import type { FeeRow, StudentFeeSummary } from "@/types/api";
import { getStudentFeeSummary } from "@/lib/api/students";

import RecordPaymentDialog  from "@/components/fees/RecordPaymentDialog";
import ApplyDiscountDialog  from "@/components/fees/ApplyDiscountDialog";
import WaiveFeeDialog       from "@/components/fees/WaiveFeeDialog";

import "@/styles/fee-payment.css";

// ── Helpers ───────────────────────────────────────────────────────

function formatINR(v?: number) {
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

// ── Metric cards ──────────────────────────────────────────────────

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
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

// ── Action helpers ────────────────────────────────────────────────

function canAct(status: string) {
  const s = status.toUpperCase();
  return s !== "PAID" && s !== "WAIVED";
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [payTarget,      setPayTarget]      = useState<FeeRow | null>(null);
  const [discountTarget, setDiscountTarget] = useState<FeeRow | null>(null);
  const [waiveTarget,    setWaiveTarget]    = useState<FeeRow | null>(null);

  React.useEffect(() => {
    if (!open) {
      setExpandedGroups([]);
      setPayTarget(null);
      setDiscountTarget(null);
      setWaiveTarget(null);
    }
  }, [open]);

  const isWaitingForAcademicYear = !academicYearId || academicYearId === 0;

  const q = useQuery({
    queryKey: ["student-fee-summary", studentId, academicYearId],
    queryFn:  () =>
      getStudentFeeSummary(studentId as string, academicYearId as number),
    enabled: open && !!studentId && !!academicYearId && academicYearId > 0,
  });

  const summary = (q.data ?? null) as StudentFeeSummary | null;

  const groups = useMemo(
    () => (summary?.rows ? groupRowsByFeeType(summary.rows) : []),
    [summary],
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-4xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Fee Summary</SheetTitle>
            <SheetDescription>
              Gross, paid and outstanding amounts by fee type.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-10">
            {/* ── Loading ── */}
            {(q.isLoading || isWaitingForAcademicYear) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="py-4">
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Skeleton className="h-6 w-36" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Skeleton className="h-[220px] w-full" />
              </div>
            )}

            {/* ── Error ── */}
            {!q.isLoading && q.isError && (
              <Alert variant="destructive">
                <AlertTitle>Failed to load fee summary</AlertTitle>
                <AlertDescription>
                  {(q.error as any)?.message ??
                    "Something went wrong while fetching fee summary."}
                </AlertDescription>
              </Alert>
            )}

            {/* ── Data ── */}
            {!q.isLoading && !q.isError && summary && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <MetricCard
                    title="Gross Due"
                    value={formatINR(summary.grossDueYear)}
                  />
                  <MetricCard
                    title="Collected"
                    value={formatINR(summary.collectedSoFar)}
                  />
                  <MetricCard
                    title="Balance Remaining"
                    value={formatINR(summary.balanceRemaining)}
                  />
                  <MetricCard
                    title="Total Discount"
                    value={formatINR(summary.totalDiscount)}
                  />
                </div>

                {groups.length === 0 ? (
                  <Alert>
                    <AlertTitle>No fee records found</AlertTitle>
                    <AlertDescription>
                      The student has no fee records for this academic year.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
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
                        <AccordionItem
                          value={group.feeType}
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="py-4">
                            <div className="flex items-start justify-between w-full gap-3">
                              <div className="text-left">
                                <div className="font-semibold">
                                  {group.feeType}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {group.rows.length} record
                                  {group.rows.length !== 1 ? "s" : ""}
                                </div>
                              </div>
                              <div className="text-sm text-right">
                                <span className="text-muted-foreground">
                                  Balance:{" "}
                                </span>
                                <span className="font-medium font-mono">
                                  {formatINR(group.balance)}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent>
                            {/* Group totals */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                              <SmallMetric
                                label="Gross"
                                value={formatINR(group.gross)}
                              />
                              <SmallMetric
                                label="Paid"
                                value={formatINR(group.amountPaid)}
                              />
                              <SmallMetric
                                label="Balance"
                                value={formatINR(group.balance)}
                              />
                              <SmallMetric
                                label="Discount"
                                value={formatINR(group.discount)}
                              />
                            </div>

                            {/* Rows table */}
                            <div className="rounded-md border overflow-hidden">
                              <div className="overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Period / Due</TableHead>
                                      <TableHead>Gross</TableHead>
                                      <TableHead>Paid</TableHead>
                                      <TableHead>Balance</TableHead>
                                      <TableHead>Discount</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="w-10 text-center">
                                        Act.
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.rows.map((row) => {
                                      const status = (
                                        row.status ?? ""
                                      ).toUpperCase();
                                      const label =
                                        row.period ?? row.dueDate ?? "—";

                                      return (
                                        <TableRow key={row.id}>
                                          <TableCell className="font-medium">
                                            {label}
                                          </TableCell>
                                          <TableCell className="font-mono text-xs">
                                            {formatINR(row.gross)}
                                          </TableCell>
                                          <TableCell className="font-mono text-xs">
                                            {formatINR(row.amountPaid)}
                                          </TableCell>
                                          <TableCell>
                                            {row.balance > 0 ? (
                                              <span className="fp-balance-due font-mono text-xs">
                                                {formatINR(row.balance)}
                                              </span>
                                            ) : (
                                              <span className="font-mono text-xs">
                                                {formatINR(row.balance)}
                                              </span>
                                            )}
                                          </TableCell>
                                          <TableCell className="font-mono text-xs">
                                            {row.discount > 0 ? (
                                              <span className="fp-discount-value">
                                                {formatINR(row.discount)}
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground">
                                                —
                                              </span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <StatusBadge status={row.status} />
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7"
                                                  disabled={!canAct(row.status)}
                                                >
                                                  <MoreVertical size={13} />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent
                                                align="end"
                                                className="w-44"
                                              >
                                                <DropdownMenuItem
                                                  disabled={!canAct(row.status)}
                                                  onSelect={() => {
                                                    console.log(
                                                      "[FeeSummaryDrawer] Pay Fee selected, row:",
                                                      row,
                                                    );
                                                    setPayTarget(row);
                                                  }}
                                                >
                                                  <CreditCard
                                                    size={13}
                                                    className="mr-2 text-emerald-600"
                                                  />
                                                  Pay Fee
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  disabled={!canAct(row.status)}
                                                  onSelect={() => {
                                                    console.log(
                                                      "[FeeSummaryDrawer] Apply Discount selected, row:",
                                                      row,
                                                    );
                                                    setDiscountTarget(row);
                                                  }}
                                                >
                                                  <Tag
                                                    size={13}
                                                    className="mr-2 text-violet-600"
                                                  />
                                                  Apply Discount
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  disabled={!canAct(row.status)}
                                                  className="text-destructive focus:text-destructive"
                                                  onSelect={() => {
                                                    console.log(
                                                      "[FeeSummaryDrawer] Waive Fee selected, row:",
                                                      row,
                                                    );
                                                    setWaiveTarget(row);
                                                  }}
                                                >
                                                  <ShieldOff
                                                    size={13}
                                                    className="mr-2"
                                                  />
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
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── No data ── */}
            {!q.isLoading &&
              !isWaitingForAcademicYear &&
              !q.isError &&
              !summary && (
                <Alert>
                  <AlertTitle>Fee summary unavailable</AlertTitle>
                  <AlertDescription>
                    No fee data found for this student in the current academic
                    year.
                  </AlertDescription>
                </Alert>
              )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs rendered outside Sheet to avoid stacking-context issues */}
      {payTarget && studentId && (
        <RecordPaymentDialog
          open={!!payTarget}
          onOpenChange={(v) => !v && setPayTarget(null)}
          studentId={studentId}
          feeId={payTarget.id}
          period={payTarget.period ?? payTarget.dueDate ?? ""}
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
          feeId={discountTarget.id}
          period={discountTarget.period ?? discountTarget.dueDate ?? ""}
          feeType={discountTarget.feeType}
          grossAmount={discountTarget.gross}
          academicYearId={academicYearId!}
        />
      )}
      {waiveTarget && studentId && (
        <WaiveFeeDialog
          open={!!waiveTarget}
          onOpenChange={(v) => !v && setWaiveTarget(null)}
          studentId={studentId}
          feeId={waiveTarget.id}
          period={waiveTarget.period ?? waiveTarget.dueDate ?? ""}
          feeType={waiveTarget.feeType}
          grossAmount={waiveTarget.gross}
          academicYearId={academicYearId!}
        />
      )}
    </>
  );
}