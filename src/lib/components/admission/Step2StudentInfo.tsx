import type { WizardState } from '@/pages/AdmissionWizard';

interface Step2StudentInfoProps {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
}

type StudentInfoKey = keyof WizardState['studentInfo'];

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-200">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm ' +
  'placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';

export default function Step2StudentInfo({ state, setState }: Step2StudentInfoProps) {
  const update = (key: StudentInfoKey, value: string) => {
    setState((prev) => ({
      ...prev,
      studentInfo: { ...prev.studentInfo, [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
        Student Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name" required>
          <input
            className={inputClass}
            placeholder="Emma"
            value={state.studentInfo.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
        </Field>

        <Field label="Last name" required>
          <input
            className={inputClass}
            placeholder="Watson"
            value={state.studentInfo.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
        </Field>

        <Field label="Email" required>
          <input
            type="email"
            className={inputClass}
            placeholder="emma@school.com"
            value={state.studentInfo.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </Field>

        <Field label="Password" required>
          <input
            type="password"
            className={inputClass}
            placeholder="••••••••"
            value={state.studentInfo.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </Field>

        <Field label="Roll number">
          <input
            className={inputClass}
            placeholder="2026-CS-401"
            value={state.studentInfo.rollNumber}
            onChange={(e) => update('rollNumber', e.target.value)}
          />
        </Field>

        <Field label="Phone">
          <input
            className={inputClass}
            placeholder="9876543210"
            value={state.studentInfo.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </Field>

        <Field label="Date of birth">
          <input
            type="date"
            className={inputClass}
            value={state.studentInfo.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
          />
        </Field>

        <Field label="Guardian name">
          <input
            className={inputClass}
            placeholder="David Watson"
            value={state.studentInfo.guardianName}
            onChange={(e) => update('guardianName', e.target.value)}
          />
        </Field>

        <Field label="Guardian phone">
          <input
            className={inputClass}
            placeholder="9123456789"
            value={state.studentInfo.guardianPhone}
            onChange={(e) => update('guardianPhone', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Address">
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder="789 Pine Street, Hyderabad..."
          value={state.studentInfo.address}
          onChange={(e) => update('address', e.target.value)}
        />
      </Field>

      <p className="text-xs text-gray-500">
        <span className="text-red-400">*</span> First name, last name, email, and password are required to continue.
      </p>
    </div>
  );
}