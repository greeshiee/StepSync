import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="flex justify-between w-full p-4 border-b bg-black/60 shadow-md">
      <Link
        to="/"
        className="flex flex-row items-center gap-4 font-bold text-[20px] text-gray-800 hover:text-blue-500 transition"
      >
        <img
          src="/logo.png"
          alt={"StepSync Logo"}
          className="w-[50px] h-[50px] rounded-full"
        />
        <div className="text-white text-2xl font-semibold px-3.5 py-2.5 rounded-2xl outline-1 outline-offset-[-1px] outline-white flex justify-center items-center">
          StepSync
        </div>
      </Link>
      <div>
        <button className="px-4 py-2 border rounded-2xl outline-1 outline-offset-[-1px] outline-white ml-2 transition cursor-pointer text-white text-xl font-semibold">
          Sign In
        </button>
        <button className=" px-4 py-2 border rounded-2xl outline-1 outline-offset-[-1px] outline-white ml-2 transition cursor-pointer text-white text-xl font-semibold">
          Create Account
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
