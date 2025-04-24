import React, { useState } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const VideoUpload = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [videos, setVideos] = useState({
    choreography: null,
    dance: null,
  });
  const [videoPreviews, setVideoPreviews] = useState({
    choreography: null,
    dance: null,
  });

  const handleFileChange = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      if (videoPreviews[type]) {
        URL.revokeObjectURL(videoPreviews[type]);
      }
      const previewUrl = URL.createObjectURL(file);
      setVideos((prev) => ({ ...prev, [type]: file }));
      setVideoPreviews((prev) => ({ ...prev, [type]: previewUrl }));
    }
  };

  const handleUploadNewVideo = (type) => {
    if (videoPreviews[type]) {
      URL.revokeObjectURL(videoPreviews[type]);
    }
    setVideos((prev) => ({ ...prev, [type]: null }));
    setVideoPreviews((prev) => ({ ...prev, [type]: null }));
  };

  const handleGenerateFeedback = async () => {
    if (!videos.choreography || !videos.dance) {
      alert("Please upload both videos.");
      return;
    }
  
    const formData = new FormData();
    formData.append("choreography", videos.choreography);
    formData.append("dance", videos.dance);
  
    try {
      const response = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get feedback");
      }
  
      const data = await response.json();
      navigate("/progress");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };
  

  const currentVideo = step === 1 ? videos.choreography : videos.dance;
  const isSecondStep = step === 2;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      <div className="absolute left-8 top-[110px] text-slate-500 text-[32px] font-normal font-['Inter'] leading-tight">
        {step} of 2
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold font-['Inter'] mb-4">
          {isSecondStep ? "Upload your Dance" : "Upload a Choreography"}
        </h1>
        <p className="text-center text-slate-500 text-sm font-normal font-['Inter'] leading-tight max-w-md mb-8">
          {isSecondStep
            ? "This should be your own dance that you want feedback on. We will be generating feedback identifying the differences between the choreography and this dance."
            : "This should be the dance you are aiming to achieve. We will be providing feedback on how similar your dance is to this choreography."}
        </p>

        {!currentVideo ? (
          <div className="p-[30px] rounded-[20px] border-2 border-slate-500 flex flex-col items-center gap-[22px] max-w-md w-full">
            <input
              type="file"
              accept="video/*"
              onChange={(e) =>
                handleFileChange(isSecondStep ? "dance" : "choreography", e)
              }
              style={{ display: "none" }}
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
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
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-xl">
            <div className="relative w-full aspect-video">
              <video
                key={step}
                className="w-full h-full object-contain"
                controls
              >
                <source
                  src={
                    isSecondStep
                      ? videoPreviews.dance
                      : videoPreviews.choreography
                  }
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>

              <button
                onClick={() =>
                  handleUploadNewVideo(isSecondStep ? "dance" : "choreography")
                }
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 9l-.867 10.338A2.25 2.25 0 0116.392 21H7.608a2.25 2.25 0 01-2.241-1.662L4.5 9m5.25 4v6m4.5-6v6M9.75 5.25V4.5a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v.75M3 9h18"
                  />
                </svg>
              </button>
            </div>

            {isSecondStep && videos.dance && (
              <button
                onClick={handleGenerateFeedback}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300"
              >
                Generate Feedback
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="flex justify-between p-4">
        <button
          onClick={() => setStep(1)}
          disabled={!isSecondStep}
          className={`cursor-pointer ${
            !isSecondStep && "opacity-50 cursor-default"
          }`}
          style={{ backgroundColor: "transparent", border: "none" }}
        >
          <svg
            width="77"
            height="77"
            viewBox="0 0 77 77"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity={isSecondStep ? 1 : 0.2}>
              <path
                d="M38.5 25.6666L25.6667 38.5M25.6667 38.5L38.5 51.3333M25.6667 38.5H51.3333M6.41666 38.5C6.41666 20.7808 20.7809 6.41664 38.5 6.41664C56.2191 6.41664 70.5833 20.7808 70.5833 38.5C70.5833 56.2191 56.2191 70.5833 38.5 70.5833C20.7809 70.5833 6.41666 56.2191 6.41666 38.5Z"
                stroke="#1E1E1E"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </button>

        <button
          onClick={() => videos.choreography && !isSecondStep && setStep(2)}
          disabled={!videos.choreography}
          className={`cursor-pointer ${
            !videos.choreography && "opacity-50 cursor-default"
          }`}
          style={{ backgroundColor: "transparent", border: "none" }}
        >
          <svg
            width="77"
            height="77"
            viewBox="0 0 77 77"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity={isSecondStep ? 0.2 : 1}>
              <path
                d="M38.5 51.3334L51.3333 38.5M51.3333 38.5L38.5 25.6667M51.3333 38.5H25.6666M70.5833 38.5C70.5833 56.2192 56.2191 70.5834 38.5 70.5834C20.7808 70.5834 6.41663 56.2192 6.41663 38.5C6.41663 20.7809 20.7808 6.41669 38.5 6.41669C56.2191 6.41669 70.5833 20.7809 70.5833 38.5Z"
                stroke="#1E1E1E"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </button>
      </footer>
    </div>
  );
};

export default VideoUpload;
