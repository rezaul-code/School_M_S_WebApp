import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

import { getFeePreview } from "@/lib/api/feeStructures";

type LocalRow = {
  feeType: string;
  label: string;
  totalObligation: number;
  amountPaying: number;
  balance: number;
  monthsToPay?: number;
  unitAmount?: number;
};

export default function FeesCheckoutStep({
  state,
  setState,
}: any) {
  const feePreviewQuery = useQuery({
    queryKey: [
      "fee-preview",
      state.setupData.classSectionId,
      state.setupData.academicYearId,
    ],

    queryFn: () =>
      getFeePreview({
        classSectionId: String(
          state.setupData.classSectionId
        ),

        academicYearId: String(
          state.setupData.academicYearId
        ),
      }),

    enabled:
      !!state.setupData.classSectionId &&
      !!state.setupData.academicYearId,
  });

  const [rows, setRows] = useState<LocalRow[]>([]);

  useEffect(() => {
    if (!feePreviewQuery.data?.lineItems) return;

    const mapped: LocalRow[] =
      feePreviewQuery.data.lineItems.map(
        (item: any) => {
          const isTuition =
            item.feeType === "TUITION";

          const months = isTuition ? 3 : undefined;

          const total = isTuition
            ? item.unitAmount * 3
            : item.totalAmount;

          return {
            feeType: item.feeType,
            label: item.label,
            totalObligation: total,
            amountPaying: total,
            balance: 0,
            monthsToPay: months,
            unitAmount: item.unitAmount,
          };
        }
      );

    setRows(mapped);
  }, [feePreviewQuery.data]);

  useEffect(() => {
    const payments = rows.map((r) => ({
      feeType: r.feeType,
      amountPaid: r.amountPaying,
      ...(r.monthsToPay
        ? { monthsToPay: r.monthsToPay }
        : {}),
    }));

    const totals = {
      grandTotal: rows.reduce(
        (acc, row) => acc + row.totalObligation,
        0
      ),

      payingNow: rows.reduce(
        (acc, row) => acc + row.amountPaying,
        0
      ),

      balance: rows.reduce(
        (acc, row) => acc + row.balance,
        0
      ),
    };

    setState((prev: any) => ({
      ...prev,
      initialPayments: payments,
      totals,
    }));
  }, [rows, setState]);

  const totals = useMemo(() => {
    return {
      grandTotal: rows.reduce(
        (acc, row) => acc + row.totalObligation,
        0
      ),

      payingNow: rows.reduce(
        (acc, row) => acc + row.amountPaying,
        0
      ),

      balance: rows.reduce(
        (acc, row) => acc + row.balance,
        0
      ),
    };
  }, [rows]);

  const updateMonths = (
    index: number,
    months: number
  ) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const total =
          (row.unitAmount ?? 0) * months;

        return {
          ...row,
          monthsToPay: months,
          totalObligation: total,
          amountPaying: total,
          balance: 0,
        };
      })
    );
  };

  const updateAmount = (
    index: number,
    amount: number
  ) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const safeAmount = Math.min(
          Math.max(amount, 0),
          row.totalObligation
        );

        return {
          ...row,
          amountPaying: safeAmount,
          balance:
            row.totalObligation - safeAmount,
        };
      })
    );
  };

  return (
    <Card className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">
          Fees & Checkout
        </h2>

        <p className="text-sm text-muted-foreground">
          Review fee obligations and collect
          initial payment.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fee Type</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead>
                Total Obligation
              </TableHead>
              <TableHead>
                Amount Paying Now
              </TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.feeType}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {row.feeType}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {row.label}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {row.feeType ===
                  "TUITION" ? (
                    <Select
                      value={String(
                        row.monthsToPay
                      )}
                      onValueChange={(value) =>
                        updateMonths(
                          index,
                          Number(value)
                        )
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {Array.from({
                          length: 13,
                        }).map((_, i) => (
                          <SelectItem
                            key={i}
                            value={String(i)}
                          >
                            {i} months
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Fixed
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  ₹
                  {row.totalObligation.toLocaleString()}
                </TableCell>

                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={row.totalObligation}
                    value={row.amountPaying}
                    onChange={(e) =>
                      updateAmount(
                        index,
                        Number(e.target.value)
                      )
                    }
                    className="w-[160px]"
                  />
                </TableCell>

                <TableCell>
                  ₹{row.balance.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="bg-muted/40 font-medium">
              <TableCell colSpan={2}>
                Totals
              </TableCell>

              <TableCell>
                ₹
                {totals.grandTotal.toLocaleString()}
              </TableCell>

              <TableCell>
                ₹
                {totals.payingNow.toLocaleString()}
              </TableCell>

              <TableCell>
                ₹
                {totals.balance.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}