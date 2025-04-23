import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage";
import Dashboard from "./Dashboard";
import VideoUpload from "./VideoUpload";
import Result from "./Result";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<VideoUpload />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
