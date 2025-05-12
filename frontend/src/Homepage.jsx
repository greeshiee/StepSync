import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen bg-[url('/background.png')] bg-cover bg-center bg-no-repeat">
      <Navbar />

      <div className="flex flex-col items-center pt-[350px] text-center">
        <h1 className="text-7xl font-bold mb-4 text-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Dance Smarter. Perform Better
        </h1>
        <p className="mb-8 text-white text-2xl font-semibold [text-shadow:_0px_4px_15px_rgb(0_0_0_/_0.25)]">
          Upload your dances and get instant feedback powered by AI
        </p>
        <button
          className="px-4 py-2 text-white opacity-60 bg-black/90 rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] hover:bg-gray-500 transition outline-1 outline-offset-[-1px] outline-black"
          onClick={() => navigate("/dashboard")}
        >
          <span className="text-white text-2xl font-bold cursor-pointer">
            Get Started
          </span>
        </button>
      </div>
    </div>
  );
};

export default Homepage;
