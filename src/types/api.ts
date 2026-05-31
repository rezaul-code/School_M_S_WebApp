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

export interface SubjectComponent {
  id: number;
  name: string;
  code: string;
  displayOrder: number;
}

export interface Subject {
  id: number | string;
  name: string;
  code: string;
  createdAt?: string;
  components?: SubjectComponent[]; // Safe optional field for registry reads
}

export interface ClassSection {
  id: number | string;

  academicYearId: number | string;
  academicYearName: string;

  className: string;
  sectionName: string;

  classLevelId: number;
  classLevelName: string;

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
  
  gender?: string;
  religion?: string;
  bloodGroup?: string;
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

/**
 * One fee row returned by GET /api/students/{id}/fees?academicYearId={id}
 *
 * `id` is the backend fee-record PK — used as the path segment for all
 * action endpoints:
 *   POST /api/students/{studentId}/fees/{id}/payments
 *   POST /api/students/{studentId}/fees/{id}/discount
 *   POST /api/students/{studentId}/fees/{id}/waive
 */
export interface FeeRow {
  id: number;
  feeType: string;
  period: string | null;
  gross: number;
  amountPaid: number;
  balance: number;
  discount: number;
  discountReason: string | null;
  netDue: number;
  dueDate: string;
  status: string; // "PAID" | "PARTIAL" | "PENDING" | "OVERDUE" | "WAIVED"
  waived: boolean;
}

/**
 * Top-level response from GET /api/students/{id}/fees?academicYearId={id}
 */
export interface StudentFeeSummary {
  studentId: string;
  academicYearId: number;
  grossDueYear: number;
  netDueYear: number;
  collectedSoFar: number;
  balanceRemaining: number;
  overdue: number;
  totalDiscount: number;
  waivedDescriptions: string[];
  rows: FeeRow[];
}

// Legacy aliases kept for any code still referencing old types — remove once fully migrated
/** @deprecated Use FeeRow instead */
export type MonthlyFeeDetail = FeeRow;
/** @deprecated Use StudentFeeSummary.rows instead */
export type StudentFeeBreakdown = never;