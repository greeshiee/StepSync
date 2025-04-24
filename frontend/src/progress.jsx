import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";

const Progress = () => {
  const [log, setLog] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:5000/api/feedback-stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.done) {
        setDone(true);
        eventSource.close();
      } else {
        setLog((prev) => prev + data.message + "\n");
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setDone(true);
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Generating Feedback...</h1>
        <div className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded-md h-[400px] overflow-y-auto border border-gray-300">
          {log || "Awaiting feedback stream..."}
        </div>
        {done && (
          <div className="mt-4 text-green-600 font-semibold">
            Feedback complete!
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
