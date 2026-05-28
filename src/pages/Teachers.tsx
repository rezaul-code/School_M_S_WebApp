// src/pages/Teachers.tsx

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Search, UserPlus, Users, UserCheck, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

import "@/styles/teacher.css";

export default function TeachersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({ page, size: 20, search: debouncedSearch || undefined }),
    [page, debouncedSearch]
  );

  const teachersQuery = useQuery({
    queryKey: ["teachers", params],
    queryFn: () => listTeachers(params),
    placeholderData: (prev) => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: async (teacher: Teacher) => {
      if (teacher.active) return deactivateTeacher(teacher.id);
      return reactivateTeacher(teacher.id);
    },
    onSuccess: () => {
      toast.success("Teacher status updated");
      qc.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update teacher status"));
    },
  });

  const teachers = teachersQuery.data?.content || [];

  const activeCount = teachers.filter((t) => t.active).length;
  const inactiveCount = teachers.filter((t) => !t.active).length;

  const getDisplayName = (teacher: Teacher) =>
    teacher.fullName ||
    `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();

  return (
    <div className="tm-page">
      {/* HERO */}
      
     

      {/* STATS */}
      {!teachersQuery.isLoading && (
        <div className="tm-stats">
          <div className="tm-stat tm-stat--blue">
          <div className="tm-stat-icon"><Users /></div>
          <div>
            <div className="tm-stat-label">Total Teachers</div>
            <div className="tm-stat-value">{teachersQuery.data?.totalElements ?? 0}</div>
          </div>
        </div>
        <div className="tm-stat tm-stat--green">
          <div className="tm-stat-icon"><UserCheck /></div>
          <div>
            <div className="tm-stat-label">Active</div>
            <div className="tm-stat-value">{activeCount}</div>
          </div>
        </div>
        <div className="tm-stat tm-stat--amber">
          <div className="tm-stat-icon"><UserX /></div>
          <div>
            <div className="tm-stat-label">Inactive</div>
            <div className="tm-stat-value">{inactiveCount}</div>
          </div>
        </div>
          </div>
       
      )}

      {/* TOOLBAR */}
      <div className="tm-toolbar">
        <div className="tm-search-wrap">
          <Search className="search-icon" />
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name or email..."
          />
        </div>

        <button
          className="tm-btn-primary"
          onClick={() => navigate("/teachers/register")}
        >
          <UserPlus />
          Register Teacher
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="tm-card">
        {teachersQuery.isLoading ? (
          <div className="tm-card-body">
            <LoadingTable cols={6} />
          </div>
        ) : teachers.length === 0 ? (
          <div className="tm-card-body">
            <EmptyState
              title="No teachers found"
              description="Register your first teacher."
            />
          </div>
        ) : (
          <>
            <div className="tm-table-wrap">
              <Table className="tm-table">
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
                      <TableCell className="tm-name-cell">
                        {getDisplayName(teacher)}
                      </TableCell>
                      <TableCell className="tm-meta-cell">{teacher.email}</TableCell>
                      <TableCell className="tm-meta-cell">{teacher.phone || "—"}</TableCell>
                      <TableCell className="tm-meta-cell">{teacher.joiningDate || "—"}</TableCell>
                      <TableCell>
                        <div className="tm-status-cell">
                          <Switch
                            checked={teacher.active}
                            disabled={toggleMutation.isPending}
                            onCheckedChange={() => toggleMutation.mutate(teacher)}
                          />
                          {teacher.active ? (
                            <Badge className="tm-badge-active">Active</Badge>
                          ) : (
                            <Badge className="tm-badge-inactive">Inactive</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="tm-row-actions">
                          <button
                            className="tm-icon-btn"
                            onClick={() => setViewId(teacher.id)}
                            title="View details"
                          >
                            <Eye />
                          </button>
                          <button
                            className="tm-icon-btn"
                            onClick={() => setEditTeacher(teacher)}
                            title="Edit teacher"
                          >
                            <Pencil />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div style={{ padding: "0.75rem 1rem" }}>
              <Pagination
                page={teachersQuery.data?.number ?? page}
                totalPages={teachersQuery.data?.totalPages ?? 1}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* DRAWERS / DIALOGS */}
      <TeacherDetailDrawer
        teacherId={viewId}
        open={!!viewId}
        onOpenChange={(o) => { if (!o) setViewId(null); }}
      />

      <EditTeacherDialog
        teacher={editTeacher}
        open={!!editTeacher}
        onOpenChange={(o) => { if (!o) setEditTeacher(null); }}
      />
    </div>
  );
}