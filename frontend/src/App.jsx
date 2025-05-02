import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './Homepage';
import VideoUpload from './VideoUpload';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/upload" element={<VideoUpload />} />
      </Routes>
    </Router>
  );
}
