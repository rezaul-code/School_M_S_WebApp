// src/components/students/PrintSingleIdCardButton.tsx

import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from "lucide-react";
import { getSingleIdCard } from '@/lib/api/idCards'; // Assuming you put the endpoints in this file
import StudentIdCard from './StudentIdCard';

export const PrintSingleIdCardButton = ({ studentId }: { studentId: string }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: componentRef, // <--- Updated for v3
    documentTitle: `ID_Card_${studentData?.rollNumber || 'Student'}`,
  });

  const fetchAndPrint = async () => {
    try {
      setIsFetching(true);
      const data = await getSingleIdCard(studentId);
      setStudentData(data);
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
      <div className="hidden print:block">
        <StudentIdCard ref={componentRef} studentData={studentData} isBack={false} />
      </div>
    </>
  );
};