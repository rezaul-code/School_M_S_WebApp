// src/components/fees/ApplyDiscountDialog.tsx

import * as React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Tag } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import { applyDiscount } from "@/lib/api/payments";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  feeId: number;
  period: string;
  feeType: string;
  grossAmount: number;
  academicYearId: number;
}

function formatINR(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

export default function ApplyDiscountDialog({
  open, onOpenChange, studentId, feeId, period, feeType, grossAmount, academicYearId,
}: Props) {
  const qc = useQueryClient();

  const [discount, setDiscount] = useState("");
  const [reason, setReason]     = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      // Guard: feeId must be a valid number before hitting the API
      if (!feeId || isNaN(feeId)) {
        return Promise.reject(new Error("Fee ID is missing. Please close and reopen the dialog."));
      }
      return applyDiscount(studentId, feeId, {
        discount: Number(discount),
        reason,
      });
    },
    onSuccess: () => {
      toast.success("Discount applied successfully");
      qc.invalidateQueries({ queryKey: ["student-fee-summary", studentId, academicYearId] });
      handleClose();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to apply discount"));
    },
  });

  function handleClose() {
    onOpenChange(false);
    setDiscount("");
    setReason("");
  }

  const parsed = parseFloat(discount);
  const isFeeIdMissing = !feeId || isNaN(feeId);
  const isInvalid =
    isFeeIdMissing ||
    !discount ||
    isNaN(parsed) ||
    parsed <= 0 ||
    parsed > grossAmount ||
    !reason.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !mutation.isPending && (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600">
              <Tag size={15} />
            </span>
            Apply Discount
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{feeType}</span>
            {" — "}
            {period}
            <span className="ml-2 text-xs">
              Gross: <span className="font-semibold text-foreground">{formatINR(grossAmount)}</span>
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

          <div className="space-y-1.5">
            <Label htmlFor="disc-amount">
              Discount Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                id="disc-amount"
                type="number"
                min={1}
                max={grossAmount}
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                disabled={mutation.isPending || isFeeIdMissing}
              />
            </div>
            {parsed > grossAmount && (
              <p className="text-xs text-destructive">Discount cannot exceed gross amount of {formatINR(grossAmount)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disc-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="disc-reason"
              placeholder="e.g. Merit scholarship, Sibling discount…"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}