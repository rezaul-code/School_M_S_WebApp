// src/components/teachers/TeacherDetailDrawer.tsx

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { getTeacher, getTeacherAssignments } from "@/lib/api/teachers";

import "@/styles/teacher.css";

interface Props {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className={`tm-detail-item${!value ? " tm-detail-item--empty" : ""}`}>
      <span className="tm-detail-label">{label}</span>
      <span className={`tm-detail-value${!value ? " tm-detail-value--empty" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function TeacherDetailDrawer({ teacherId, open, onOpenChange }: Props) {
  const teacherQuery = useQuery({
    queryKey: ["teacher", teacherId],
    enabled: !!teacherId,
    queryFn: () => getTeacher(teacherId as string),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-assignments-drawer", teacherId],
    enabled: !!teacherId,
    queryFn: () => getTeacherAssignments(teacherId as string),
  });

  const teacher = teacherQuery.data;
  const assignments = assignmentsQuery.data || [];

  const displayName =
    teacher?.fullName ||
    `${teacher?.firstName || ""} ${teacher?.lastName || ""}`.trim();

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{displayName || "Teacher Details"}</SheetTitle>
          <SheetDescription>{teacher?.email}</SheetDescription>
        </SheetHeader>

        {teacherQuery.isLoading ? (
          <div className="tm-drawer-body">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="tm-skel" style={{ height: "2.5rem" }} />
            ))}
          </div>
        ) : teacher ? (
          <div className="tm-drawer-body">
            {/* STATUS + AVATAR */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div className="tm-avatar" style={{ width: "3rem", height: "3rem", fontSize: "1rem" }}>
                {initials || "T"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "hsl(var(--foreground))" }}>
                  {displayName}
                </div>
                <div style={{ marginTop: "0.25rem" }}>
                  {teacher.active ? (
                    <Badge className="tm-badge-active">Active</Badge>
                  ) : (
                    <Badge className="tm-badge-inactive">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* PERSONAL */}
            <div>
              <div className="tm-drawer-section-title">Personal</div>
              <div className="tm-detail-grid">
                <DetailItem label="First Name" value={teacher.firstName} />
                <DetailItem label="Last Name" value={teacher.lastName} />
                <DetailItem label="Date of Birth" value={teacher.dateOfBirth} />
                <DetailItem label="Joining Date" value={teacher.joiningDate} />
                <DetailItem label="Gender"      value={teacher.gender} />
                <DetailItem label="Religion"    value={teacher.religion} />
                <DetailItem label="Blood Group" value={teacher.bloodGroup} />
              </div>
            </div>

            {/* CONTACT */}
            <div>
              <div className="tm-drawer-section-title">Contact</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <DetailItem label="Email" value={teacher.email} />
                <DetailItem label="Phone" value={teacher.phone} />
                <DetailItem label="Address" value={teacher.address} />
              </div>
            </div>

            {/* ASSIGNMENTS */}
            <div>
              <div className="tm-drawer-section-title">
                Subject Assignments ({assignments.length})
              </div>

              {assignmentsQuery.isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="tm-skel" style={{ height: "3rem" }} />
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <div className="tm-empty" style={{ padding: "1.5rem", margin: 0 }}>
                  <p className="tm-empty-title">No subjects assigned</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="tm-assign-pill">
                      <div>
                        <div className="tm-assign-pill-title">
                          <Badge className="tm-badge-subject">{assignment.subjectCode}</Badge>
                          <span>{assignment.subjectName}</span>
                        </div>
                        <p className="tm-assign-pill-sub">
                          {assignment.className}
                          {assignment.classSectionName ? ` • ${assignment.classSectionName}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
            Teacher not found
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}