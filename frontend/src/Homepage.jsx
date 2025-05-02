import React from 'react';

const Landing = () => {
  return (
    <div
      className="w-[1512px] h-[982px] relative overflow-hidden"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* Navbar */}
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

      {/* Hero Text */}
      <div className="absolute top-[433px] left-[107px] h-28 w-[1383px]">
        {/* White shadow text layer */}
        <h1 className="absolute top-[8px] text-white text-8xl font-bold font-['Inter'] select-none pointer-events-none">
          Dance Smarter. Perform Better
        </h1>
        {/* Black text with subtle glow */}
        <h1 className="text-stone-900 text-8xl font-bold font-['Inter'] [text-shadow:_0px_4px_6px_rgb(0_0_0_/_0.25)]">
          Dance Smarter. Perform Better
        </h1>
      </div>

      {/* Subheading */}
      <div className="absolute top-[558px] left-[334px]">
        <p className="text-white text-3xl font-semibold font-['Inter'] [text-shadow:_0px_4px_15px_rgb(0_0_0_/_0.25)]">
          Upload your dances and get instant feedback powered by AI
        </p>
      </div>

      {/* Get Started Button */}
      <div className="absolute top-[636px] left-[652px]">
        <button className="w-52 h-16 px-7 py-3 opacity-60 bg-black/90 rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black flex justify-center items-center gap-2.5 overflow-hidden">
          <span className="text-white text-2xl font-bold font-['Inter']">Get Started</span>
        </button>
      </div>
    </div>
  );
};

export default Landing;
