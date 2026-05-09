// src/pages/SubjectAssignments.tsx

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import EmptyState from "@/components/common/EmptyState";
import LoadingTable from "@/components/common/LoadingTable";

import {
  getTeacherAssignments,
  listTeachers,
  removeTeacherAssignment,
} from "@/lib/api/teachers";

import { getApiErrorMessage } from "@/lib/api/client";
import AssignSubjectDialog from "@/components/teachers/AssignSubjectDialog";

import "@/styles/teacher.css";

export default function SubjectAssignmentsPage() {
  const qc = useQueryClient();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const teachersQuery = useQuery({
    queryKey: ["teachers-subject-page", search],
    queryFn: () => listTeachers({ search, page: 0, size: 100 }),
  });

  const teachers = teachersQuery.data?.content || [];

  const assignmentsQuery = useQuery({
    queryKey: ["subject-assignments", selectedTeacherId],
    enabled: !!selectedTeacherId,
    queryFn: () => getTeacherAssignments(selectedTeacherId as string),
  });

  const removeMutation = useMutation({
    mutationFn: ({ teacherId, assignmentId }: { teacherId: string; assignmentId: number }) =>
      removeTeacherAssignment(teacherId, assignmentId),
    onSuccess: () => {
      toast.success("Assignment removed");
      qc.invalidateQueries({ queryKey: ["subject-assignments", selectedTeacherId] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to remove assignment"));
    },
  });

  const selectedTeacherData = teachers.find((t) => t.id === selectedTeacherId);
  const selectedTeacherName =
    selectedTeacherData?.fullName ||
    `${selectedTeacherData?.firstName || ""} ${selectedTeacherData?.lastName || ""}`.trim();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase();

  return (
    <div className="tm-page">
      {/* HERO */}
      <div className="tm-hero">
        <div className="tm-hero-glow" />
        <div className="tm-hero-inner">
          <div className="tm-hero-left">
            <div className="tm-hero-icon-wrap">
              <BookOpen />
            </div>
            <div className="tm-hero-text">
              <h2 className="tm-hero-title">Subject Assignments</h2>
              <p className="tm-hero-sub">Select a teacher and manage their subject assignments</p>
            </div>
          </div>
          {selectedTeacherName && (
            <span className="tm-hero-badge">{selectedTeacherName}</span>
          )}
        </div>
      </div>

      {/* TWO-PANEL LAYOUT */}
      <div className="tm-split">
        {/* LEFT: Teacher Picker */}
        <div className="tm-picker-card">
          <div className="tm-card-header">
            <div>
              <p className="tm-card-title">Select Teacher</p>
              <p className="tm-card-subtitle">Choose to view assignments</p>
            </div>
          </div>

          {/* Search inside picker */}
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="tm-search-wrap" style={{ maxWidth: "100%" }}>
              <Search className="search-icon" />
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teacher..."
              />
            </div>
          </div>

          {teachersQuery.isLoading ? (
            <div style={{ padding: "1rem" }}>
              <LoadingTable cols={1} />
            </div>
          ) : teachers.length === 0 ? (
            <div style={{ padding: "1rem" }}>
              <EmptyState title="No teachers found" description="No teachers available" />
            </div>
          ) : (
            <div>
              {teachers.map((teacher) => {
                const name =
                  teacher.fullName ||
                  `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();
                const isSelected = selectedTeacherId === teacher.id;

                return (
                  <div
                    key={teacher.id}
                    className={`tm-teacher-row${isSelected ? " active" : ""}`}
                    onClick={() => setSelectedTeacherId(teacher.id)}
                  >
                    <div className="tm-avatar">{getInitials(name)}</div>
                    <div className="tm-teacher-row-info">
                      <div className="tm-teacher-row-name">{name}</div>
                      <div className="tm-teacher-row-email">{teacher.email}</div>
                    </div>
                    <button
                      className={`tm-select-btn${isSelected ? " selected" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeacherId(teacher.id);
                      }}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Assignments Panel */}
        <div>
          {!selectedTeacherId ? (
            <div className="tm-empty" style={{ marginTop: 0 }}>
              <BookOpen className="tm-empty-icon" />
              <p className="tm-empty-title">No teacher selected</p>
              <p className="tm-empty-desc">Select a teacher from the left to view and manage their subject assignments.</p>
            </div>
          ) : (
            <div className="tm-panel-card">
              <div className="tm-panel-header">
                <div>
                  <p className="tm-panel-title">Assignments</p>
                  <p className="tm-panel-teacher">{selectedTeacherName}</p>
                </div>
                <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
                  Assign Subject
                </Button>
              </div>

              {assignmentsQuery.isLoading ? (
                <div style={{ padding: "1rem" }}>
                  <LoadingTable cols={3} />
                </div>
              ) : !assignmentsQuery.data?.length ? (
                <div style={{ padding: "1rem" }}>
                  <EmptyState title="No assignments" description="No subjects assigned yet" />
                </div>
              ) : (
                <div className="tm-table-wrap">
                  <Table className="tm-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignmentsQuery.data.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="tm-assign-subject">
                              <Badge className="tm-badge-subject">
                                {assignment.subjectCode}
                              </Badge>
                              <span className="tm-assign-subject-name">
                                {assignment.subjectName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="tm-meta-cell">{assignment.className || "—"}</TableCell>
                          <TableCell className="tm-meta-cell">{assignment.classSectionName || "—"}</TableCell>
                          <TableCell>
                            <div className="tm-row-actions">
                              <button
                                className="tm-icon-btn tm-icon-btn--danger"
                                disabled={removeMutation.isPending}
                                onClick={() =>
                                  removeMutation.mutate({
                                    teacherId: selectedTeacherId,
                                    assignmentId: assignment.id,
                                  })
                                }
                                title="Remove assignment"
                              >
                                <Trash2 />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ASSIGN DIALOG */}
      <AssignSubjectDialog
        teacherId={selectedTeacherId ?? ""}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["subject-assignments", selectedTeacherId] });
        }}
      />
    </div>
  );
}