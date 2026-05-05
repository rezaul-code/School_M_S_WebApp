import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getStudent } from "@/lib/api/students";

interface Props {
  studentId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function StudentDetailDrawer({ studentId, open, onOpenChange }: Props) {
  const q = useQuery({
    queryKey: ["student-detail", studentId],
    queryFn: () => getStudent(studentId as string),
    enabled: !!studentId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Student Details</SheetTitle>
          <SheetDescription>Read-only profile</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {q.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          )}
          {q.data && (
            <dl className="divide-y divide-border rounded-md border border-border">
              <Row label="Roll Number" value={q.data.rollNumber} />
              <Row label="Name" value={`${q.data.firstName ?? ""} ${q.data.lastName ?? ""}`.trim()} />
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}