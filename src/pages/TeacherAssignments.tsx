import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
import Pagination from "@/components/common/Pagination";

import { getTeacherAssignments, listTeachers } from "@/lib/api/teachers";
import { useDebounce } from "@/hooks/useDebounce";

export default function TeacherAssignmentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

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
  });

  const teachers = teachersQuery.data?.content || [];

  // Fetch assignments for each teacher on the current page
  const assignmentsQuery = useQuery({
    queryKey: ["teacher-assignments-page", teachers.map((t) => t.id)],
    enabled: teachers.length > 0,

    queryFn: async () => {
      const results = await Promise.all(
        teachers.map(async (teacher) => {
          const assignments = await getTeacherAssignments(teacher.id);

          return assignments.map((assignment) => ({
            ...assignment,
            teacherName:
              teacher.fullName ||
              `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
          }));
        })
      );

      return results.flat();
    },
  });

  const assignments = assignmentsQuery.data || [];
  const isLoading =
    teachersQuery.isLoading || assignmentsQuery.isLoading;

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Teacher Assignments</h1>
        <p className="text-sm text-muted-foreground">
          View all subject assignments across teachers
        </p>
      </div>

      {/* SEARCH */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search teacher..."
            className="pl-9"
          />
        </div>
      </Card>

      {/* TABLE */}
      <Card className="p-4">
        {isLoading ? (
          <LoadingTable cols={5} />
        ) : assignments.length === 0 ? (
          <EmptyState
            title="No assignments found"
            description="No teacher assignments available."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow
                      key={`${assignment.teacherId}-${assignment.id}`}
                    >
                      <TableCell className="font-medium">
                        {assignment.teacherName}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {assignment.subjectCode}
                          </Badge>
                          <span>{assignment.subjectName}</span>
                        </div>
                      </TableCell>

                      <TableCell>{assignment.className}</TableCell>

                      <TableCell>
                        {assignment.classSectionName || "—"}
                      </TableCell>

                      <TableCell>
                        <Badge>Active</Badge>
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
    </div>
  );
}