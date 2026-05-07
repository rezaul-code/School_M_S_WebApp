import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap, Users, BookOpen, Layers,
  ListTree, UserPlus,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import StatCard from "../components/dashboard/StatCard";
import FormOptionsDialog from "../components/dashboard/FormOptionsDialog";
import AdmitStudentDrawer from "../components/students/AdmitStudentDrawer";

import { listStudents } from "../lib/api/students";
import { listTeachers } from "../lib/api/teachers";
import { listSubjects } from "../lib/api/subjects";
import { listClassSections, listAcademicYears } from "../lib/api/master";

const PRIMARY = "hsl(244 75% 59%)";
const PRIMARY_LIGHT = "hsl(244 90% 75%)";
const SUCCESS = "hsl(145 63% 42%)";
const DESTRUCTIVE = "hsl(0 75% 55%)";
const GRID = "hsl(220 13% 91%)";
const AXIS = "hsl(220 9% 46%)";

export default function Dashboard() {
  const [openFormOptions, setOpenFormOptions] = useState(false);
  const [openAdmitStudent, setOpenAdmitStudent] = useState(false);
  
  const studentsQ = useQuery({
    queryKey: ["dashboard", "students"],
    queryFn: () => listStudents({ page: 0, size: 200 }),
  });
  const teachersQ = useQuery({
    queryKey: ["dashboard", "teachers"],
    queryFn: () => listTeachers({ page: 0, size: 200 }),
  });
  const subjectsQ = useQuery({ queryKey: ["dashboard", "subjects"], queryFn: listSubjects });
  const sectionsQ = useQuery({ queryKey: ["dashboard", "class-sections"], queryFn: listClassSections });
  const yearsQ = useQuery({ queryKey: ["dashboard", "academic-years"], queryFn: listAcademicYears });

  const students = studentsQ.data?.content ?? [];
  const teachers = teachersQ.data?.content ?? [];

  const studentsPerSection = useMemo(() => {
    const sections = sectionsQ.data ?? [];
    if (sections.length) {
      return sections.map((s) => ({
        name: `${s.className?.replace("CLASS_", "C")}-${s.sectionName ?? ""}`,
        students: s.studentCount ?? students.filter((st) => st.classSectionId === s.id).length,
      }));
    }
    const map = new Map<string, number>();
    students.forEach((s) => {
      const key = s.classSectionName || "Unassigned";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, students]) => ({ name, students }));
  }, [sectionsQ.data, students]);

  const admissionsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      if (!s.admissionDate) return;
      const d = new Date(s.admissionDate);
      if (isNaN(d.getTime())) return;
      const key = format(d, "MMM yyyy");
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    const arr = Array.from(map.entries()).map(([month, admissions]) => ({ month, admissions }));
    arr.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    return arr;
  }, [students]);

  const teacherStatus = useMemo(() => {
    const active = teachers.filter((t) => t.active).length;
    const inactive = teachers.length - active;
    return [
      { name: "Active", value: active, color: SUCCESS },
      { name: "Inactive", value: inactive, color: DESTRUCTIVE },
    ];
  }, [teachers]);

  const yearEnrollment = useMemo(() => {
    const years = yearsQ.data ?? [];
    if (years.length) {
      return years.map((y) => ({
        year: y.name,
        students: y.studentCount ?? students.filter((s) => s.academicYearId === y.id).length,
      }));
    }
    const map = new Map<string, number>();
    students.forEach((s) => {
      const key = s.academicYearName || "—";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([year, students]) => ({ year, students }));
  }, [yearsQ.data, students]);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={studentsQ.data?.totalElements ?? students.length} icon={GraduationCap} loading={studentsQ.isLoading} accent="primary" />
        <StatCard label="Total Teachers" value={teachersQ.data?.totalElements ?? teachers.length} icon={Users} loading={teachersQ.isLoading} accent="success" />
        <StatCard label="Total Subjects" value={subjectsQ.data?.length} icon={BookOpen} loading={subjectsQ.isLoading} accent="warning" />
        <StatCard label="Class Sections" value={sectionsQ.data?.length} icon={Layers} loading={sectionsQ.isLoading} accent="primary" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Students per Class Section">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={studentsPerSection}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" stroke={AXIS} fontSize={12} />
              <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(244 90% 96%)" }} />
              <Bar dataKey="students" fill={PRIMARY} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Student Admissions over Time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={admissionsByMonth}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="month" stroke={AXIS} fontSize={12} />
              <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="admissions" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 3, fill: PRIMARY }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active vs Inactive Teachers">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={teacherStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {teacherStatus.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Enrollment by Academic Year">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={yearEnrollment}>
              <defs>
                <linearGradient id="enrollFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="year" stroke={AXIS} fontSize={12} />
              <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="students" stroke={PRIMARY} strokeWidth={2.5} fill="url(#enrollFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Actions (Academic and Class section buttons removed from here and moved to their dedicated pages) */}
      <Card className="p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="h-auto justify-start gap-3 py-4 text-left min-w-[200px]"
            onClick={() => setOpenFormOptions(true)}
          >
            <ListTree className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Form Options</span>
          </Button>
          <Button
            variant="default"
            className="h-auto justify-start gap-3 py-4 text-left min-w-[200px]"
            onClick={() => setOpenAdmitStudent(true)}
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Admit Student</span>
          </Button>
        </div>

        <FormOptionsDialog open={openFormOptions} onOpenChange={setOpenFormOptions} />
        <AdmitStudentDrawer open={openAdmitStudent} onOpenChange={setOpenAdmitStudent} />
      </Card>
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(220 13% 91%)",
  borderRadius: 8,
  fontSize: 12,
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </Card>
  );
}