import React from "react";

const VideoUpload = () => {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <header className="w-full h-[84px] border border-black flex items-center p-4">
        <div className="w-[60px] h-[60px] bg-black rounded-full" />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold font-['Inter'] mb-4">
          Upload a Choreography
        </h1>

        <p className="text-center text-slate-500 text-sm font-normal font-['Inter'] leading-tight max-w-md mb-8">
          This should be the dance you are aiming to achieve. We will be
          providing feedback on how similar your dance is to this choreography.
        </p>

        <div className="text-center text-slate-500 text-[32px] font-normal font-['Inter'] leading-tight mb-8">
          1 of 2
        </div>

        <div className="p-[30px] rounded-[20px] border-2 border-slate-500 flex flex-col items-center gap-[22px] max-w-md w-full">
          <div data-svg-wrapper>
            <svg
              width="85"
              height="85"
              viewBox="0 0 85 85"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.5"
                y="0.5"
                width="84"
                height="84"
                rx="42"
                stroke="black"
              />
              <path
                d="M63.125 49.375V58.5417C63.125 59.7572 62.6421 60.923 61.7826 61.7826C60.923 62.6421 59.7572 63.125 58.5417 63.125H26.4583C25.2428 63.125 24.077 62.6421 23.2174 61.7826C22.3579 60.923 21.875 59.7572 21.875 58.5417V49.375M53.9583 33.3333L42.5 21.875M42.5 21.875L31.0417 33.3333M42.5 21.875V49.375"
                stroke="#1E1E1E"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div className="text-center text-black text-base font-semibold font-['Inter'] leading-tight tracking-tight">
            Drag and drop video files to upload
          </div>
          <div className="text-center text-slate-500 text-sm font-normal font-['Inter'] leading-tight">
            For best results, video uploads should be at least 1080p in MP4
            format.
          </div>
        </div>
      </main>

      <footer className="flex justify-between p-4">
        <div data-svg-wrapper>
          <svg
            width="77"
            height="77"
            viewBox="0 0 77 77"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity="0.2">
              <path
                d="M38.5 25.6666L25.6667 38.5M25.6667 38.5L38.5 51.3333M25.6667 38.5H51.3333M6.41666 38.5C6.41666 20.7808 20.7809 6.41664 38.5 6.41664C56.2191 6.41664 70.5833 20.7808 70.5833 38.5C70.5833 56.2191 56.2191 70.5833 38.5 70.5833C20.7809 70.5833 6.41666 56.2191 6.41666 38.5Z"
                stroke="#1E1E1E"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </svg>
        </div>
        <div data-svg-wrapper>
          <svg
            width="77"
            height="77"
            viewBox="0 0 77 77"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M38.5 51.3334L51.3333 38.5M51.3333 38.5L38.5 25.6667M51.3333 38.5H25.6666M70.5833 38.5C70.5833 56.2192 56.2191 70.5834 38.5 70.5834C20.7808 70.5834 6.41663 56.2192 6.41663 38.5C6.41663 20.7809 20.7808 6.41669 38.5 6.41669C56.2191 6.41669 70.5833 20.7809 70.5833 38.5Z"
              stroke="#1E1E1E"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </footer>
    </div>
  );
};

export default VideoUpload;
