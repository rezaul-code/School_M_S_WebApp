import type { WizardState } from '@/components/students/AdmissionWizard';

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
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm ' +
  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm transition-shadow ' +
  '[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]';
  
// --- Enum Options ---
const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
  { label: "Prefer not to say", value: "PREFER_NOT_TO_SAY" }
];

const RELIGION_OPTIONS = [
  { label: "Hinduism", value: "HINDUISM" },
  { label: "Islam", value: "ISLAM" },
  { label: "Christianity", value: "CHRISTIANITY" },
  { label: "Sikhism", value: "SIKHISM" },
  { label: "Buddhism", value: "BUDDHISM" },
  { label: "Jainism", value: "JAINISM" },
  { label: "Other", value: "OTHER" },
  { label: "Not Specified", value: "NOT_SPECIFIED" }
];

const BLOOD_GROUP_OPTIONS = [
  { label: "A+", value: "A_POSITIVE" },
  { label: "A-", value: "A_NEGATIVE" },
  { label: "B+", value: "B_POSITIVE" },
  { label: "B-", value: "B_NEGATIVE" },
  { label: "O+", value: "O_POSITIVE" },
  { label: "O-", value: "O_NEGATIVE" },
  { label: "AB+", value: "AB_POSITIVE" },
  { label: "AB-", value: "AB_NEGATIVE" },
  { label: "Unknown", value: "UNKNOWN" }
];

export default function Step2StudentInfo({ state, setState }: Step2StudentInfoProps) {
  const update = (key: StudentInfoKey, value: string) => {
    setState((prev) => ({
      ...prev,
      studentInfo: { ...prev.studentInfo, [key]: value },
    }));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-gray-200 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Student Details</h2>
        <p className="text-sm text-gray-500">Enter the primary information for the new student.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

        {/* --- NEW FIELDS START HERE --- */}
        <Field label="Gender" required>
          <select
            className={`${inputClass} appearance-none cursor-pointer`}
            value={state.studentInfo.gender}
            onChange={(e) => update('gender', e.target.value)}
          >
            <option value="" disabled>Select gender</option>
            {GENDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Field>

        <Field label="Blood Group">
          <select
            className={`${inputClass} appearance-none cursor-pointer`}
            value={state.studentInfo.bloodGroup}
            onChange={(e) => update('bloodGroup', e.target.value)}
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUP_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Field>

        <Field label="Religion">
          <select
            className={`${inputClass} appearance-none cursor-pointer`}
            value={state.studentInfo.religion}
            onChange={(e) => update('religion', e.target.value)}
          >
            <option value="">Select religion</option>
            {RELIGION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Field>
        {/* --- NEW FIELDS END HERE --- */}

        <Field label="Date of birth">
          <input
            type="date"
            className={inputClass}
            value={state.studentInfo.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
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

        <Field label="Roll number">
          <input
            className={inputClass}
            placeholder="2026-CS-401"
            value={state.studentInfo.rollNumber}
            onChange={(e) => update('rollNumber', e.target.value)}
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

      <p className="text-xs text-gray-500 font-medium">
        <span className="text-red-500">*</span> Required fields to proceed.
      </p>
    </div>
  );
}