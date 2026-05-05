import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getFormOptions, admitStudent } from '@/lib/api/students';
import type { AcademicYear, ClassSection } from '@/types/api';

interface SetupData {
  academicYearId: string | null;
  classSectionId: string | null;
  academicYearName: string;
  classSectionName: string;
}

interface StudentInfo {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rollNumber: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
}

interface Payment {
  name: string;
  amount: number;
}

interface State {
  activeStep: 1 | 2 | 3 | 4;
  setupData: SetupData;
  studentInfo: StudentInfo;
  initialPayments: Payment[];
}

interface FormOptions {
  academicYears: AcademicYear[];
  classSections: ClassSection[];
}

const STEPS = ['1. Setup', '2. Student Info', '3. Fees & Checkout', '4. Review'] as const;

const AdmissionWizard: React.FC = () => {
  const { toast } = useToast();

  const [state, setState] = useState<State>({
    activeStep: 1,
    setupData: {
      academicYearId: null,
      classSectionId: null,
      academicYearName: '',
      classSectionName: '',
    },
    studentInfo: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      rollNumber: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      guardianName: '',
      guardianPhone: '',
    },
    initialPayments: [],
  });

const formOptionsQuery = useQuery<FormOptions>({
    queryKey: ['form-options'],
    queryFn: () => getFormOptions() as unknown as Promise<FormOptions>,
  });

  const academicYears = formOptionsQuery.data?.academicYears ?? [];
  const classSections = formOptionsQuery.data?.classSections ?? [];

  const filteredClassSections = React.useMemo(() => 
    classSections.filter(s => !state.setupData.academicYearId || s.academicYearId === state.setupData.academicYearId),
  [classSections, state.setupData.academicYearId]);

  const updateSetupData = useCallback((updates: Partial<SetupData>) => {
    setState(prev => ({
      ...prev,
      setupData: { ...prev.setupData, ...updates },
    }));
  }, []);

  const updateStudentInfo = useCallback((updates: Partial<StudentInfo>) => {
    setState(prev => ({
      ...prev,
      studentInfo: { ...prev.studentInfo, ...updates },
    }));
  }, []);

  const handleStudentInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateStudentInfo({ [name as keyof StudentInfo]: value } as Partial<StudentInfo>);
  }, [updateStudentInfo]);

  const isStepValid = useCallback((step: State['activeStep']): boolean => {
    switch (step) {
      case 1:
        return !!(state.setupData.academicYearId && state.setupData.classSectionId);
      case 2:
        return !!(
          state.studentInfo.firstName &&
          state.studentInfo.lastName &&
          state.studentInfo.email &&
          state.studentInfo.password &&
          state.studentInfo.rollNumber
        );
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  }, [state]);

  const goNext = () => {
    if (isStepValid(state.activeStep)) {
      setState(prev => ({ ...prev, activeStep: (prev.activeStep + 1) as 2 | 3 | 4 }));
    }
  };

  const goBack = () => {
    if (state.activeStep > 1) {
      setState(prev => ({ ...prev, activeStep: (prev.activeStep - 1) as 1 | 2 | 3 }));
    }
  };

  const totalPayments = state.initialPayments.reduce((sum, p) => sum + p.amount, 0);

  useEffect(() => {
    if (state.activeStep === 3 && state.initialPayments.length === 0 && state.setupData.classSectionId) {
      // Mock payments - replace with real fee structures API later
      setState(prev => ({
        ...prev,
        initialPayments: [
          { name: `Admission Fee - ${state.setupData.classSectionName}`, amount: 10000 },
          { name: 'First Term Tuition', amount: 25000 },
          { name: 'Books & Uniforms', amount: 5000 },
        ],
      }));
    }
  }, [state.activeStep, state.setupData.classSectionId, state.setupData.classSectionName, state.initialPayments.length]);

  const handleConfirm = async () => {
    if (!state.setupData.classSectionId) return;

    const payload = {
      ...state.studentInfo,
      classSectionId: state.setupData.classSectionId,
    };

    try {
      await admitStudent(payload);
      toast({
        title: 'Success!',
        description: 'Student admission confirmed and payment processed.',
      });
      // Reset form or emit event to parent
      setState({
        activeStep: 1,
        setupData: { academicYearId: null, classSectionId: null, academicYearName: '', classSectionName: '' },
        studentInfo: { firstName: '', lastName: '', email: '', password: '', rollNumber: '', phone: '', dateOfBirth: '', address: '', guardianName: '', guardianPhone: '' },
        initialPayments: [],
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to confirm admission.',
      });
    }
  };

  const renderStepContent = () => {
    if (formOptionsQuery.isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg">Loading form options...</div>
        </div>
      );
    }

    switch (state.activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Select
                value={state.setupData.academicYearId || ''}
                onValueChange={(value) => {
                  const year = academicYears.find((y) => y.id === value);
                  updateSetupData({
                    academicYearId: value,
                    classSectionId: null,
                    academicYearName: year?.name || '',
                    classSectionName: '',
                  });
                }}
              >
                <SelectTrigger id="academicYear">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classSection">Class Section *</Label>
              <Select
                value={state.setupData.classSectionId || ''}
                onValueChange={(value) => {
                  const section = filteredClassSections.find((s) => s.id === value);
                  let sectionName = '';
                  if (section) {
                    sectionName = `${section.className?.replace(/_/g, ' ') || ''} - ${section.sectionName}`;
                  }
                  updateSetupData({
                    classSectionId: value,
                    classSectionName: sectionName,
                  });
                }}
                disabled={!state.setupData.academicYearId || filteredClassSections.length === 0}
              >
                <SelectTrigger id="classSection">
                  <SelectValue placeholder={state.setupData.academicYearId ? 'Select class section' : 'First select year'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredClassSections.map((section) => {
                    const displayName = `${section.className?.replace(/_/g, ' ') || ''} - ${section.sectionName}`;
                    return (
                      <SelectItem key={section.id} value={section.id}>
                        {displayName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={state.studentInfo.firstName}
                onChange={handleStudentInputChange}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={state.studentInfo.lastName}
                onChange={handleStudentInputChange}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={state.studentInfo.email}
                onChange={handleStudentInputChange}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={state.studentInfo.password}
                onChange={handleStudentInputChange}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input
                id="rollNumber"
                name="rollNumber"
                value={state.studentInfo.rollNumber}
                onChange={handleStudentInputChange}
                placeholder="001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={state.studentInfo.phone}
                onChange={handleStudentInputChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={state.studentInfo.dateOfBirth}
                onChange={handleStudentInputChange}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={state.studentInfo.address}
                onChange={handleStudentInputChange}
                placeholder="123 Main St, City"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                name="guardianName"
                value={state.studentInfo.guardianName}
                onChange={handleStudentInputChange}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian Phone</Label>
              <Input
                id="guardianPhone"
                name="guardianPhone"
                value={state.studentInfo.guardianPhone}
                onChange={handleStudentInputChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Initial Payments Required</h3>
            <div className="divide-y divide-gray-200 rounded-xl border">
              {state.initialPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-lg font-medium">{payment.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${payment.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right">
              <div className="inline-flex items-baseline text-3xl font-bold text-green-600">
                Total: ${totalPayments.toLocaleString()}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">1. Setup</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Academic Year:</span>
                  <p className="font-medium">{state.setupData.academicYearName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Class Section:</span>
                  <p className="font-medium">{state.setupData.classSectionName}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">2. Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{`${state.studentInfo.firstName} ${state.studentInfo.lastName}`}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{state.studentInfo.email}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">Roll Number:</span>
                  <p className="font-medium">{state.studentInfo.rollNumber}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">3. Payments</h3>
              <div className="text-right text-2xl font-bold text-green-600">
                Total: ${totalPayments.toLocaleString()}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-8 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
              <h1 className="text-3xl font-bold mb-2">Student Admission</h1>
              <p className="text-blue-100">Complete the steps to admit new student</p>
            </div>

            {/* Progress Bar */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between w-full mb-4">
                {STEPS.map((label, index) => (
                  <React.Fragment key={label}>
                    <div className={`flex flex-col items-center min-w-[100px] ${
                      index < state.activeStep - 1
                        ? 'text-green-600'
                        : index + 1 === state.activeStep
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all ${
                        index < state.activeStep
                          ? 'bg-green-500 text-white border-4 border-green-400 shadow-green-300'
                          : index + 1 === state.activeStep
                          ? 'bg-blue-500 text-white border-4 border-blue-400 shadow-blue-300'
                          : 'bg-gray-200 text-gray-600 border-4 border-gray-300 shadow-sm'
                      }`}>
                        {index < state.activeStep ? '✓' : index + 1}
                      </div>
                      <span className="mt-2 text-xs font-medium">{label}</span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 bg-gradient-to-r ${
                        index < state.activeStep - 1
                          ? 'bg-green-500 shadow-sm'
                          : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="px-8 pb-8 max-h-[calc(100vh-300px)] overflow-y-auto">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="px-8 pb-8 pt-4 border-t bg-slate-50/50">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className={state.activeStep === 1 ? 'opacity-0 pointer-events-none' : ''}
                  size="lg"
                >
                  ← Back
                </Button>
                {state.activeStep === 4 ? (
                  <Button
                    size="lg"
                    className="ml-auto px-16 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-lg font-semibold shadow-xl transition-all"
                    onClick={handleConfirm}
                  >
                    Confirm Admission & Pay
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    className="ml-auto px-16 bg-blue-600 hover:bg-blue-700 text-lg font-semibold shadow-lg transition-all"
                    disabled={!isStepValid(state.activeStep)}
                    onClick={goNext}
                  >
                    Next Step →
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdmissionWizard;

