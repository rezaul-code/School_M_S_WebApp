// src/pages/StudentFeeSummary.tsx

import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Receipt } from "lucide-react";

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
import { Button } from "@/components/ui/button";

import type {
  MonthlyFeeDetail,
  StudentFeeSummary,
} from "@/types/api";
import { getStudentFeeSummary } from "@/lib/api/students";
import { useActiveAcademicYear } from "@/hooks/useActiveAcademicYear";
import { cn } from "@/lib/utils";

// ─── Helpers (preserved from FeeSummaryDrawer) ────────────────────────────────

function formatMoney(v?: number) {
  if (typeof v !== "number") return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(v);
}

function getMonthlyStatusBadgeVariant(status: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "OVERDUE") return "destructive";
  if (s === "PAID") return "default";
  if (s === "PARTIAL") return "outline";
  return "outline";
}

function getMonthlyStatusBadgeClassName(status: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "OVERDUE")
    return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  if (s === "PAID")
    return "bg-green-600 text-white border-green-600 hover:bg-green-600/90";
  if (s === "PARTIAL")
    return "bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-500/90";
  return "";
}

function StatusBadge({ status }: { status: string }) {
  const variant = getMonthlyStatusBadgeVariant(status);
  const className = getMonthlyStatusBadgeClassName(status);

  return (
    <Badge variant={variant as any} className={cn("capitalize", className)}>
      {status || "—"}
    </Badge>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
      totalGross: summary.totalGross,
      totalPaid: summary.totalPaid,
      totalBalance: summary.totalBalance,
      totalOverdue: summary.totalOverdue,
    };
  }, [summary]);

  const hasAnyBreakdown = (summary?.breakdown?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/students")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Button>
      </div>

      {/* Page header card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Receipt className="h-6 w-6 text-muted-foreground" />
          <div className="space-y-1">
            <CardTitle>Fee Summary</CardTitle>
            <div className="text-sm text-muted-foreground">
              Gross, paid and outstanding amounts by fee type.
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Loading / waiting for academic year */}
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

          {/* Error state */}
          {!q.isLoading && q.isError && (
            <Alert variant="destructive">
              <AlertTitle>Failed to load fee summary</AlertTitle>
              <AlertDescription>
                {(q.error as any)?.message ??
                  "Something went wrong while fetching fee summary."}
              </AlertDescription>
            </Alert>
          )}

          {/* Data */}
          {!q.isLoading && !q.isError && summary && (
            <>
              {/* Metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <MetricCard
                  title="Total Gross"
                  value={formatMoney(totals?.totalGross)}
                />
                <MetricCard
                  title="Total Paid"
                  value={formatMoney(totals?.totalPaid)}
                />
                <MetricCard
                  title="Total Balance"
                  value={formatMoney(totals?.totalBalance)}
                />
                <MetricCard
                  title="Total Overdue"
                  value={formatMoney(totals?.totalOverdue)}
                />
              </div>

              {/* Breakdown */}
              {!hasAnyBreakdown ? (
                <Alert>
                  <AlertTitle>No fee breakdown found</AlertTitle>
                  <AlertDescription>
                    The student has no fee records for this academic year.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {summary.breakdown.map((b, idx) => (
                    <Accordion
                      key={`${b.feeType}-${idx}`}
                      type="single"
                      collapsible
                      value={
                        expandedFeeTypes.includes(b.feeType)
                          ? b.feeType
                          : undefined
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
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="py-4">
                          <div className="flex items-start justify-between w-full gap-3">
                            <div className="text-left">
                              <div className="font-semibold">{b.feeType}</div>
                              <div className="text-xs text-muted-foreground">
                                Monthly details
                              </div>
                            </div>

                            <div className="text-sm text-right">
                              <span className="text-muted-foreground">
                                Balance:{" "}
                              </span>
                              <span className="font-medium">
                                {formatMoney(b.balanceAmount)}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                            <SmallMetric
                              label="Gross"
                              value={formatMoney(b.grossAmount)}
                            />
                            <SmallMetric
                              label="Paid"
                              value={formatMoney(b.paidAmount)}
                            />
                            <SmallMetric
                              label="Balance"
                              value={formatMoney(b.balanceAmount)}
                            />
                            <SmallMetric
                              label="Discount"
                              value={formatMoney(b.discount)}
                            />
                            <div className="md:col-span-1" />
                          </div>

                          {b.monthlyDetails && b.monthlyDetails.length > 0 ? (
                            <div className="rounded-md border overflow-hidden">
                              <div className="overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Period</TableHead>
                                      <TableHead>Gross Amount</TableHead>
                                      <TableHead>Paid Amount</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {b.monthlyDetails.map(
                                      (m: MonthlyFeeDetail, i: number) => (
                                        <TableRow
                                          key={`${b.feeType}-${i}-${m.period}`}
                                        >
                                          <TableCell className="font-medium">
                                            {m.period}
                                          </TableCell>
                                          <TableCell>
                                            {formatMoney(m.grossAmount)}
                                          </TableCell>
                                          <TableCell>
                                            {formatMoney(m.paidAmount)}
                                          </TableCell>
                                          <TableCell>
                                            <StatusBadge status={m.status} />
                                          </TableCell>
                                        </TableRow>
                                      )
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          ) : (
                            <Alert className="mt-2">
                              <AlertTitle>No monthly details</AlertTitle>
                              <AlertDescription>
                                Monthly records are not available for this fee
                                type.
                              </AlertDescription>
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

          {/* No data state */}
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
        </CardContent>
      </Card>
    </div>
  );
}