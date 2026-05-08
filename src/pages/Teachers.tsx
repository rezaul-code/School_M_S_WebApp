import { useMemo, useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Eye, Pencil, Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import LoadingTable from "@/components/common/LoadingTable";

import TeacherDetailDrawer from "@/components/teachers/TeacherDetailDrawer";
import EditTeacherDialog from "@/components/teachers/EditTeacherDialog";

import {
  deactivateTeacher,
  listTeachers,
  reactivateTeacher,
} from "@/lib/api/teachers";

import { getApiErrorMessage } from "@/lib/api/client";
import { useDebounce } from "@/hooks/useDebounce";

import type { Teacher } from "@/types/api";

export default function TeachersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page,
      size: 20,
      search: debouncedSearch || undefined,
    }),
    [page, debouncedSearch]
  );

  const teachersQuery = useQuery({
    queryKey: ["teachers", params],
    queryFn: () => listTeachers(params),
    placeholderData: (prev) => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: async (teacher: Teacher) => {
      if (teacher.active) {
        return deactivateTeacher(teacher.id);
      }
      return reactivateTeacher(teacher.id);
    },

    onSuccess: () => {
      toast.success("Teacher status updated");
      qc.invalidateQueries({ queryKey: ["teachers"] });
    },

    onError: (err) => {
      toast.error(
        getApiErrorMessage(err, "Failed to update teacher status")
      );
    },
  });

  const teachers = teachersQuery.data?.content || [];

  const getDisplayName = (teacher: Teacher) =>
    teacher.fullName ||
    `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Teacher List</h1>
        <p className="text-sm text-muted-foreground">
          Manage all registered teachers
        </p>
      </div>

      {/* FILTERS */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or email..."
              className="pl-9"
            />
          </div>

          <Button
            className="gap-2"
            onClick={() => navigate("/teachers/register")}
          >
            <UserPlus className="h-4 w-4" />
            Register Teacher
          </Button>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="p-4">
        {teachersQuery.isLoading ? (
          <LoadingTable cols={6} />
        ) : teachers.length === 0 ? (
          <EmptyState
            title="No teachers found"
            description="Register your first teacher."
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
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {getDisplayName(teacher)}
                      </TableCell>

                      <TableCell>{teacher.email}</TableCell>

                      <TableCell>{teacher.phone || "—"}</TableCell>

                      <TableCell>{teacher.joiningDate || "—"}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={teacher.active}
                            disabled={toggleMutation.isPending}
                            onCheckedChange={() =>
                              toggleMutation.mutate(teacher)
                            }
                          />
                          {teacher.active ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewId(teacher.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditTeacher(teacher)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination
              page={teachersQuery.data?.number ?? page}
              totalPages={teachersQuery.data?.totalPages ?? 1}
              onChange={setPage}
            />
          </>
        )}
      </Card>

      {/* DRAWERS / DIALOGS */}
      <TeacherDetailDrawer
        teacherId={viewId}
        open={!!viewId}
        onOpenChange={(o) => {
          if (!o) setViewId(null);
        }}
      />

      <EditTeacherDialog
        teacher={editTeacher}
        open={!!editTeacher}
        onOpenChange={(o) => {
          if (!o) setEditTeacher(null);
        }}
      />
    </div>
  );
}