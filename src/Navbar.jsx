import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="flex justify-between w-full p-4 border-b border-gray-200 bg-white shadow-md">
      <div>
        <Link to="/" className="font-bold text-[20px] text-gray-800 hover:text-blue-500 transition">
          StepSync
        </Link>
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
  );
};

export default Navbar;
