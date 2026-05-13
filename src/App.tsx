// src/App.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import StudentsPage from "@/pages/Students";
import AdmissionWizardPage from "@/pages/AdmissionWizard";
import StudentDetailsPage from "@/pages/StudentDetails";
import StudentFeeSummaryPage from "@/pages/StudentFeeSummary";
import IdCardManagement from "@/pages/IdCardManagement"; // <-- ADDED IMPORT

// Teachers
import RegisterTeacherPage from "@/pages/RegisterTeacher";
import TeachersPage from "@/pages/Teachers";
import TeacherAssignmentsPage from "@/pages/TeacherAssignments";
import SubjectAssignmentsPage from "@/pages/SubjectAssignments";

// Master data
import Subjects from "@/pages/Subjects";
import ClassSubjectMappings from "@/pages/ClassSubjectMappings";
import FeeStructures from "@/pages/FeeStructures";
import AcademicYears from "@/pages/AcademicYears";
import ClassLevels from "@/pages/ClassLevels";
import Sections from "@/pages/Sections";
import ClassSections from "@/pages/ClassSections";

// Reporting
import FeeReport from "@/pages/FeeReport";

// Accounting
import FeeCollections from "@/pages/FeeCollections";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors />

        <BrowserRouter>
          <Routes>
            {/* PUBLIC */}
            <Route path="/login" element={<Login />} />

            {/* PROTECTED */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* DASHBOARD */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* STUDENTS — static routes before dynamic :studentId */}
              <Route path="/students"         element={<StudentsPage />} />
              <Route path="/students/admit" element={<AdmissionWizardPage />} />
              <Route path="/id-cards"       element={<IdCardManagement />} /> {/* <-- ADDED ROUTE HERE */}
              <Route path="/students/:studentId"             element={<StudentDetailsPage />} />
              <Route path="/students/:studentId/fee-summary" element={<StudentFeeSummaryPage />} />

              {/* TEACHERS */}
              <Route path="/teachers/register"            element={<RegisterTeacherPage />} />
              <Route path="/teachers"                     element={<TeachersPage />} />
              <Route path="/teachers/assignments"         element={<TeacherAssignmentsPage />} />
              <Route path="/teachers/subject-assignments" element={<SubjectAssignmentsPage />} />

              {/* MASTER DATA */}
              <Route path="/academic-years"         element={<AcademicYears />} />
              <Route path="/class-levels"           element={<ClassLevels />} />
              <Route path="/sections"               element={<Sections />} />
              <Route path="/class-sections"         element={<ClassSections />} />
              <Route path="/subjects"               element={<Subjects />} />
              <Route path="/class-subject-mappings" element={<ClassSubjectMappings />} />

              {/* FEES */}
              <Route path="/fee-structures" element={<FeeStructures />} />

              {/* REPORTING */}
              <Route path="/reports/fees" element={<FeeReport />} />

              {/* ACCOUNTING */}
              <Route path="/accounting/fee-collections" element={<FeeCollections />} />
            </Route>

            {/* FALLBACK */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}