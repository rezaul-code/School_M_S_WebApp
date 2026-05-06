import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import {
  GraduationCap,
  MoreHorizontal,
  Search,
  RotateCcw,
} from "lucide-react";

import { listStudents } from "@/lib/api/students";

import type { Student } from "@/types/api";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Pagination from "@/components/common/Pagination";

import StudentDetailDrawer from "@/components/students/StudentDetailDrawer";
import FeeSummaryDrawer from "@/components/students/FeeSummaryDrawer";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function Students() {

  const [page, setPage] = useState(0);

  const [search, setSearch] = useState("");

  // Filters (restored)
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);


  const [feeSummaryStudentId, setFeeSummaryStudentId] =
    useState<string | null>(null);

  const [openFeeSummary, setOpenFeeSummary] =
    useState(false);


  const studentsQuery = useQuery({
    queryKey: [
      "students",
      page,
      search,
      selectedClass,
      selectedSection,
      selectedStatus,
    ],

    queryFn: () =>
      listStudents({
        page,
        size: 10,
        search: search || undefined,
        classSectionId: selectedSection || undefined,
      }),

    placeholderData: (previousData) => previousData,
  });


  const students =
    studentsQuery.data?.content ?? [];

  const totalElements = studentsQuery.data?.totalElements ?? 0;

  const filteredStudents = useMemo(() => {
    // API only supports classSectionId + search. Keep previous UI filter behavior by applying the remaining filters client-side.
    return students.filter((s) => {
      // Student list data does not include className, only classSectionId/classSectionName.
      const matchesClass = !selectedClass || selectedClass === "";
      const matchesSection = !selectedSection ||
        (s.classSectionId ?? "").toString() === selectedSection;
      const matchesStatus = !selectedStatus ||
        (s.admissionDate ? "admitted" : "pending") ===
          selectedStatus;
      return matchesClass && matchesSection && matchesStatus;
    });

  }, [students, selectedClass, selectedSection, selectedStatus]);


  const totalPages = Math.ceil(
    totalElements / 10
  );



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Students
            </CardTitle>

            <CardDescription>
              Manage student admissions,
              details and records.
            </CardDescription>
          </div>



        </CardHeader>

        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search students..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Student
                  </TableHead>

                  <TableHead>
                    Email
                  </TableHead>

                  <TableHead>
                    Roll #
                  </TableHead>

                  <TableHead>
                    Section
                  </TableHead>

                  <TableHead>
                    Admitted
                  </TableHead>

                  <TableHead className="w-[60px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {studentsQuery.isLoading ? (

                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center"
                    >
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center"
                    >
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow
                      key={student.id}
                    >
                      <TableCell className="font-medium">
                        {student.fullName}

                        {student.phone && (
                          <p className="text-xs text-muted-foreground">
                            {student.phone}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        {student.email}
                      </TableCell>

                      <TableCell>
                        {student.rollNumber}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {student.classSectionName ??
                            "Unassigned"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {student.admissionDate
                          ? format(
                              new Date(
                                student.admissionDate
                              ),
                              "MMM dd, yyyy"
                            )
                          : "—"}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Student actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() =>
                                setSelectedStudent(student)
                              }
                            >
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
onSelect={() => {
                                setFeeSummaryStudentId(student.id);
                                setOpenFeeSummary(true);
                              }}
                            >
                              Fee Summary
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Total Students:{" "}
                {totalElements}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>



      <StudentDetailDrawer
        studentId={selectedStudent?.id ?? ""}
        open={!!selectedStudent}
        onOpenChange={() =>
          setSelectedStudent(null)
        }
      />

      <FeeSummaryDrawer
        studentId={feeSummaryStudentId}
        open={openFeeSummary}
        onOpenChange={(v) => {
          setOpenFeeSummary(v);
          if (!v) setFeeSummaryStudentId(null);
        }}
        academicYearId={1}
      />
    </div>
  );
}

