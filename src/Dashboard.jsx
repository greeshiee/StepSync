import React from 'react';
import Navbar from './Navbar';

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center h-screen p-5 bg-gray-50">
      <Navbar />

      <h1 className="text-[36px] font-bold mt-12 w-3/4 text-left text-gray-800">
        Your Dances
      </h1>

      <div className="w-3/4 h-[100px] bg-white border-2 border-black rounded-sm mt-8 flex flex-col items-start justify-center pl-5 shadow-md">
        <p className="text-[18px] text-black cursor-pointer hover:text-blue-600 transition">
          + Analyze new dance
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
