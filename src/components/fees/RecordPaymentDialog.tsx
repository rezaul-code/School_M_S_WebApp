// src/components/fees/RecordPaymentDialog.tsx

import * as React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, IndianRupee, CreditCard, Smartphone, Banknote, Building2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { recordPayment, type PaymentMode } from "@/lib/api/payments";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  feeId: number;
  period: string;
  feeType: string;
  balance: number;
  academicYearId: number;
}

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: React.ElementType }[] = [
  { value: "CASH",          label: "Cash",          icon: Banknote   },
  { value: "UPI",           label: "UPI",           icon: Smartphone },
  { value: "CARD",          label: "Card",          icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2  },
];

function formatINR(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

export default function RecordPaymentDialog({
  open, onOpenChange, studentId, feeId, period, feeType, balance, academicYearId,
}: Props) {
  const qc = useQueryClient();

  const [amount, setAmount]   = useState("");
  const [mode, setMode]       = useState<PaymentMode>("UPI");
  const [txnRef, setTxnRef]   = useState("");
  const [remarks, setRemarks] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      // Guard: feeId must be a valid number before hitting the API
      if (!feeId || isNaN(feeId)) {
        return Promise.reject(new Error("Fee ID is missing. Please close and reopen the dialog."));
      }
      return recordPayment(studentId, feeId, {
        amountPaid:           Number(amount),
        paymentMode:          mode,
        transactionReference: txnRef || undefined,
        remarks:              remarks || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      qc.invalidateQueries({ queryKey: ["student-fee-summary", studentId, academicYearId] });
      handleClose();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to record payment"));
    },
  });

  function handleClose() {
    onOpenChange(false);
    setAmount("");
    setMode("UPI");
    setTxnRef("");
    setRemarks("");
  }

  const parsedAmount = parseFloat(amount);
  const isFeeIdMissing = !feeId || isNaN(feeId);
  const isInvalid =
    isFeeIdMissing ||
    !amount ||
    isNaN(parsedAmount) ||
    parsedAmount <= 0 ||
    parsedAmount > balance;

  return (
    <Dialog open={open} onOpenChange={(v) => !mutation.isPending && (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600">
              <IndianRupee size={15} />
            </span>
            Record Payment
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{feeType}</span>
            {" — "}
            {period}
            <span className="ml-2 text-xs">
              Balance: <span className="font-semibold text-foreground">{formatINR(balance)}</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Fee ID guard warning */}
          {isFeeIdMissing && (
            <p className="text-xs text-destructive font-medium">
              Fee record ID is unavailable. Please close and reopen this dialog.
            </p>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-amount">
              Amount Paid <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                id="rp-amount"
                type="number"
                min={1}
                max={balance}
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={mutation.isPending || isFeeIdMissing}
              />
            </div>
            {parsedAmount > balance && (
              <p className="text-xs text-destructive">Amount cannot exceed balance of {formatINR(balance)}</p>
            )}
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <Label>Payment Mode <span className="text-destructive">*</span></Label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as PaymentMode)}
              disabled={mutation.isPending || isFeeIdMissing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <Icon size={14} />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Reference */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-txn">Transaction Reference</Label>
            <Input
              id="rp-txn"
              placeholder="e.g. UPI-TXN-12345"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              disabled={mutation.isPending || isFeeIdMissing}
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-remarks">Remarks</Label>
            <Textarea
              id="rp-remarks"
              placeholder="Optional note…"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={mutation.isPending || isFeeIdMissing}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={isInvalid || mutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}