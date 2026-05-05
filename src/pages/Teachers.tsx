import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, Eye, Pencil } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { listTeachers } from "@/lib/api/teachers";
import { useDebounce } from "@/hooks/useDebounce";
import LoadingTable from "@/components/common/LoadingTable";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import RegisterTeacherDialog from "@/components/teachers/RegisterTeacherDialog";
import TeacherDetailDrawer from "@/components/teachers/TeacherDetailDrawer";
import EditTeacherDialog from "@/components/teachers/EditTeacherDialog";
import type { Teacher } from "@/types/api";

export default function Teachers() {
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(() => ({
    page,
    size: 20,
    search: debouncedSearch || undefined,
    active: activeOnly ? true : undefined,
  }), [page, debouncedSearch, activeOnly]);

  const q = useQuery({
    queryKey: ["teachers", params],
    queryFn: () => listTeachers(params),
    placeholderData: (prev) => prev,
  });

  const data = q.data?.content ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search teachers..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
              <Switch
                id="active-only"
                checked={activeOnly}
                onCheckedChange={(v) => { setActiveOnly(v); setPage(0); }}
              />
              <Label htmlFor="active-only" className="text-sm">Active only</Label>
            </div>
            <RegisterTeacherDialog
              trigger={<Button className="gap-2"><UserPlus className="h-4 w-4" /> Register Teacher</Button>}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {q.isLoading ? (
          <LoadingTable cols={6} />
        ) : data.length === 0 ? (
          <EmptyState
            title="No teachers found"
            description="Register your first teacher to get started."
            action={
              <RegisterTeacherDialog
                trigger={<Button className="gap-2"><UserPlus className="h-4 w-4" /> Register Teacher</Button>}
              />
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((t) => (
                    <TableRow key={t.id}>
<TableCell className="font-medium">{t.fullName || `${t.firstName} ${t.lastName}`}</TableCell>
                      <TableCell className="text-muted-foreground">{t.email}</TableCell>
                      <TableCell>{t.phone || "—"}</TableCell>
                      <TableCell>{t.joiningDate || "—"}</TableCell>
                      <TableCell>
                        {t.active ? (
                          <Badge className="bg-success-soft text-success hover:bg-success-soft">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewId(t.id)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditTarget(t)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination
              page={q.data?.number ?? page}
              totalPages={q.data?.totalPages ?? 1}
              onChange={setPage}
            />
          </>
        )}
      </Card>

      <TeacherDetailDrawer teacherId={viewId} open={!!viewId} onOpenChange={(o) => !o && setViewId(null)} />
      <EditTeacherDialog teacher={editTarget} open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} />
    </div>
  );
}
