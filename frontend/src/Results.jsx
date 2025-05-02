import React, { useEffect, useState, useRef } from "react";
import Navbar from "./Navbar";

const Results = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const danceVideoRef = useRef(null);

  useEffect(() => {
    const savedResults = localStorage.getItem("analysisResults");
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        if (
          parsed?.video_urls?.choreography &&
          parsed?.similarity !== undefined
        ) {
          setResults(parsed);
        }
      } catch (e) {
        console.error("Failed to parse analysisResults", e);
      }
    }
    setLoading(false);
  }, []);

  const handleTimestampClick = (timestamp) => {
    if (!danceVideoRef.current) return;

    const [minutes, seconds] = timestamp.split(":").map(parseFloat);
    const timeInSeconds = minutes * 60 + seconds;

    danceVideoRef.current.currentTime = timeInSeconds;

    if (danceVideoRef.current.paused) {
      danceVideoRef.current
        .play()
        .catch((e) => console.log("Autoplay prevented:", e));
    }
  };

  if (loading) return <div className="p-4">Processing videos...</div>;
  if (!results) return <div className="p-4">No results found</div>;

  return (
    <div className="min-h-screen flex flex-col bg-[url('/background.png')] bg-cover bg-center bg-no-repeat">
      <Navbar />
      <div className="p-10">
        <h1 className="text-3xl font-bold mb-4 text-white text-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Dance Analysis Results
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <h2 className="text-xl mb-2 px-4 pt-4 text-white">Choreography</h2>
            <div className="relative pb-[56.25%]">
              <video
                controls
                className="absolute top-0 left-0 w-full h-full object-contain"
                key={results.video_urls.choreography}
                playsInline
              >
                <source
                  src={`http://localhost:5000${results.video_urls.choreography}`}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <h2 className="text-xl mb-2 px-4 pt-4 text-white">Your Dance</h2>
            <div className="relative pb-[56.25%]">
              <video
                ref={danceVideoRef}
                controls
                className="absolute top-0 left-0 w-full h-full object-contain"
                key={results.video_urls.dance}
                playsInline
              >
                <source
                  src={`http://localhost:5000${results.video_urls.dance}`}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-black/60 p-4 rounded-lg">
            <h2 className="text-xl text-white font-semibold mb-4">
              Top 5 Matching Frames
            </h2>
            <ul className="space-y-2">
              {results.frame_analysis?.best_frames?.map((frame, index) => (
                <li key={index} className="bg-white p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Frame {frame.frame}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTimestampClick(frame.timestamp)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {frame.timestamp}
                      </button>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {Math.round(frame.similarity * 100)}%
                      </span>
                    </div>
                  </div>
                  {frame.feedback && (
                    <p className="text-sm text-gray-700 mt-1">
                      {frame.feedback.replace(/\*\*/g, "")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-black/60 p-4 rounded-lg">
            <h2 className="text-xl text-white font-semibold mb-4">
              Top 5 Mismatched Frames
            </h2>
            <ul className="space-y-2">
              {results.frame_analysis?.worst_frames?.map((frame, index) => (
                <li key={index} className="bg-white p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Frame {frame.frame}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTimestampClick(frame.timestamp)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {frame.timestamp}
                      </button>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                        {Math.round(frame.similarity * 100)}%
                      </span>
                    </div>
                  </div>
                  {frame.feedback && (
                    <p className="text-sm text-gray-700 mt-1">
                      {frame.feedback.replace(/\*\*/g, "")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-black/60 p-4 rounded-lg text-white">
          <h2 className="text-xl text-white font-semibold mb-2">
            Similarity Score
          </h2>
          <div className="w-full bg-gray-300 rounded-full h-4">
            <div
              className="bg-blue-500 h-4 rounded-full"
              style={{ width: `${results.similarity * 100}%` }}
            ></div>
          </div>
          <p className="mt-2">{Math.round(results.similarity * 100)}% match</p>
        </div>
      </div>
    </div>
  );
};

export default Results;
