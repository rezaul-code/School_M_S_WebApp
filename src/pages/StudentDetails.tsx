// src/pages/StudentDetails.tsx

import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap } from "lucide-react";

import { getStudent } from "@/lib/api/students";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

export default function StudentDetailsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["student-detail", studentId],
    queryFn: () => getStudent(studentId as string),
    enabled: !!studentId,
  });

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/students")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <GraduationCap className="h-6 w-6 text-muted-foreground" />
          <div className="space-y-1">
            <CardTitle>Student Details</CardTitle>
            <CardDescription>Read-only student profile</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading state */}
          {q.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {/* Error state */}
          {q.isError && (
            <Alert variant="destructive">
              <AlertTitle>Failed to load student</AlertTitle>
              <AlertDescription>
                {(q.error as any)?.message ??
                  "Something went wrong while fetching student details."}
              </AlertDescription>
            </Alert>
          )}

          {/* Data */}
          {q.data && (
            <dl className="divide-y divide-border rounded-md border border-border">
              <Row label="Roll Number" value={q.data.rollNumber} />
              <Row
                label="Name"
                value={`${q.data.firstName ?? ""} ${q.data.lastName ?? ""}`.trim() || q.data.fullName}
              />
              <Row label="Email" value={q.data.email} />
              <Row label="Phone" value={q.data.phone} />
              <Row label="Date of Birth" value={q.data.dateOfBirth} />
              <Row label="Address" value={q.data.address} />
              <Row label="Guardian" value={q.data.guardianName} />
              <Row label="Guardian Phone" value={q.data.guardianPhone} />
              <Row label="Class Section" value={q.data.classSectionName} />
              <Row label="Academic Year" value={q.data.academicYear} />
              <Row label="Admission Date" value={q.data.admissionDate} />
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}