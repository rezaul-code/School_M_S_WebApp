import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import ProgressBar from "./ProgressBar";
import BottomNavigation from "./BottomNavigation";

import SetupStep from "./steps/SetupStep";
import StudentInfoStep from "./steps/StudentInfoStep";
import FeesCheckoutStep from "./steps/FeesCheckoutStep";
import ReviewStep from "./steps/ReviewStep";

import { getApiErrorMessage } from "@/lib/api/client";
import { admitStudent } from "@/lib/api/students";

export interface InitialPaymentRow {
  feeType: string;
  amountPaid: number;
  monthsToPay?: number;
}

export interface WizardState {
  activeStep: 1 | 2 | 3 | 4;

  setupData: {
    academicYearId: number | null;
    academicYearName?: string;

    classSectionId: number | null;
    classSectionName?: string;
  };

  studentInfo: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    rollNumber: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    guardianName: string;
    guardianPhone: string;
    transactionReference: string;
  };

  initialPayments: InitialPaymentRow[];

  totals: {
    grandTotal: number;
    payingNow: number;
    balance: number;
  };
}

const INITIAL_STATE: WizardState = {
  activeStep: 1,

  setupData: {
    academicYearId: null,
    classSectionId: null,
  },

  studentInfo: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    rollNumber: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
    transactionReference: "",
  },

  initialPayments: [],

  totals: {
    grandTotal: 0,
    payingNow: 0,
    balance: 0,
  },
};

export default function AdmissionWizard({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  const [successData, setSuccessData] = useState<{
    rollNumber: string;
    feeLedgerRowsGenerated: number;
  } | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        email: state.studentInfo.email,
        password: state.studentInfo.password,
        firstName: state.studentInfo.firstName,
        lastName: state.studentInfo.lastName,
        rollNumber: state.studentInfo.rollNumber,
        phone: state.studentInfo.phone || undefined,
        dateOfBirth: state.studentInfo.dateOfBirth || undefined,
        address: state.studentInfo.address || undefined,
        guardianName: state.studentInfo.guardianName || undefined,
        guardianPhone: state.studentInfo.guardianPhone || undefined,
        transactionReference: state.studentInfo.transactionReference || undefined,
        classSectionId: String(state.setupData.classSectionId),
        initialPayments: state.initialPayments.map((p) => ({
          feeType: p.feeType,
          amountPaid: p.amountPaid,
          ...(p.monthsToPay !== undefined
            ? { monthsToPay: p.monthsToPay }
            : {}),
        })),
      };

      return admitStudent(payload as any);
    },

    onSuccess: (data: any) => {
      setSuccessData({
        rollNumber:
          data?.rollNumber ?? data?.data?.rollNumber ?? state.studentInfo.rollNumber,
        feeLedgerRowsGenerated:
          data?.feeLedgerRowsGenerated ??
          data?.data?.feeLedgerRowsGenerated ??
          0,
      });
    },

    onError: (err) => {
      toast.error(getApiErrorMessage(err));
    },
  });

  const isStepValid = () => {
    switch (state.activeStep) {
      case 1:
        return !!state.setupData.academicYearId && !!state.setupData.classSectionId;
      case 2:
        return (
          !!state.studentInfo.firstName &&
          !!state.studentInfo.lastName &&
          !!state.studentInfo.email &&
          !!state.studentInfo.password
        );
      case 3:
        return state.initialPayments.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (state.activeStep < 4) {
      setState((prev) => ({
        ...prev,
        activeStep: (prev.activeStep + 1) as 1 | 2 | 3 | 4,
      }));
    }
  };

  const handleBack = () => {
    if (state.activeStep > 1) {
      setState((prev) => ({
        ...prev,
        activeStep: (prev.activeStep - 1) as 1 | 2 | 3 | 4,
      }));
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate(undefined);
  };

  if (successData) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            ✓
          </div>

          <h2 className="text-2xl font-bold">Student Admitted Successfully!</h2>

          <div className="mt-6 space-y-3 rounded-lg border bg-muted/40 p-4 text-left">
            <div>
              <p className="text-xs text-muted-foreground">Roll Number</p>
              <p className="font-semibold">{successData.rollNumber}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Fee Ledger Rows Generated</p>
              <p className="font-semibold">{successData.feeLedgerRowsGenerated}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setState(INITIAL_STATE);
              setSuccessData(null);
              onSuccess?.();
            }}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b px-6 py-5">
        <ProgressBar activeStep={state.activeStep} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {state.activeStep === 1 && (
          <SetupStep state={state} setState={setState} />
        )}

        {state.activeStep === 2 && (
          <StudentInfoStep state={state} setState={setState} />
        )}

        {state.activeStep === 3 && (
          <FeesCheckoutStep state={state} setState={setState} />
        )}

        {state.activeStep === 4 && <ReviewStep state={state} />}
      </div>

      <BottomNavigation
        activeStep={state.activeStep}
        isLastStep={state.activeStep === 4}
        isLoading={submitMutation.isPending}
        isNextDisabled={!isStepValid()}
        onBack={handleBack}
        onNext={state.activeStep === 4 ? handleSubmit : handleNext}
      />
    </div>
  );
}

