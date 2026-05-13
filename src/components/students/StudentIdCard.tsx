// src/components/students/StudentIdCard.tsx

import React, { forwardRef } from 'react';

const StudentIdCard = forwardRef(({ studentData, isBack = false }: any, ref: any) => {
  if (!studentData) return <div ref={ref}></div>;

  return (
    <div 
      ref={ref} 
      className="print-container bg-white font-sans"
      style={{ width: '216px', height: '344px' }} 
    >
      <div className="w-full h-full border border-gray-300 overflow-hidden relative shadow-md print:shadow-none print:border-gray-400 bg-white">
        {!isBack ? (
          <>
            {/* FRONT HEADER - Reduced padding so text sits higher */}
            <div className="absolute top-0 w-full h-[95px] bg-slate-900 border-b-[3px] border-amber-500 flex flex-col items-center pt-3">
              <h2 className="text-white text-[16px] font-serif font-bold tracking-widest uppercase text-center leading-tight">
                Sarbajanin<br/>Academy
              </h2>
            </div>

            {/* AVATAR - Shifted down to top-[60px] to clear the text completely */}
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[80px] h-[95px] bg-white border-[3px] border-white shadow-md z-10 overflow-hidden">
              <img 
                src={studentData.photoUrl || "/student_avatar.svg"} 
                alt="Student Avatar" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* STUDENT DETAILS - Shifted down to top-[165px] */}
            <div className="absolute top-[165px] w-full flex flex-col items-center px-2">
              <h3 className="text-[15px] font-serif font-bold text-slate-900 text-center uppercase tracking-tight">
                {studentData.fullName}
              </h3>
              <div className="w-8 h-[2px] bg-amber-500 mt-[3px] mb-2"></div>
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                {studentData.classSectionName}
              </span>
            </div>

            {/* INFO TABLE - Shifted down to top-[220px] */}
            <div className="absolute top-[220px] w-full px-5">
              <table className="w-full text-[9px]">
                <tbody>
                  <tr>
                    <td className="font-semibold text-slate-500 py-[3px] uppercase tracking-wider w-[45%]">ID No.</td>
                    <td className="font-bold text-slate-900 py-[3px] text-right">{studentData.rollNumber}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-500 py-[3px] uppercase tracking-wider">D.O.B.</td>
                    <td className="font-bold text-slate-900 py-[3px] text-right">{studentData.dateOfBirth}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-500 py-[3px] uppercase tracking-wider">Emergency</td>
                    <td className="font-bold text-slate-900 py-[3px] text-right">{studentData.guardianPhone}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FRONT FOOTER */}
            <div className="absolute bottom-0 w-full h-[32px] bg-slate-900 border-t-[2px] border-amber-500 flex items-center justify-center">
               <span className="text-white text-[8.5px] font-bold tracking-[0.25em] uppercase">
                 Student Identity Card
               </span>
            </div>
          </>
        ) : (
          <>
            {/* BACK SIDE (Unchanged) */}
            <div className="w-full bg-slate-900 text-center py-2 border-b-[2px] border-amber-500">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Attendance Scanner</h3>
            </div>
            <div className="w-full h-full flex flex-col items-center pt-6 px-4 bg-slate-50">
              <div className="w-[120px] h-[120px] bg-white border border-gray-300 p-2 shadow-sm flex items-center justify-center">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${studentData.rollNumber}`} alt="QR Code" className="w-full h-full" />
              </div>
              <p className="text-[9px] text-slate-600 mt-3 text-center">
                Roll Number: <br/><span className="font-bold text-slate-900 tracking-wider">{studentData.rollNumber}</span>
              </p>
              <div className="absolute bottom-4 w-full text-center px-4">
                <div className="w-10 h-[1px] bg-amber-500 mx-auto mb-2"></div>
                <p className="text-[7.5px] text-slate-700 leading-relaxed uppercase tracking-wider">
                  <strong>Property of Sarbajanin Academy</strong><br/>
                  Valid for AY: <span className="font-bold">{studentData.academicYear}</span><br/><br/>
                  <span className="text-[6.5px] text-slate-500">If found, please return to:</span><br/>
                  Admin Office, Main Campus<br/>Tel: +91 99999 00000
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default StudentIdCard;