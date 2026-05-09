// ======================================================
// STANDARD API RESPONSE
// ======================================================
 
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}
 
// ======================================================
// AUTH
// ======================================================
 
export interface AuthLoginResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
 
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}
 
// ======================================================
// PAGINATION
// ======================================================
 
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
 
  first?: boolean;
  last?: boolean;
}
 
// ======================================================
// MASTER DATA
// ======================================================
 
export interface AcademicYear {
  id: number | string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
 
  studentCount?: number;
  createdAt?: string;
}
 
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
 
 classLevelId: number;          // ← ADD THIS
  classLevelName: string;        // ← ADD THIS
 
  displayName?: string;
 
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
 
// ======================================================
// FEES
// ======================================================
 
export interface FeeStructure {
  id: number;
 
  classLevelId?: number;
  classLevelName?: string;
 
  className?: string;
 
  academicYearId: number;
  academicYearName?: string;
 
  feeType: string;
  frequency: string;
 
  amount: number;
 
  description?: string | null;
 
  createdAt?: string;
  updatedAt?: string;
}
 
// ======================================================
// STUDENTS
// ======================================================
 
export interface Student {
  id: string;
 
  email: string;
  rollNumber: string;
 
  fullName: string;
 
  firstName?: string;
  lastName?: string;
 
  phone?: string;
 
  dateOfBirth?: string;
  address?: string;
 
  guardianName?: string;
  guardianPhone?: string;
 
  admissionDate?: string;
 
  classSectionId?: string;
  classSectionName?: string;
 
  academicYear?: string;
  academicYearId?: string;
  academicYearName?: string;
}
 
// ======================================================
// TEACHERS
// ======================================================
 
export interface TeacherAssignment {
  id: number;
 
  teacherId: string;
  teacherName?: string;
 
  classLevelId?: number;
  className?: string;
 
  subjectId: number;
  subjectName?: string;
  subjectCode?: string;
 
  classSectionId?: number;
  classSectionName?: string;
 
  academicYear?: string;
 
  createdAt?: string;
  updatedAt?: string;
}
 
export interface Teacher {
  id: string;
 
  email: string;
 
  fullName?: string;
 
  firstName?: string;
  lastName?: string;
 
  phone?: string;
 
  dateOfBirth?: string;
 
  address?: string;
 
  joiningDate?: string;
 
  active: boolean;
 
  assignments?: TeacherAssignment[];
}
 
// ======================================================
// DASHBOARD
// ======================================================
 
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalClassSections: number;
 
  studentsPerSection?: {
    name: string;
    students: number;
  }[];
 
  admissionsByMonth?: {
    month: string;
    admissions: number;
  }[];
 
  teacherStatus?: {
    active: number;
    inactive: number;
  };
 
  yearEnrollment?: {
    year: string;
    students: number;
  }[];
}
 
// ======================================================
// FEES SUMMARY
// ======================================================
 
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