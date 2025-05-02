import React from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center w-screen h-screen bg-[url('/background.png')] bg-cover bg-center bg-no-repeat">
      <Navbar />

      <h1 className="text-4xl font-bold mt-12 w-3/4 text-left text-white [text-shadow:_0px_4px_15px_rgb(0_0_0_/_0.25)]">
        Your Dances
      </h1>

      <div className=" bg-black/60 w-3/4 h-[100px]  border-2 border-black rounded-2xl mt-8 flex flex-col items-start justify-center pl-5 shadow-md">
        <button
          className="text-xl text-white cursor-pointer  hover:text-blue-600 transition"
          onClick={() => navigate("/upload")}
        >
          + Analyze new dance
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
