// src/components/students/BulkStudentIdCards.tsx

import React, { forwardRef } from 'react';
import StudentIdCard from './StudentIdCard';

const BulkStudentIdCards = forwardRef(({ studentsList }: any, ref: any) => {
  if (!studentsList || studentsList.length === 0) return <div ref={ref}></div>;

  return (
    <div ref={ref} className="print-container">
      {/* Container wraps items left-to-right, top-to-bottom */}
      <div className="flex flex-wrap justify-center gap-6 print:gap-4 print:p-0">
        
        {/* Iterate through students exactly once */}
        {studentsList.map((student: any) => (
          
          /* PAIR WRAPPER: Keeps Front and Back together, prevents page breaks in the middle of a pair */
          <div 
            key={student.studentId} 
            className="flex flex-row gap-1 break-inside-avoid p-2 border border-dashed border-gray-200 print:border-none print:p-0"
          >
            {/* Front Side */}
            <StudentIdCard studentData={student} isBack={false} />
            
            {/* Back Side */}
            <StudentIdCard studentData={student} isBack={true} />
          </div>
          
        ))}

      </div>
    </div>
  );
});

export default BulkStudentIdCards;