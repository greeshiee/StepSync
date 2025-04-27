import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const Results = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showData, setShowData] = useState(false);

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
        } else {
          console.error("Invalid data structure in localStorage");
          localStorage.removeItem("analysisResults");
        }
      } catch (e) {
        console.error("Failed to parse analysisResults", e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="p-4">Processing videos...</div>;
  if (!results) return <div className="p-4">No results found</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dance Analysis Results</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <h2 className="text-xl mb-2">Choreography</h2>
          <video
            controls
            className="w-full"
            key={results.video_urls.choreography}
          >
            <source
              src={`http://localhost:5000${results.video_urls.choreography}`}
              type="video/mp4"
            />
          </video>
        </div>
        <div>
          <h2 className="text-xl mb-2">Your Dance</h2>
          <video controls className="w-full" key={results.video_urls.dance}>
            <source
              src={`http://localhost:5000${results.video_urls.dance}`}
              type="video/mp4"
            />
          </video>
        </div>
      </div>

      <div className="mb-8">
        <button
          onClick={() => setShowData(!showData)}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          {showData ? "Hide Analysis Data" : "Show Analysis Data"}
        </button>

        {showData && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-bold">Choreography Data</h3>
              <pre className="text-xs overflow-auto max-h-60">
                {JSON.stringify(results.analysis_data?.choreography, null, 2)}
              </pre>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-bold">Dance Data</h3>
              <pre className="text-xs overflow-auto max-h-60">
                {JSON.stringify(results.analysis_data?.dance, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Similarity Score</h2>
        <div className="w-full bg-gray-300 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full"
            style={{ width: `${results.similarity * 100}%` }}
          ></div>
        </div>
        <p className="mt-2">{Math.round(results.similarity * 100)}% match</p>
      </div>
    </div>
  );
};

export default Results;
