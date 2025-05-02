import React from 'react';

const Navbar = () => {
  return (
    <div className="w-[1512px] px-9 py-3.5 bg-black/60 outline outline-1 outline-offset-[-1px] outline-black fixed top-0 left-0 z-50 flex justify-between items-center">
      <div className="w-96 h-14 flex items-center gap-2.5">
        <div className="w-14 h-14 bg-black rounded-full" />
        <div className="w-40 h-8 px-3.5 py-2.5 rounded-2xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center">
          <span className="text-white text-2xl font-semibold font-['Inter']">StepSync</span>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="px-3.5 py-2.5 rounded-2xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center cursor-pointer">
          <span className="text-white text-xl font-semibold font-['Inter']">Sign In</span>
        </div>
        <div className="px-3.5 py-2.5 rounded-2xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center cursor-pointer">
          <span className="text-white text-xl font-semibold font-['Inter']">Create Account</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
