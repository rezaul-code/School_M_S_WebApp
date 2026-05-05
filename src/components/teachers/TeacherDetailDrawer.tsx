import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getTeacher } from "@/lib/api/teachers";

interface Props {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function TeacherDetailDrawer({ teacherId, open, onOpenChange }: Props) {
  const q = useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: () => getTeacher(teacherId as string),
    enabled: !!teacherId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Teacher Details</SheetTitle>
          <SheetDescription>Read-only profile</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {q.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          )}
          {q.data && (
            <dl className="divide-y divide-border rounded-md border border-border">
              <div className="grid grid-cols-3 gap-2 px-3 py-2.5 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="col-span-2">
                  {q.data.active ? (
                    <Badge className="bg-success-soft text-success hover:bg-success-soft">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </dd>
              </div>
<Row label="Name" value={q.data.fullName || `${q.data.firstName ?? ''} ${q.data.lastName ?? ''}`.trim()} />
              <Row label="Email" value={q.data.email} />
              <Row label="Phone" value={q.data.phone} />
              <Row label="Date of Birth" value={q.data.dateOfBirth} />
              <Row label="Address" value={q.data.address} />
              <Row label="Joining Date" value={q.data.joiningDate} />
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
