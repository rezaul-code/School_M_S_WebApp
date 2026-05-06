import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import Pagination from "@/components/common/Pagination";
import { Search, MoreHorizontal } from "lucide-react";
import { listStudents } from "@/lib/api/students";
import AdmitStudentDrawer from "@/components/students/AdmitStudentDrawer";
import StudentDetailDrawer from "@/components/students/StudentDetailDrawer";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  phone?: string;
  admissionDate?: string;
  classSectionName?: string;
  academicYearName?: string;
}

export default function Students() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [openAdmit, setOpenAdmit] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const studentsQuery = useQuery({
    queryKey: ["students", { page, search }],
    queryFn: () => listStudents({ page, size: 10, search: search || undefined }),
    keepPreviousData: true,
  });

  const totalPages = Math.ceil((studentsQuery.data?.totalElements ?? 0) / 10);

  return (
    <div className="space-y-6 p-1">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Students
            </CardTitle>
            <CardDescription>
              Manage student admissions, details, and records.
            </CardDescription>
          </div>
          <Button onClick={() => setOpenAdmit(true)}>
            Admit New Student
          </Button>
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
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roll #</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Admitted</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : studentsQuery.data?.content?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No students found. <Button variant="link" onClick={() => setOpenAdmit(true)} className="h-4 p-0">Admit first student</Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  studentsQuery.data?.content?.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                        {student.phone && (
                          <p className="text-xs text-muted-foreground">{student.phone}</p>
                        )}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.classSectionName ?? "Unassigned"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.admissionDate 
                          ? format(new Date(student.admissionDate), "MMM dd, yyyy") 
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-0 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {studentsQuery.data?.totalElements ?? 0} students
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <AdmitStudentDrawer open={openAdmit} onOpenChange={setOpenAdmit} />
      <StudentDetailDrawer 
        studentId={selectedStudent?.id ?? ""} 
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)} 
      />
    </div>
  );
}
