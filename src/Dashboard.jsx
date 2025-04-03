import React from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center h-screen p-5 bg-gray-50">
      <Navbar />

      <h1 className="text-[36px] font-bold mt-12 w-3/4 text-left text-gray-800">
        Your Dances
      </h1>

      <div className="w-3/4 h-[100px] bg-white border-2 border-black rounded-sm mt-8 flex flex-col items-start justify-center pl-5 shadow-md">
        <button
          className="text-[18px] text-black cursor-pointer hover:text-blue-600 transition"
          onClick={() => navigate("/upload")}
        >
          + Analyze new dance
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
