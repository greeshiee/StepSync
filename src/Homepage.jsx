import React from 'react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[80vh] flex flex-col overflow-hidden">
      {/* Nav Bar */}
      <nav className="flex justify-between p-4 border-b border-gray-200">
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

      {/* Content */}
      <div className="flex flex-col items-center pt-[350px] text-center">
        <h1 className="text-[36px] font-bold mb-4">
          Free personalized dance trainer
        </h1>
        <p className="mb-8 text-gray-600">
          Upload the choreography and your dance and receive feedback in minutes
        </p>
        <button
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          onClick={() => navigate('/dashboard')}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Homepage;
