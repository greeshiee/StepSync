import React, { useState } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const VideoUpload = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [videos, setVideos] = useState({ choreography: null, dance: null });
  const [videoPreviews, setVideoPreviews] = useState({ choreography: null, dance: null });
  const [is3D, setIs3D] = useState(false);
  const [show2DWarning, setShow2DWarning] = useState(false);

  const isSecondStep = step === 2;
  const currentVideo = isSecondStep ? videos.dance : videos.choreography;

  const handleFileChange = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      if (videoPreviews[type]) URL.revokeObjectURL(videoPreviews[type]);
      const previewUrl = URL.createObjectURL(file);
      setVideos((prev) => ({ ...prev, [type]: file }));
      setVideoPreviews((prev) => ({ ...prev, [type]: previewUrl }));
    }
  };

  const handleUploadNewVideo = (type) => {
    if (videoPreviews[type]) URL.revokeObjectURL(videoPreviews[type]);
    setVideos((prev) => ({ ...prev, [type]: null }));
    setVideoPreviews((prev) => ({ ...prev, [type]: null }));
  };

  const handleGenerateFeedback = async () => {
    if (!videos.choreography || !videos.dance) {
      alert("Please upload both videos.");
      return;
    }
    if (!is3D) {
      setShow2DWarning(true);
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

      navigate("/progress");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const close2DWarning = () => setShow2DWarning(false);

  return (
    <div
      className="w-[1512px] h-[982px] relative overflow-hidden text-white font-['Inter']"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Navbar />

      {/* Step Indicator */}
      <div className="w-28 left-[20px] top-[134px] absolute text-center justify-start text-slate-500 text-3xl font-normal leading-tight">
        {step} of 2
      </div>

      {/* Layered Headings */}
      <div className="w-[770px] h-32 p-3 left-[390px] top-[243px] absolute inline-flex justify-center items-center gap-2.5 overflow-hidden">
        <div className="w-[623px] h-14 justify-start text-black/60 text-6xl font-bold">Upload a Choreography</div>
      </div>
      <div className="w-[770px] h-32 p-3 left-[390px] top-[235px] absolute inline-flex justify-center items-center gap-2.5 overflow-hidden">
        <div className="w-[623px] h-14 justify-start text-white text-6xl font-bold">Upload a Choreography</div>
      </div>

      {/* Description */}
      <div className="w-[706px] h-14 left-[416px] top-[370px] absolute text-center justify-start text-white text-xl font-bold leading-tight">
        This should be the dance you are aiming to achieve. We will be providing feedback on how similar your dance is to this choreography.
      </div>

      {/* Upload Box - Entire box is clickable */}
      {!currentVideo && (
        <div className="w-[790px] h-80 p-7 left-[361px] top-[450px] absolute rounded-[20px] border-2 border-dotted border-slate-500 flex flex-col justify-start items-center gap-5">
          <label
            htmlFor="video-upload"
            className="w-full h-full flex flex-col items-center justify-center gap-5 cursor-pointer"
          >
            <div className="w-28 h-28 p-3.5 rounded-full outline outline-4 outline-offset-[-4px] outline-white flex justify-center items-center overflow-hidden">
              <img src="/Upload.png" alt="Upload Icon" className="w-14 h-14 object-contain" />
            </div>
            <div className="text-center text-white text-2xl font-extrabold leading-tight tracking-tight">
              Drag and drop video files to upload
            </div>
            <div className="text-center text-white text-xl font-semibold leading-tight">
              For best results, video uploads should be at least 1080p in MP4 format.
            </div>
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(isSecondStep ? "dance" : "choreography", e)}
            style={{ display: "none" }}
            id="video-upload"
          />
        </div>
      )}

      {/* Navigation Arrows */}
      <div className="absolute bottom-[40px] left-0 w-full flex justify-between px-10">
        <button
          onClick={() => setStep(1)}
          disabled={!isSecondStep}
          className={`w-20 h-20 ${!isSecondStep ? "opacity-20 cursor-default" : "cursor-pointer"}`}
        >
          <img src="/arrow-left-circle.png" alt="Back" className="w-20 h-20 object-contain" />
        </button>
        <button
          onClick={() => videos.choreography && !isSecondStep && setStep(2)}
          disabled={!videos.choreography}
          className={`w-20 h-20 ${!videos.choreography ? "opacity-20 cursor-default" : "cursor-pointer"}`}
        >
          <img src="/arrowright-circle.png" alt="Next" className="w-20 h-20 object-contain" />
        </button>
      </div>

      {/* 2D Warning Popup */}
      {show2DWarning && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-lg text-black">
            <h2 className="text-lg font-semibold mb-4">Warning</h2>
            <p className="mb-4">2D analysis is not yet available.</p>
            <button
              onClick={close2DWarning}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-all duration-300"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
