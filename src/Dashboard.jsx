import React from 'react';

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center h-screen p-5 bg-gray-50">
      {/* Nav Bar */}
      <nav className="flex justify-between w-full p-4 border-b border-gray-200 bg-white">
        <div>
          <span className="font-bold text-[20px]">StepSync</span>
        </div>
        <div>
          <button className="px-4 py-2 border border-gray-300 rounded ml-2 hover:bg-gray-100 transition">
            Sign In
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded ml-2 hover:bg-gray-100 transition">
            Create Account
          </button>
        </div>
      </nav>

      {/* Title */}
      <h1 className="text-[36px] font-bold mt-12 w-3/4 text-left text-gray-800">
        Your Dances
      </h1>

      {/* Analyze Box */}
      <div className="w-3/4 h-[100px] bg-white border-2 border-black rounded-sm mt-8 flex flex-col items-start justify-center pl-5 shadow-md">
        <p className="text-[18px] text-black cursor-pointer hover:text-blue-600 transition">
          + Analyze new dance
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
