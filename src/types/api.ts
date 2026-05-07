// Standard API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

export interface AuthLoginResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: { id: string; email: string; firstName?: string; lastName?: string };
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

// ─────────────────────────────────────────────────
// NEW: Master Data Types
// ─────────────────────────────────────────────────

export interface ClassLevel {
  id: number;
  name: string;
  displayName: string;
}

export interface Section {
  id: number;
  name: string;
  displayName: string;
}

export interface AcademicYear {
  id: number | string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  studentCount?: number;
  createdAt?: string;
}

export interface Subject {
  id: number | string;
  name: string;
  code: string;
  createdAt?: string;
}

export interface ClassSection {
  id: number | string;
  academicYearId: number | string;
  academicYearName: string;
  className: string;
  sectionName: string;
  displayName?: string; // e.g. "CLASS_THREE - SUN"
  studentCount?: number;
}

export interface ClassSubjectMapping {
  id: number | string;
  classLevelId: number;
  className: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeStructure {
  id: string;
  className: string;
  academicYearId: string;
  feeType: string;
  frequency: string;
  amount: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────

export interface Student {
  id: string;
  email: string;
  rollNumber: string;
  fullName: string;          // ← required, returned by API
  firstName?: string;        // ← optional, used only in admit form payload
  lastName?: string;         // ← optional, used only in admit form payload
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  admissionDate?: string;
  classSectionId?: string;
  classSectionName?: string;
  academicYear?: string;     // ← matches API field name
  academicYearId?: string;
  academicYearName?: string;
}

export interface Teacher {
  id: string;
  email: string;
  fullName: string;          // ← required, returned by API
  firstName?: string;        // ← optional, used only in register form payload
  lastName?: string;         // ← optional, used only in register form payload
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  joiningDate?: string;
  active: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalClassSections: number;
  studentsPerSection?: { name: string; students: number }[];
  admissionsByMonth?: { month: string; admissions: number }[];
  teacherStatus?: { active: number; inactive: number };
  yearEnrollment?: { year: string; students: number }[];
}

// ─────────────────────────────────────────────────
// Fee Preview & Summary Types
// ─────────────────────────────────────────────────
export interface FeePreviewLineItem {
  feeStructureId: number;
  feeType: string;
  label: string;
  occurrences: number;
  totalAmount: number;
  unitAmount: number;
}

export interface FeePreview {
  academicYearId: number;
  academicYearName: string;
  classSectionId: number;
  classSectionName: string;
  grandTotal: number;
  lineItems: FeePreviewLineItem[];
}

export interface InitialPayment {
  feeType: string;
  amountPaid: number;
  monthsToPay?: number;
}

export interface MonthlyFeeDetail {
  period: string;
  grossAmount: number;
  paidAmount: number;
  status: string;
}

export interface StudentFeeBreakdown {
  feeType: string;
  grossAmount: number;
  paidAmount: number;
  balanceAmount: number;
  discount: number;
  netAmount: number;
  monthlyDetails: MonthlyFeeDetail[];
}

export interface StudentFeeSummary {
  studentId: string;
  academicYearId: number;
  totalGross: number;
  totalPaid: number;
  totalBalance: number;
  totalDiscount: number;
  totalNet: number;
  totalOverdue: number;
  breakdown: StudentFeeBreakdown[];
}