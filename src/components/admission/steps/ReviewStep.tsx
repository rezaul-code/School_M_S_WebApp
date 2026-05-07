import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ReviewStep({
  state,
}: {
  state: any;
}) {
  const { studentInfo, setupData, totals } = state;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Review & Submit</h2>
          <p className="text-sm text-muted-foreground">
            Please verify all information before confirming admission.
          </p>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Student Name
              </p>
              <p className="font-medium">
                {studentInfo.firstName} {studentInfo.lastName}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Email
              </p>
              <p className="font-medium">{studentInfo.email}</p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Roll Number
              </p>
              <p className="font-medium">
                {studentInfo.rollNumber || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Phone
              </p>
              <p className="font-medium">
                {studentInfo.phone || "—"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Academic Year
              </p>
              <p className="font-medium">{setupData.academicYearName}</p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Class Section
              </p>
              <p className="font-medium">{setupData.classSectionName}</p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Total Paying Now
              </p>
              <p className="text-lg font-bold text-primary">
                ₹{totals.payingNow.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Remaining Balance
              </p>
              <p className="font-medium">₹{totals.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Initial Payments</h3>

        <div className="space-y-3">
          {state.initialPayments.map((payment: any) => (
            <div
              key={payment.feeType}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{payment.feeType}</p>
                {payment.monthsToPay && (
                  <p className="text-sm text-muted-foreground">
                    {payment.monthsToPay} months
                  </p>
                )}
              </div>
              <p className="font-semibold">
                ₹{Number(payment.amountPaid).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

