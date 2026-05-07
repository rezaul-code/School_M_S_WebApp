import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "../src/components/ui/sonner";
import { Toaster } from "../src/components/ui/toaster";
import { TooltipProvider } from "../src/components/ui/tooltip";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Safely using relative paths to ensure flawless compilation
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/Students";
import AdmissionWizardPage from "./pages/AdmissionWizard";

import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import ClassSubjectMappings from "./pages/ClassSubjectMappings";
import FeeStructures from "./pages/FeeStructures";
import NotFound from "./pages/NotFound";

// New Master Data Setup Pages
import AcademicYears from "./pages/AcademicYears";
import ClassLevels from "./pages/ClassLevels";
import Sections from "./pages/Sections";
import ClassSections from "./pages/ClassSections";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/admit" element={<AdmissionWizardPage />} />
            <Route path="/teachers" element={<Teachers />} />
            
            {/* Master Data Routes */}
            <Route path="/academic-years" element={<AcademicYears />} />
            <Route path="/class-levels" element={<ClassLevels />} />
            <Route path="/sections" element={<Sections />} />
            <Route path="/class-sections" element={<ClassSections />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/class-subject-mappings" element={<ClassSubjectMappings />} />
            
            <Route path="/fee-structures" element={<FeeStructures />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;