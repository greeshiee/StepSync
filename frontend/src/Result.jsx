import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ResultsPage = () => {
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedResults = localStorage.getItem("analysisResults");
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        console.log("Loaded results:", parsed); // Check what was saved
        setResults(parsed);
      } catch (e) {
        console.error("Error parsing results:", e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dance Analysis Results</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <h2 className="text-xl mb-2">Choreography</h2>
          <video controls className="w-full">
            <source
              src={`http://localhost:5000${results.choreography_url}`}
              type="video/mp4"
            />
          </video>
        </div>
        <div>
          <h2 className="text-xl mb-2">Your Dance</h2>
          <video controls className="w-full">
            <source
              src={`http://localhost:5000${results.dance_url}`}
              type="video/mp4"
            />
          </video>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Similarity Score</h2>
        <div className="w-full bg-gray-300 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full"
            style={{ width: `${results.analysis.similarity_score * 100}%` }}
          ></div>
        </div>
        <p className="mt-2">
          {Math.round(results.analysis.similarity_score * 100)}% match
        </p>
      </div>
    </div>
  );
};

export default ResultsPage;
