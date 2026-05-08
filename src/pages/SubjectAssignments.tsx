import { useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function SubjectAssignmentsPage() {
  const qc = useQueryClient();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const teachersQuery = useQuery({
    queryKey: ["teachers-subject-page", search],
    queryFn: () =>
      listTeachers({
        search,
        page: 0,
        size: 100,
      }),
  });

  const teachers = teachersQuery.data?.content || [];

  const assignmentsQuery = useQuery({
    queryKey: ["subject-assignments", selectedTeacherId],
    enabled: !!selectedTeacherId,
    queryFn: () => getTeacherAssignments(selectedTeacherId as string),
  });

  const removeMutation = useMutation({
    mutationFn: ({
      teacherId,
      assignmentId,
    }: {
      teacherId: string;
      assignmentId: number;
    }) => removeTeacherAssignment(teacherId, assignmentId),

    onSuccess: () => {
      toast.success("Assignment removed");
      qc.invalidateQueries({
        queryKey: ["subject-assignments", selectedTeacherId],
      });
    },

    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to remove assignment"));
    },
  });

  const selectedTeacherData = teachers.find((t) => t.id === selectedTeacherId);

  const selectedTeacherName =
    selectedTeacherData?.fullName ||
    `${selectedTeacherData?.firstName || ""} ${selectedTeacherData?.lastName || ""}`.trim();

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Subject Assignments</h1>
        <p className="text-sm text-muted-foreground">
          Select a teacher and manage their subject assignments
        </p>
      </div>

      {/* SEARCH */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher..."
            className="pl-9"
          />
        </div>
      </Card>

      {/* TEACHERS TABLE */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Select Teacher</h2>

        {teachersQuery.isLoading ? (
          <LoadingTable cols={3} />
        ) : teachers.length === 0 ? (
          <EmptyState
            title="No teachers found"
            description="No teachers available"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {teacher.fullName ||
                        `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()}
                    </TableCell>

                    <TableCell>{teacher.email}</TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant={
                          selectedTeacherId === teacher.id
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedTeacherId(teacher.id)}
                      >
                        {selectedTeacherId === teacher.id
                          ? "Selected"
                          : "Select"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ASSIGNMENTS PANEL */}
      {selectedTeacherId && (
        <Card className="p-4 space-y-4">
          {/* Panel header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Assignments</h2>
              <p className="text-sm text-muted-foreground">
                {selectedTeacherName}
              </p>
            </div>

            <Button onClick={() => setAssignDialogOpen(true)}>
              Assign Subject
            </Button>
          </div>

          {/* Assignments list */}
          {assignmentsQuery.isLoading ? (
            <LoadingTable cols={4} />
          ) : !assignmentsQuery.data?.length ? (
            <EmptyState
              title="No assignments"
              description="No subjects assigned yet"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
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
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {assignment.subjectCode}
                          </Badge>
                          <span className="font-medium">
                            {assignment.subjectName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{assignment.className || "—"}</TableCell>

                      <TableCell>
                        {assignment.classSectionName || "—"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={removeMutation.isPending}
                          onClick={() =>
                            removeMutation.mutate({
                              teacherId: selectedTeacherId,
                              assignmentId: assignment.id,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* ASSIGN DIALOG - controlled externally */}
      <AssignSubjectDialog
        teacherId={selectedTeacherId ?? ""}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSuccess={() => {
          qc.invalidateQueries({
            queryKey: ["subject-assignments", selectedTeacherId],
          });
        }}
      />
    </div>
  );
}