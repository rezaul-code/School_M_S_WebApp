const steps = [
  "Setup",
  "Student Info",
  "Fees & Checkout",
  "Review",
];

export default function ProgressBar({
  activeStep,
}: {
  activeStep: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {steps.map((step, index) => {
        const current = index + 1;

        const active = current <= activeStep;

        return (
          <div key={step} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {current}
              </div>

              <span>{step}</span>
            </div>

            <div
              className={`h-1 rounded-full ${
                active ? "bg-primary" : "bg-muted"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}