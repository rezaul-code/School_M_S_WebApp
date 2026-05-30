// src/pages/Dashboard.tsx

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap, Users, BookOpen, Layers,
  BarChart2, TrendingUp, PieChart as PieIcon, Activity,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

import StatCard from "../components/dashboard/StatCard";

import { listStudents } from "../lib/api/students";
import { listTeachers } from "../lib/api/teachers";
import { listSubjects } from "../lib/api/subjects";
import { listClassSections, listAcademicYears } from "../lib/api/master";
import { api } from "../lib/api/client"; // Needed for our direct backend call

import "@/styles/dashboard.css";

const PRIMARY     = "hsl(244 75% 59%)";
const SUCCESS     = "hsl(145 63% 42%)";
const DESTRUCTIVE = "hsl(0 75% 55%)";
const GRID        = "hsl(220 13% 91%)";
const AXIS        = "hsl(220 9% 46%)";

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(220 13% 91%)",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 16px hsl(0 0% 0% / 0.08)",
};

export default function Dashboard() {
  // Existing data queries
  const studentsQ = useQuery({
    queryKey: ["dashboard", "students"],
    queryFn: () => listStudents({ page: 0, size: 200 }),
  });
  const teachersQ = useQuery({
    queryKey: ["dashboard", "teachers"],
    queryFn: () => listTeachers({ page: 0, size: 200 }),
  });
  const subjectsQ = useQuery({
    queryKey: ["dashboard", "subjects"],
    queryFn: listSubjects,
  });
  const sectionsQ = useQuery({
    queryKey: ["dashboard", "class-sections"],
    queryFn: listClassSections,
  });
  const yearsQ = useQuery({
    queryKey: ["dashboard", "academic-years"],
    queryFn: listAcademicYears,
  });

  // =========================================================================
  // PRODUCTION GRADE: Fetch pre-calculated chart data directly from backend
  // =========================================================================
  const { data: studentsPerClassLevel = [], isLoading: isLoadingClassChart } = useQuery({
    queryKey: ["dashboard", "classPopulation"],
    queryFn: async () => {
      // Ensure this endpoint matches the Controller route you created
      const res = await api.get("/api/admin/dashboard/class-population"); 
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    }
  });

  const students = studentsQ.data?.content ?? [];
  const teachers = teachersQ.data?.content ?? [];

  // Keep other calculations local for now
  const admissionsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s: any) => {
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
    const active = teachers.filter((t: any) => t.active).length;
    const inactive = teachers.length - active;
    return [
      { name: "Active", value: active, color: SUCCESS },
      { name: "Inactive", value: inactive, color: DESTRUCTIVE },
    ];
  }, [teachers]);

  const yearEnrollment = useMemo(() => {
    const years = yearsQ.data ?? [];
    if (years.length) {
      return years.map((y: any) => ({
        year: y.name,
        students: y.studentCount ?? students.filter((s: any) => s.academicYearId === y.id).length,
      }));
    }
    const map = new Map<string, number>();
    students.forEach((s: any) => {
      const key = s.academicYearName || "—";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([year, students]) => ({ year, students }));
  }, [yearsQ.data, students]);

  return (
    <div className="db-page" style={{ paddingTop: 0 }}>

      {/* Stat Cards */}
      <div className="db-stats-grid">
        <StatCard
          label="Total Students"
          value={studentsQ.data?.totalElements ?? students.length}
          icon={GraduationCap}
          loading={studentsQ.isLoading}
          accent="success"
        />
        <StatCard
          label="Total Teachers"
          value={teachersQ.data?.totalElements ?? teachers.length}
          icon={Users}
          loading={teachersQ.isLoading}
          accent="primary"
        />
        <StatCard
          label="Total Subjects"
          value={subjectsQ.data?.length}
          icon={BookOpen}
          loading={subjectsQ.isLoading}
          accent="warning"
        />
        <StatCard
          label="Class Sections"
          value={sectionsQ.data?.length}
          icon={Layers}
          loading={sectionsQ.isLoading}
          accent="destructive"
        />
      </div>

      {/* Charts */}
      <div>
        <div className="db-section-header">
          <h2 className="db-section-title">
            Analytics Overview
            <span className="db-section-subtitle">Charts & distributions</span>
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">

          {/* BACKEND-DRIVEN CHART */}
          <ChartCard 
            title="Students per Class Level" 
            icon={<BarChart2 />} 
            loading={isLoadingClassChart}
          >
            <ResponsiveContainer width="100%" height={248}>
              <BarChart data={studentsPerClassLevel}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" stroke={AXIS} fontSize={11} />
                <YAxis stroke={AXIS} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(244 90% 96%)" }} />
                <Bar dataKey="students" fill={PRIMARY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Student Admissions over Time" icon={<TrendingUp />}>
            <ResponsiveContainer width="100%" height={248}>
              <LineChart data={admissionsByMonth}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="month" stroke={AXIS} fontSize={11} />
                <YAxis stroke={AXIS} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="admissions"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: PRIMARY }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Active vs Inactive Teachers" icon={<PieIcon />}>
            <ResponsiveContainer width="100%" height={248}>
              <PieChart>
                <Pie
                  data={teacherStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {teacherStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Enrollment by Academic Year" icon={<Activity />}>
            <ResponsiveContainer width="100%" height={248}>
              <AreaChart data={yearEnrollment}>
                <defs>
                  <linearGradient id="enrollFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="year" stroke={AXIS} fontSize={11} />
                <YAxis stroke={AXIS} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#enrollFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>

    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
  loading = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="db-chart-card">
      <div className="db-chart-card-header">
        <span className="db-chart-card-title">{title}</span>
        {icon && <span className="db-chart-card-icon">{icon}</span>}
      </div>
      <div className="db-chart-body relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <span className="text-sm text-slate-500 animate-pulse">Loading data...</span>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}