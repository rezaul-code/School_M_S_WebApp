// src/pages/StudentDetails.tsx

import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Hash,
  BookOpen,
  CalendarRange,
  ClipboardList,
  Users,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

import { getStudent } from "@/lib/api/students";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PrintSingleIdCardButton } from "@/components/students/PrintSingleIdCardButton"; // <-- ADDED IMPORT

import "@/styles/student-pages.css";

// ── Helpers ─────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Profile row ──────────────────────────────────────────────────

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  return (
    <div className="sp-row">
      <dt className="sp-row-label">
        <Icon size={13} />
        {label}
      </dt>
      <dd className={value ? "sp-row-value" : "sp-row-value sp-row-value--empty"}>
        {value || "Not provided"}
      </dd>
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────

function SectionCard({
  accentClass,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  accentClass: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`sp-card ${accentClass}`}>
      <div className="sp-card-header">
        <div className="sp-card-header-icon">
          <Icon size={15} />
        </div>
        <div>
          <h2 className="sp-card-title">{title}</h2>
          {subtitle && <p className="sp-card-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="sp-card-body">
        <dl className="sp-profile">{children}</dl>
      </div>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`sp-skel ${className ?? ""}`} style={style} />;
}

function LoadingSkeleton() {
  return (
    <div className="sp-page">
      <Skeleton style={{ height: "2rem", width: "9rem", borderRadius: "0.5rem" }} />

      {/* Hero skeleton */}
      <div
        style={{
          borderRadius: "1rem",
          padding: "1.75rem 2rem",
          background: "hsl(var(--muted) / 0.5)",
          border: "1px solid hsl(var(--border))",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Skeleton style={{ width: "3.25rem", height: "3.25rem", borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Skeleton style={{ height: "1.125rem", width: "12rem" }} />
          <Skeleton style={{ height: "0.8rem", width: "8rem" }} />
        </div>
      </div>

      {/* Section skeletons */}
      {[5, 4, 2].map((rows, si) => (
        <div key={si} className="sp-card">
          <div
            className="sp-card-header"
            style={{ gap: "0.5rem" }}
          >
            <Skeleton style={{ width: "1.875rem", height: "1.875rem", borderRadius: "0.4375rem" }} />
            <Skeleton style={{ height: "0.875rem", width: "9rem" }} />
          </div>
          <div className="sp-card-body" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <div className="sp-profile">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="sp-row">
                  <dt className="sp-row-label">
                    <Skeleton style={{ height: "0.8rem", width: "6rem" }} />
                  </dt>
                  <dd className="sp-row-value">
                    <Skeleton style={{ height: "0.8rem", width: "10rem" }} />
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function StudentDetailsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["student-detail", studentId],
    queryFn: () => getStudent(studentId as string),
    enabled: !!studentId,
  });

  if (q.isLoading) return <LoadingSkeleton />;

  if (q.isError) {
    return (
      <div className="sp-page">
        <button className="sp-back" onClick={() => navigate("/students")}>
          <ArrowLeft /> Back to Students
        </button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load student</AlertTitle>
          <AlertDescription>
            {(q.error as any)?.message ??
              "Something went wrong while fetching student details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const s = q.data!;
  const fullName =
    `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.fullName || "—";

  return (
    <div className="sp-page">
      {/* Back */}
      <button className="sp-back" onClick={() => navigate("/students")}>
        <ArrowLeft /> Back to Students
      </button>

      {/* ── Hero banner ── */}
      <div className="sp-hero">
        <div className="sp-hero-glow2" />
        <div className="sp-hero-inner">
          <div className="sp-hero-left">
            <div className="sp-avatar">{getInitials(fullName)}</div>
            <div className="sp-hero-text">
              <h1 className="sp-hero-title">{fullName}</h1>
              <p className="sp-hero-sub">
                {s.rollNumber ? `Roll No. ${s.rollNumber}` : "No roll number assigned"}
                {s.classSectionName ? ` · ${s.classSectionName}` : ""}
              </p>
            </div>
          </div>

          {/* Wrapper for the print button and admission badge */}
          <div className="flex items-center gap-3">
            {/* <-- ADDED PRINT BUTTON HERE --> */}
            <PrintSingleIdCardButton studentId={s.id} />
            
            {s.admissionDate && (
              <div className="sp-hero-badge">
                <CheckCircle2 size={16} />
                Admitted
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <SectionCard
        accentClass="sp-card--indigo"
        icon={User}
        title="Personal Information"
        subtitle="Contact details and personal data"
      >
        <Row icon={User}         label="Full Name"     value={fullName} />
        <Row icon={Mail}         label="Email Address" value={s.email} />
        <Row icon={Phone}        label="Phone Number"  value={s.phone} />
        <Row icon={CalendarDays} label="Date of Birth" value={s.dateOfBirth} />
        <Row icon={MapPin}       label="Address"       value={s.address} />
      </SectionCard>

      {/* ── Academic Information ── */}
      <SectionCard
        accentClass="sp-card--blue"
        icon={GraduationCap}
        title="Academic Information"
        subtitle="Enrollment and class details"
      >
        <Row icon={Hash}          label="Roll Number"    value={s.rollNumber} />
        <Row icon={BookOpen}      label="Class Section"  value={s.classSectionName} />
        <Row icon={CalendarRange} label="Academic Year"  value={s.academicYear ?? s.academicYearName} />
        <Row icon={ClipboardList} label="Admission Date" value={s.admissionDate} />
      </SectionCard>

      {/* ── Guardian Information ── */}
      <SectionCard
        accentClass="sp-card--violet"
        icon={ShieldCheck}
        title="Guardian Information"
        subtitle="Emergency contact and guardian details"
      >
        <Row icon={Users}    label="Guardian Name"  value={s.guardianName} />
        <Row icon={PhoneCall} label="Guardian Phone" value={s.guardianPhone} />
      </SectionCard>
    </div>
  );
}