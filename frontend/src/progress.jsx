import React, { useEffect, useState, useRef } from 'react';

const StreamBox = ({ videoName, setProgress1, setProgress2 }) => {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    const eventSource = new EventSource(`http://localhost:5000/api/stream/${videoName}`);

    eventSource.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    eventSource.addEventListener('progress', (event) => {
      const stage = parseInt(event.data);
      if (!isNaN(stage)) {
        setProgress(stage);
        if (videoName === 'choreo.mp4') setProgress1(stage);
        else setProgress2(stage);
      }
    });

    eventSource.onerror = (err) => {
      console.error('Stream error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [videoName, setProgress1, setProgress2]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const progressLabels = ['2D pose complete.', '3D pose complete.', 'Final visualization complete.'];

  return (
    <div>
      {/* Log Output Box */}
      <div className="bg-black text-green-400 p-4 rounded-lg shadow-lg h-96 overflow-y-auto font-mono text-sm">
        <h2 className="text-lg font-bold mb-2 text-white">{videoName}</h2>
        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Progress Bar Below */}
      <div className="mt-2">
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-500"
            style={{ width: `${(progress / 3) * 100}%` }}
          />
        </div>
        <p className="text-base text-center mt-1 text-black">
          {progress > 0 ? `Progress: ${progressLabels[progress - 1]}` : 'Waiting for progress...'}
        </p>
      </div>
    </div>
  );
};

const Progress = () => {
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);
  const [feedbackResult, setFeedbackResult] = useState(null);

  useEffect(() => {
    if (progress1 === 3 && progress2 === 3) {
      fetch('http://localhost:5000/api/feedback-result')
        .then((res) => res.json())
        .then((data) => {
          // fill metrics obj
          const parsedMetrics = {};
          const rawOutput = data.raw_output || [];
          let inExtractedFeatures = false;

          rawOutput.forEach((line) => {
            // check for feats.
            if (line.includes('--- Extracted Features ---')) {
              inExtractedFeatures = true;
              return;
            }

            if (inExtractedFeatures) {
              if (line.startsWith('Naive Euclidean Similarity Score:')) {
                const scoreText = line.split(':')[1].split('(')[0].trim();
                const score = parseFloat(scoreText);
                parsedMetrics.naive_euclidean_similarity_score = score;
              } else if (line.startsWith('Weighted Feature-based Score:')) {
                const scoreText = line.split(':')[1].split('(')[0].trim();
                const score = parseFloat(scoreText);
                parsedMetrics.weighted_feature_based_score = score;
              } else if (line.includes(':')) {
                const [key, value] = line.split(':');
                if (key && value) {
                  const cleanedKey = key.trim().toLowerCase();
                  const cleanedValue = parseFloat(value.trim());
                  if (!isNaN(cleanedValue)) {
                    parsedMetrics[cleanedKey] = cleanedValue;
                  }
                }
              }
            }
          });
          
          data.metrics = parsedMetrics;
          setFeedbackResult(data);
        });
    }
  }, [progress1, progress2]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-center">Processing Progress</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StreamBox videoName="choreo.mp4" setProgress1={setProgress1} setProgress2={setProgress2} />
        <StreamBox videoName="dance.mp4" setProgress1={setProgress1} setProgress2={setProgress2} />
      </div>

      {feedbackResult && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-lg text-black">
          <h2 className="text-xl font-semibold mb-2">Similarity Feedback</h2>
          <p>
            Average Similarity Score:{' '}
            <strong>
              {feedbackResult.metrics.naive_euclidean_similarity_score
                ? (feedbackResult.metrics.naive_euclidean_similarity_score * 100).toFixed(2)
                : 'N/A'}
              /100
            </strong>
          </p>
          <p>
            Weighted Feature-based Score:{' '}
            <strong>
              {feedbackResult.metrics.weighted_feature_based_score
                ? (feedbackResult.metrics.weighted_feature_based_score * 100).toFixed(2)
                : 'N/A'}
              /100
            </strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Top 10 */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-green-600">Top 10 Most Similar Frames</h3>
              <ul className="space-y-1 text-sm list-disc list-inside">
                {feedbackResult.top_frames.map((frame, index) => (
                  <li key={index}>
                    Frame {frame.frame} — Score: {frame.score.toFixed(2)}/100
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom 10 */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-red-600">Top 10 Least Similar Frames</h3>
              <ul className="space-y-1 text-sm list-disc list-inside">
                {feedbackResult.bottom_frames.map((frame, index) => (
                  <li key={index}>
                    Frame {frame.frame} — Score: {frame.score.toFixed(2)}/100
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Display Extracted Features */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Extracted Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(feedbackResult.metrics)
                .filter(
                  ([key]) =>
                    !['naive_euclidean_similarity_score', 'weighted_feature_based_score'].includes(key)
                )
                .map(([key, value]) => (
                  <p key={key}>
                    <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:</strong>{' '}
                    {value.toFixed(4)}
                  </p>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;