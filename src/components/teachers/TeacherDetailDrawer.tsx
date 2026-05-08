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

interface Props {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export default function TeacherDetailDrawer({
  teacherId,
  open,
  onOpenChange,
}: Props) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{displayName || "Teacher Details"}</SheetTitle>
          <SheetDescription>{teacher?.email}</SheetDescription>
        </SheetHeader>

        {teacherQuery.isLoading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : teacher ? (
          <div className="mt-6 space-y-6">
            {/* STATUS */}
            <div className="flex items-center gap-2">
              {teacher.active ? (
                <Badge>Active</Badge>
              ) : (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>

            {/* PERSONAL */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Personal
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <DetailRow
                  label="First Name"
                  value={teacher.firstName}
                />
                <DetailRow
                  label="Last Name"
                  value={teacher.lastName}
                />
                <DetailRow
                  label="Date of Birth"
                  value={teacher.dateOfBirth}
                />
                <DetailRow
                  label="Joining Date"
                  value={teacher.joiningDate}
                />
              </div>
            </div>

            {/* CONTACT */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </h3>

              <div className="space-y-3">
                <DetailRow label="Email" value={teacher.email} />
                <DetailRow label="Phone" value={teacher.phone} />
                <DetailRow label="Address" value={teacher.address} />
              </div>
            </div>

            {/* ASSIGNMENTS */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject Assignments ({assignments.length})
              </h3>

              {assignmentsQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 rounded-md bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No subjects assigned
                </p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-start justify-between rounded-md border p-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {assignment.subjectCode}
                          </Badge>
                          <span className="text-sm font-medium">
                            {assignment.subjectName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {assignment.className}
                          {assignment.classSectionName
                            ? ` • ${assignment.classSectionName}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Teacher not found
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}