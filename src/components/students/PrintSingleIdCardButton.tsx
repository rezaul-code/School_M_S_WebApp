// src/components/students/PrintSingleIdCardButton.tsx

import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from "lucide-react";
import { getSingleIdCard } from '@/lib/api/idCards'; 
import StudentIdCard from './StudentIdCard';

export const PrintSingleIdCardButton = ({ studentId }: { studentId: string }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: componentRef, 
    documentTitle: `ID_Card_${studentData?.rollNumber || 'Student'}`,
  });

  const fetchAndPrint = async () => {
    try {
      setIsFetching(true);
      const data = await getSingleIdCard(studentId);
      setStudentData(data);
      // Slight delay to allow the hidden DOM to update with the new data
      setTimeout(() => {
        handlePrint();
        setIsFetching(false);
      }, 150); 
    } catch (error) {
      console.error(error);
      setIsFetching(false);
    }
  };

  return (
    <>
      <button 
        onClick={fetchAndPrint} 
        disabled={isFetching}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
      >
        <Printer size={15} />
        {isFetching ? "Preparing..." : "Print ID Card"}
      </button>
      
      {/* THE FIX: We wrap BOTH cards inside a flex-row div and attach the ref to it.
        It stays hidden on the screen but renders side-by-side when printing. 
      */}
      <div className="hidden print:block">
        <div ref={componentRef} className="flex flex-row gap-1 p-2 print:p-0 w-max">
          <StudentIdCard studentData={studentData} isBack={false} />
          <StudentIdCard studentData={studentData} isBack={true} />
        </div>
      </div>
    </>
  );
};