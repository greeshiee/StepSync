import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[80vh] flex flex-col overflow-hidden">
      <Navbar />

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
