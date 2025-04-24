import React, { useEffect, useState, useRef } from 'react';

const StreamBox = ({ videoName }) => {
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    const eventSource = new EventSource(`http://localhost:5000/api/stream/${videoName}`);

    eventSource.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    eventSource.onerror = (err) => {
      console.error('Stream error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [videoName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-black text-green-400 p-4 rounded-lg shadow-lg h-96 overflow-y-auto font-mono text-sm">
      <h2 className="text-lg font-bold mb-2 text-white">{videoName}</h2>
      {logs.map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

const Progress = () => {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-center">Processing Progress</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StreamBox videoName="choreo.mp4" />
        <StreamBox videoName="dance.mp4" />
      </div>
    </div>
  );
};

export default Progress;
