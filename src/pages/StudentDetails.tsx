// src/pages/StudentDetails.tsx

import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import { getStudent } from "@/lib/api/students";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import "@/styles/student-pages.css";

// ── Helpers ────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Sub-components ─────────────────────────────────────────

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="sp-profile-row">
      <dt className="sp-profile-dt">{label}</dt>
      <dd className={value ? "sp-profile-dd" : "sp-profile-dd sp-profile-dd--empty"}>
        {value || "—"}
      </dd>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sp-section">
      <div className="sp-section-header">
        <Icon size={15} />
        <h2 className="sp-section-header-title">{title}</h2>
      </div>
      <div className="sp-section-body">{children}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="sp-page">
      <Skeleton className="h-8 w-36 rounded-md" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="sp-section">
        <div className="sp-section-header" style={{ gap: "0.5rem" }}>
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="sp-section-body" style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="sp-section">
        <div className="sp-section-header" style={{ gap: "0.5rem" }}>
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="sp-section-body" style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

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
        <button className="sp-back-btn" onClick={() => navigate("/students")}>
          <ArrowLeft size={14} /> Back to Students
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
      {/* Back nav */}
      <button className="sp-back-btn" onClick={() => navigate("/students")}>
        <ArrowLeft size={14} /> Back to Students
      </button>

      {/* Hero banner */}
      <div className="sp-hero">
        <div className="sp-hero-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div className="sp-avatar">{getInitials(fullName)}</div>
            <div className="sp-hero-text">
              <h1 className="sp-hero-title">{fullName}</h1>
              <p className="sp-hero-subtitle">
                {s.rollNumber ? `Roll No. ${s.rollNumber}` : "No roll number"}
                {s.classSectionName ? ` · ${s.classSectionName}` : ""}
              </p>
            </div>
          </div>

          {s.admissionDate && (
            <Badge
              variant="outline"
              style={{
                background: "hsl(0 0% 100% / 0.1)",
                border: "1px solid hsl(0 0% 100% / 0.18)",
                color: "hsl(0 0% 100% / 0.8)",
                fontSize: "0.71rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                alignSelf: "flex-start",
              }}
            >
              ADMITTED
            </Badge>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <Section icon={User} title="Personal Information">
        <dl className="sp-profile-grid" style={{ gridTemplateColumns: "1fr" }}>
          <ProfileRow label="Full Name"     value={fullName} />
          <ProfileRow label="Email Address" value={s.email} />
          <ProfileRow label="Phone Number"  value={s.phone} />
          <ProfileRow label="Date of Birth" value={s.dateOfBirth} />
          <ProfileRow label="Address"       value={s.address} />
        </dl>
      </Section>

      {/* Academic Information */}
      <Section icon={GraduationCap} title="Academic Information">
        <dl className="sp-profile-grid" style={{ gridTemplateColumns: "1fr" }}>
          <ProfileRow label="Roll Number"   value={s.rollNumber} />
          <ProfileRow label="Class Section" value={s.classSectionName} />
          <ProfileRow label="Academic Year" value={s.academicYear ?? s.academicYearName} />
          <ProfileRow label="Admission Date" value={s.admissionDate} />
        </dl>
      </Section>

      {/* Guardian Information */}
      <Section icon={ShieldCheck} title="Guardian Information">
        <dl className="sp-profile-grid" style={{ gridTemplateColumns: "1fr" }}>
          <ProfileRow label="Guardian Name"  value={s.guardianName} />
          <ProfileRow label="Guardian Phone" value={s.guardianPhone} />
        </dl>
      </Section>
    </div>
  );
}