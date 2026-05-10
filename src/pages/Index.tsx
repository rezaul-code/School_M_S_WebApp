import React from "react";

const Index = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      
      {/* Your Logo */}
      <img
        src="/logo.png"
        alt="School Management System"
        className="w-32 h-32 object-contain mb-6"
      />

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        School Management System
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 text-center max-w-xl mb-8">
        Manage students, teachers, fees, attendance, and reports
        with a modern and professional dashboard.
      </p>

      {/* Button */}
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg">
        Get Started
      </button>
    </div>
  );
};

export default Index;