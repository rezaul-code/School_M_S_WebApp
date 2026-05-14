import { useQuery } from '@tanstack/react-query';
import type { WizardState } from '@/components/students/AdmissionWizard';
import type { AcademicYear, ClassLevel, ClassSection } from '@/types/api';
import { getFormOptions } from '@/lib/api/students';
 
interface FormOptions {
  academicYears: AcademicYear[];
  classLevels: ClassLevel[];           
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
  const classLevels = formOptionsQuery.data?.classLevels ?? [];       
  const classSections = formOptionsQuery.data?.classSections ?? [];
 
  const filteredSections = classSections.filter((s) => {
    const matchesYear = !state.setupData.academicYearId || s.academicYearId === state.setupData.academicYearId;
    const matchesClass = !state.setupData.classLevelId || s.classLevelId === state.setupData.classLevelId;    
    return matchesYear && matchesClass;
  });
 
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Admission Setup</h2>
        <p className="text-sm text-slate-500">Select the academic year and class assignment for the new student.</p>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Academic year <span className="text-red-500">*</span></label>
          <select
            value={state.setupData.academicYearId ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setState((prev) => ({ ...prev, setupData: { academicYearId: id, classLevelId: null, classSectionId: null } }));
            }}
            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm appearance-none cursor-pointer transition-shadow"
          >
            <option value="">Select academic year</option>
            {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Class <span className="text-red-500">*</span></label>
          <select
            value={state.setupData.classLevelId ?? ''}
            disabled={!state.setupData.academicYearId}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setState((prev) => ({ ...prev, setupData: { ...prev.setupData, classLevelId: id, classSectionId: null } }));
            }}
            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm appearance-none cursor-pointer disabled:opacity-50 disabled:bg-slate-50 transition-shadow"
          >
            <option value="">{!state.setupData.academicYearId ? 'First select a year' : 'Select class'}</option>
            {classLevels.map((c) => <option key={c.id} value={c.id}>{c.displayName || c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Section <span className="text-red-500">*</span></label>
          <select
            value={state.setupData.classSectionId ?? ''}
            disabled={!state.setupData.classLevelId || filteredSections.length === 0}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setState((prev) => ({ ...prev, setupData: { ...prev.setupData, classSectionId: id } }));
            }}
            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm appearance-none cursor-pointer disabled:opacity-50 disabled:bg-slate-50 transition-shadow"
          >
            <option value="">
              {!state.setupData.classLevelId ? 'First select a class' : filteredSections.length === 0 ? 'No sections available' : 'Select section'}
            </option>
            {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.sectionName || 'Unknown'}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}