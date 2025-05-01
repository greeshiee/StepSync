// Function to seek to specific frame

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
    <div className="bg-black text-green-400 p-4 rounded-lg shadow-lg h-96 overflow-y-auto font-mono text-sm">
      <h2 className="text-lg font-bold mb-2 text-white">{videoName}</h2>
      {logs.map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
      <div ref={bottomRef} />
    </div>
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
const [selectedVideo, setSelectedVideo] = useState('choreo');
const [videosReady, setVideosReady] = useState({ choreo: false, dance: false });
const [frameDuration, setFrameDuration] = useState(1 / 35); // 35 fps (1/35)
const choreoRef = useRef(null);
const danceRef = useRef(null);
const singleVideoRef = useRef(null);

const seekToFrame = (frameNumber) => {
  // Convert frame number to time in seconds
  const timeInSeconds = frameNumber * frameDuration;
  
  // Seek in the appropriate video(s) based on current view mode
  if (selectedVideo === 'choreo') {
    if (singleVideoRef.current) {
      singleVideoRef.current.currentTime = timeInSeconds;
    }
  } else if (selectedVideo === 'dance') {
    if (singleVideoRef.current) {
      singleVideoRef.current.currentTime = timeInSeconds;
    }
  } else if (selectedVideo === 'both') {
    if (choreoRef.current) {
      choreoRef.current.currentTime = timeInSeconds;
    }
    if (danceRef.current) {
      danceRef.current.currentTime = timeInSeconds;
    }
  }
};

const checkVideoConversion = (video) => {
  fetch(`http://localhost:5000/static/${video}/${video}.mp4`)
    .then((response) => {
      if (response.ok) {
        setVideosReady((prevState) => ({ ...prevState, [video]: true }));
      } else {
        setVideosReady((prevState) => ({ ...prevState, [video]: false }));
      }
    })
    .catch((err) => console.error(`Error checking video: ${err}`));
};

useEffect(() => {
  if (progress1 === 3) {
    checkVideoConversion('choreo');
  }
}, [progress1]);

useEffect(() => {
  if (progress2 === 3) {
    checkVideoConversion('dance');
  }
}, [progress2]);

useEffect(() => {
  if (progress1 === 3 && progress2 === 3) {
    fetch('http://localhost:5000/api/feedback-result')
      .then((res) => res.json())
      .then((data) => {
        const parsedMetrics = {};
        const rawOutput = data.raw_output || [];
        let inExtractedFeatures = false;
        rawOutput.forEach((line) => {
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
        
        // Get video frame rate info if available
        if (data.frame_rate) {
          setFrameDuration(1.0 / data.frame_rate);
        }
        
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
    {progress1 === 3 && progress2 === 3 && (
      <div className="mt-6 p-4 bg-white rounded-lg shadow-lg text-black">
        <h2 className="text-xl font-semibold mb-4">Comparison Video</h2>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            className={`py-1 px-4 rounded text-white ${selectedVideo === 'choreo' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={() => setSelectedVideo('choreo')}
          >
            Choreography
          </button>
          <button
            className={`py-1 px-4 rounded text-white ${selectedVideo === 'dance' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={() => setSelectedVideo('dance')}
          >
            Dance
          </button>
          <button
            className={`py-1 px-4 rounded text-white ${selectedVideo === 'both' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={() => setSelectedVideo('both')}
          >
            Both
          </button>
        </div>
        <div className="flex justify-center">
          {selectedVideo === 'choreo' && videosReady.choreo && (
            <video ref={singleVideoRef} controls className="w-full max-w-3xl rounded shadow">
              <source src="http://localhost:5000/static/choreo/choreo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {selectedVideo === 'dance' && videosReady.dance && (
            <video ref={singleVideoRef} controls className="w-full max-w-3xl rounded shadow">
              <source src="http://localhost:5000/static/dance/dance.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {selectedVideo === 'both' && videosReady.choreo && videosReady.dance && (
            <div className="flex flex-col items-center gap-4 w-full max-w-7xl">
              <button
                onClick={() => {
                  choreoRef.current?.play();
                  danceRef.current?.play();
                }}
                className="py-2 px-6 bg-green-600 text-white rounded hover:bg-green-700 shadow mb-2"
              >
                ▶️ Play Both Videos
              </button>
              <div className="flex flex-row gap-4 w-full">
                <div className="flex-1">
                  <video ref={choreoRef} controls className="w-full rounded shadow">
                    <source src="http://localhost:5000/static/choreo/choreo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex-1">
                  <video ref={danceRef} controls className="w-full rounded shadow">
                    <source src="http://localhost:5000/static/dance/dance.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    
    {feedbackResult && (
      <div className="mt-6 p-4 bg-white rounded-lg shadow-lg text-black">
        <h2 className="text-xl font-semibold mb-4 text-center">Similarity Feedback</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg shadow">
            <p className="mb-2 text-lg font-medium">
              Average Similarity Score
            </p>
            <p className="text-3xl font-bold mb-3">
              {feedbackResult.metrics.naive_euclidean_similarity_score
                ? (feedbackResult.metrics.naive_euclidean_similarity_score * 100).toFixed(2)
                : 'N/A'}
              <span className="text-lg font-normal">/100</span>
            </p>
            {feedbackResult.metrics.naive_euclidean_similarity_score && (
              <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    feedbackResult.metrics.naive_euclidean_similarity_score * 100 >= 80
                      ? 'bg-green-500'
                      : feedbackResult.metrics.naive_euclidean_similarity_score * 100 >= 60
                      ? 'bg-yellow-500'
                      : feedbackResult.metrics.naive_euclidean_similarity_score * 100 >= 40
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${feedbackResult.metrics.naive_euclidean_similarity_score * 100}%`,
                  }}
                ></div>
              </div>
            )}
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg shadow">
            <p className="mb-2 text-lg font-medium">
              Weighted Feature-based Score
            </p>
            <p className="text-3xl font-bold mb-3">
              {feedbackResult.metrics.weighted_feature_based_score
                ? (feedbackResult.metrics.weighted_feature_based_score * 100).toFixed(2)
                : 'N/A'}
              <span className="text-lg font-normal">/100</span>
            </p>
            {feedbackResult.metrics.weighted_feature_based_score && (
              <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    feedbackResult.metrics.weighted_feature_based_score * 100 >= 80
                      ? 'bg-green-500'
                      : feedbackResult.metrics.weighted_feature_based_score * 100 >= 60
                      ? 'bg-yellow-500'
                      : feedbackResult.metrics.weighted_feature_based_score * 100 >= 40
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${feedbackResult.metrics.weighted_feature_based_score * 100}%`,
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="text-lg font-bold mb-2 text-green-600">Top 10 Most Similar Frames</h3>
            <ul className="space-y-1 text-sm">
              {feedbackResult.top_frames.map((frame, index) => (
                <li 
                  key={index}
                  className="flex justify-between items-center p-2 bg-green-50 hover:bg-green-100 rounded-md transition-colors cursor-pointer"
                  onClick={() => seekToFrame(frame.frame)}
                >
                  <span className="font-medium">Frame {frame.frame}</span>
                  <div className="flex items-center">
                    <span className="mr-2">Score: {frame.score.toFixed(2)}/100</span>
                    <span className="text-xs bg-green-600 text-white rounded-full px-2 py-1">
                      Jump to frame →
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2 text-red-600">Top 10 Least Similar Frames</h3>
            <ul className="space-y-1 text-sm">
              {feedbackResult.bottom_frames.map((frame, index) => (
                <li 
                  key={index} 
                  className="flex justify-between items-center p-2 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                  onClick={() => seekToFrame(frame.frame)}
                >
                  <span className="font-medium">Frame {frame.frame}</span>
                  <div className="flex items-center">
                    <span className="mr-2">Score: {frame.score.toFixed(2)}/100</span>
                    <span className="text-xs bg-red-600 text-white rounded-full px-2 py-1">
                      Jump to frame →
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Extracted Features</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-700 border-b border-blue-200 pb-1">Static Features (Single Pose)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(feedbackResult.metrics)
                .filter(([key]) => key.startsWith('static_'))
                .map(([key, value]) => (
                  <div 
                    key={key} 
                    className="bg-gray-50 p-3 rounded-lg shadow-sm relative group cursor-help"
                  >
                    <p>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:</strong>{' '}
                      {value.toFixed(4)}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute z-10 p-3 bg-gray-800 text-white rounded-lg shadow-lg max-w-xs left-1/2 transform -translate-x-1/2 mt-1 text-xs">
                      {key === 'static_mean_keypoint_distance' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.5<br/>
                          <strong>Description:</strong> Average distance between corresponding joints (head to head, knee to knee, etc.) at the midpoint of each segment.<br/>
                          <strong>Interpretation:</strong><br/>
                          • Low (&lt; 0.2) = close match<br/>
                          • High (&gt; 0.4) = big mismatch
                        </div>
                      }
                      {key === 'static_max_keypoint_distance' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 1.0<br/>
                          <strong>Description:</strong> Averaged maximum distance between any single pair of corresponding keypoints at the midpoint of each segment.
                        </div>
                      }
                      {key === 'static_std_keypoint_distance' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.3<br/>
                          <strong>Description:</strong> Standard deviation of all the keypoint distances averaged at the midpoint of each segment.<br/>
                          <strong>Interpretation:</strong><br/>
                          • Low (&lt; 0.1) = uniform match/mismatch<br/>
                          • High (&gt; 0.2) = some parts match, some don't
                        </div>
                      }
                      {key === 'static_mean_angle_diff' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 90.0<br/>
                          <strong>Description:</strong> Average difference in joint bending angles (elbows, knees, shoulders, etc.) in degrees at the midpoint of each segment.
                        </div>
                      }
                      {key === 'static_max_angle_diff' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 180.0<br/>
                          <strong>Description:</strong> The worst (largest) bending difference in degrees.
                        </div>
                      }
                      {key === 'static_symmetry_diff' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.5<br/>
                          <strong>Description:</strong> Difference in body symmetry (left-right) between student and instructor (ratio or normalized difference).
                        </div>
                      }
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-green-700 border-b border-green-200 pb-1">Temporal Features (Motion Over Time)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(feedbackResult.metrics)
                .filter(([key]) => key.startsWith('temporal_'))
                .map(([key, value]) => (
                  <div 
                    key={key} 
                    className="bg-gray-50 p-3 rounded-lg shadow-sm relative group cursor-help"
                  >
                    <p>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:</strong>{' '}
                      {value.toFixed(4)}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute z-10 p-3 bg-gray-800 text-white rounded-lg shadow-lg max-w-xs left-1/2 transform -translate-x-1/2 mt-1 text-xs">
                      {key === 'temporal_mean_velocity_diff' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.1<br/>
                          <strong>Description:</strong> Average difference in motion speed between student and instructor.
                        </div>
                      }
                      {key === 'temporal_mean_acceleration_diff' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.05<br/>
                          <strong>Description:</strong> Average difference in how quickly speed changed (acceleration).
                        </div>
                      }
                      {key === 'temporal_jerk_ratio' && 
                        <div>
                          <strong>Range:</strong> 0.5 - 2.0<br/>
                          <strong>Description:</strong> Student's overall jerkiness vs instructor's. (jerk = rapid acceleration changes)<br/>
                          <strong>Interpretation:</strong><br/>
                          • ≈1.0 (0.9 - 1.1) = similar fluidity<br/>
                          • &gt;1.0 (&gt; 1.2) = student jerkier<br/>
                          • &lt;1.0 (&lt; 0.8) = student smoother
                        </div>
                      }
                      {key === 'temporal_rhythm_count_diff' && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.2<br/>
                          <strong>Description:</strong> Difference in the number of motion energy peaks (moving in pulses, like dance beats, normalized).
                        </div>
                      }
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2 text-purple-700 border-b border-purple-200 pb-1">Body Region Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(feedbackResult.metrics)
                .filter(([key]) => 
                  (key.startsWith('arms_') || key.startsWith('legs_') || key.startsWith('torso_')) &&
                  !['naive_euclidean_similarity_score', 'weighted_feature_based_score'].includes(key)
                )
                .map(([key, value]) => (
                  <div 
                    key={key} 
                    className="bg-gray-50 p-3 rounded-lg shadow-sm relative group cursor-help"
                  >
                    <p>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:</strong>{' '}
                      {value.toFixed(4)}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute z-10 p-3 bg-gray-800 text-white rounded-lg shadow-lg max-w-xs left-1/2 transform -translate-x-1/2 mt-1 text-xs">
                      {key.includes('arms_mean_distance') && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.5<br/>
                          <strong>Description:</strong> How far apart the arms' joints (wrists, elbows, shoulders) were overall (normalized).
                        </div>
                      }
                      {key.includes('arms_max_distance') && 
                        <div>
                          <strong>Range:</strong> 0.0 - 1.0<br/>
                          <strong>Description:</strong> Maximum distance between arm joints at worst moment (normalized).
                        </div>
                      }
                      {key.includes('legs_mean_distance') && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.5<br/>
                          <strong>Description:</strong> How far apart the legs' joints (hips, knees, ankles) were overall (normalized).
                        </div>
                      }
                      {key.includes('legs_max_distance') && 
                        <div>
                          <strong>Range:</strong> 0.0 - 1.0<br/>
                          <strong>Description:</strong> Maximum distance between leg joints at worst moment (normalized).
                        </div>
                      }
                      {key.includes('torso_mean_distance') && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.3<br/>
                          <strong>Description:</strong> How far apart the torso joints (head, spine, hips) were overall (normalized).
                        </div>
                      }
                      {key.includes('torso_max_distance') && 
                        <div>
                          <strong>Range:</strong> 0.0 - 0.6<br/>
                          <strong>Description:</strong> Maximum distance between torso joints at worst moment (normalized).
                        </div>
                      }
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default Progress;