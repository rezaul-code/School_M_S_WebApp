import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function StudentInfoStep({
  state,
  setState,
}: any) {
  const info = state.studentInfo;

  const updateField = (
    key: string,
    value: string
  ) => {
    setState((prev: any) => ({
      ...prev,

      studentInfo: {
        ...prev.studentInfo,
        [key]: value,
      },
    }));
  };

  return (
    <Card className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">
          Student Information
        </h2>

        <p className="text-sm text-muted-foreground">
          Enter student and guardian details.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="First Name *">
          <Input
            value={info.firstName}
            onChange={(e) =>
              updateField("firstName", e.target.value)
            }
          />
        </Field>

        <Field label="Last Name *">
          <Input
            value={info.lastName}
            onChange={(e) =>
              updateField("lastName", e.target.value)
            }
          />
        </Field>

        <Field label="Email *">
          <Input
            type="email"
            value={info.email}
            onChange={(e) =>
              updateField("email", e.target.value)
            }
          />
        </Field>

        <Field label="Password *">
          <Input
            type="password"
            value={info.password}
            onChange={(e) =>
              updateField("password", e.target.value)
            }
          />
        </Field>

        <Field label="Roll Number">
          <Input
            value={info.rollNumber}
            onChange={(e) =>
              updateField("rollNumber", e.target.value)
            }
          />
        </Field>

        <Field label="Phone">
          <Input
            value={info.phone}
            onChange={(e) =>
              updateField("phone", e.target.value)
            }
          />
        </Field>

        <Field label="Date of Birth">
          <Input
            type="date"
            value={info.dateOfBirth}
            onChange={(e) =>
              updateField("dateOfBirth", e.target.value)
            }
          />
        </Field>

        <Field label="Guardian Name">
          <Input
            value={info.guardianName}
            onChange={(e) =>
              updateField("guardianName", e.target.value)
            }
          />
        </Field>

        <Field label="Guardian Phone">
          <Input
            value={info.guardianPhone}
            onChange={(e) =>
              updateField("guardianPhone", e.target.value)
            }
          />
        </Field>

        <Field label="Transaction Reference">
          <Input
            value={info.transactionReference}
            onChange={(e) =>
              updateField(
                "transactionReference",
                e.target.value
              )
            }
          />
        </Field>
      </div>

      <Field label="Address">
        <Textarea
          rows={4}
          value={info.address}
          onChange={(e) =>
            updateField("address", e.target.value)
          }
        />
      </Field>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}