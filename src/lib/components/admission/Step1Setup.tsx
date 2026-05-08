import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import type { WizardState } from '@/pages/AdmissionWizard';
import type { AcademicYear, ClassLevel, ClassSection } from '@/types/api';
import { getFormOptions } from '@/lib/api/students';

interface FormOptions {
  academicYears: AcademicYear[];
  classLevels: ClassLevel[];           // ← NEW: From updated form-options
  classSections: ClassSection[];
}

interface Step1SetupProps {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
}

export default function Step1Setup({ state, setState }: Step1SetupProps) {
  const formOptionsQuery = useQuery<FormOptions>({
    queryKey: ['form-options'],
    queryFn: () => getFormOptions() as unknown as Promise<FormOptions>,
  });

  const academicYears = formOptionsQuery.data?.academicYears ?? [];
  const classLevels = formOptionsQuery.data?.classLevels ?? [];       // ← NEW
  const classSections = formOptionsQuery.data?.classSections ?? [];

  // ── CASCADING FILTERS ────────────────────────────────────────────────────────
  
  // Filter class sections by BOTH academic year AND class level
  const filteredSections = classSections.filter((s) => {
    const matchesYear = !state.setupData.academicYearId || 
                        s.academicYearId === state.setupData.academicYearId;
    const matchesClass = !state.setupData.classLevelId || 
                         s.classLevelId === state.setupData.classLevelId;    // ← NEW
    return matchesYear && matchesClass;
  });

  const selectedYear = academicYears.find((y) => y.id === state.setupData.academicYearId);
  const selectedClass = classLevels.find((c) => c.id === state.setupData.classLevelId);  // ← NEW
  const selectedSection = filteredSections.find((s) => s.id === state.setupData.classSectionId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-5">
          Academic Setup
        </h2>

        {/* API status indicator */}
        <div className="mb-5 flex items-center gap-2 text-xs text-gray-500 bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
          <span>
            {formOptionsQuery.isLoading
              ? <>Fetching options from <code className="font-mono text-gray-300">/api/students/form-options</code> ...</>
              : formOptionsQuery.isError
              ? 'Failed to load options. Please refresh.'
              : <>Loaded from <code className="font-mono text-gray-300">/api/students/form-options</code></>
            }
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Academic Year */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Academic year <span className="text-red-400">*</span>
            </label>
            <select
              value={state.setupData.academicYearId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                // When academic year changes, reset class level and section
                setState((prev) => ({
                  ...prev,
                  setupData: {
                    academicYearId: id,
                    classLevelId: null,
                    classSectionId: null,
                  },
                }));
              }}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5
                text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                appearance-none cursor-pointer"
            >
              <option value="">Select academic year</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Level - NEW */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Class <span className="text-red-400">*</span>
            </label>
            <select
              value={state.setupData.classLevelId ?? ''}
              disabled={!state.setupData.academicYearId}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                // When class level changes, reset section
                setState((prev) => ({
                  ...prev,
                  setupData: { 
                    ...prev.setupData, 
                    classLevelId: id,
                    classSectionId: null,  // Reset section
                  },
                }));
              }}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5
                text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">
                {!state.setupData.academicYearId ? 'First select a year' : 'Select class'}
              </option>
              {classLevels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Section <span className="text-red-400">*</span>
            </label>
            <select
              value={state.setupData.classSectionId ?? ''}
              disabled={!state.setupData.classLevelId || filteredSections.length === 0}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                setState((prev) => ({
                  ...prev,
                  setupData: { ...prev.setupData, classSectionId: id },
                }));
              }}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5
                text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">
                {!state.setupData.classLevelId 
                  ? 'First select a class' 
                  : filteredSections.length === 0
                  ? 'No sections available'
                  : 'Select section'
                }
              </option>
              {filteredSections.map((s) => {
                const sectionName = s.sectionName || 'Unknown';
                return (
                  <option key={s.id} value={s.id}>
                    {sectionName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Select academic year, then class, then section. Class section list filters to your selections.
        </p>
      </div>
    </div>
  );
}