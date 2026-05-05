import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, UserPlus, Eye } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { listStudents } from "@/lib/api/students";
import { listClassSections, listAcademicYears } from "@/lib/api/master";
import { useDebounce } from "@/hooks/useDebounce";
import LoadingTable from "@/components/common/LoadingTable";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import AdmitStudentDrawer from "@/components/students/AdmitStudentDrawer";
import StudentDetailDrawer from "@/components/students/StudentDetailDrawer";

const ALL = "__all__";

export default function Students() {
  const [search, setSearch] = useState("");
  const [classSectionId, setClassSectionId] = useState<string>(ALL);
  const [academicYearId, setAcademicYearId] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const [viewId, setViewId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const sectionsQ = useQuery({ queryKey: ["class-sections"], queryFn: listClassSections });
  const yearsQ = useQuery({ queryKey: ["academic-years"], queryFn: listAcademicYears });

  const params = useMemo(
    () => ({
      page,
      size: 20,
      search: debouncedSearch || undefined,
      classSectionId: classSectionId === ALL ? undefined : classSectionId,
      academicYearId: academicYearId === ALL ? undefined : academicYearId,
    }),
    [page, debouncedSearch, classSectionId, academicYearId]
  );

  const studentsQ = useQuery({
    queryKey: ["students", params],
    queryFn: () => listStudents(params),
    placeholderData: (prev) => prev,
  });

  const clearFilters = () => {
    setSearch("");
    setClassSectionId(ALL);
    setAcademicYearId(ALL);
    setPage(0);
  };

  const data = studentsQ.data?.content ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by name, email, roll..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={classSectionId} onValueChange={(v) => { setClassSectionId(v); setPage(0); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Class Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Sections</SelectItem>
                {(sectionsQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.className?.replace("_", " ")} - {s.sectionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={academicYearId} onValueChange={(v) => { setAcademicYearId(v); setPage(0); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Academic Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Years</SelectItem>
                {(yearsQ.data ?? []).map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" /> Clear
            </Button>
            <AdmitStudentDrawer
              trigger={
                <Button className="gap-2"><UserPlus className="h-4 w-4" /> Admit Student</Button>
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {studentsQ.isLoading ? (
          <LoadingTable cols={8} />
        ) : data.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Try changing filters or admit a new student to get started."
            action={
              <AdmitStudentDrawer
                trigger={<Button className="gap-2"><UserPlus className="h-4 w-4" /> Admit Student</Button>}
              />
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Class Section</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Admission</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.rollNumber}</TableCell>
<TableCell className="font-medium">{s.fullName || `${s.firstName} ${s.lastName}`}</TableCell>
                      <TableCell className="text-muted-foreground">{s.email}</TableCell>
                      <TableCell>{s.phone || "—"}</TableCell>
                      <TableCell>
                        {s.classSectionName ||
                          (s.classSectionId ? <span className="text-muted-foreground">…</span> : "—")}
                      </TableCell>
<TableCell>{s.academicYear || s.academicYearName || "—"}</TableCell>
                      <TableCell>{s.admissionDate || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewId(s.id)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination
              page={studentsQ.data?.number ?? page}
              totalPages={studentsQ.data?.totalPages ?? 1}
              onChange={setPage}
            />
          </>
        )}
      </Card>

      <StudentDetailDrawer
        studentId={viewId}
        open={!!viewId}
        onOpenChange={(o) => !o && setViewId(null)}
      />
    </div>
  );
}
