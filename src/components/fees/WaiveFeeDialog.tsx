// src/components/fees/WaiveFeeDialog.tsx

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldOff } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { waiveFee } from "@/lib/api/payments";
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

export default function WaiveFeeDialog({
  open, onOpenChange, studentId, feeId, period, feeType, grossAmount, academicYearId,
}: Props) {
  const qc = useQueryClient();

  const isFeeIdMissing = !feeId || isNaN(feeId);

  const mutation = useMutation({
    mutationFn: () => {
      // Guard: feeId must be a valid number before hitting the API
      if (isFeeIdMissing) {
        return Promise.reject(new Error("Fee ID is missing. Please close and reopen the dialog."));
      }
      return waiveFee(studentId, feeId);
    },
    onSuccess: () => {
      toast.success("Fee waived successfully");
      qc.invalidateQueries({ queryKey: ["student-fee-summary", studentId, academicYearId] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to waive fee"));
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={(v) => !mutation.isPending && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600">
              <ShieldOff size={15} />
            </span>
            Waive Fee?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {isFeeIdMissing ? (
              <span className="text-destructive font-medium">
                Fee record ID is unavailable. Please close and reopen this dialog.
              </span>
            ) : (
              <>
                <span>
                  You are about to waive{" "}
                  <strong className="text-foreground">{feeType}</strong>
                  {" for "}
                  <strong className="text-foreground">{period}</strong>
                  {" "}amounting to{" "}
                  <strong className="text-foreground">{formatINR(grossAmount)}</strong>.
                </span>
                <br />
                <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">
                  This action cannot be undone. The fee will be marked as WAIVED.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={isFeeIdMissing || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Waive Fee
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}