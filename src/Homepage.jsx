import React from 'react';
import { useNavigate } from 'react-router-dom'; 

const Homepage = () => {
  const navigate = useNavigate(); // init navigate function

  const handleGetStarted = () => {
    navigate('/dashboard'); 
  };

  const containerStyle = {
    height: '80vh', 
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden' 
  };
  
  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb'
  };
  
  const buttonStyle = {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    marginLeft: '8px'
  };
  
  const mainContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '350px', 
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      {/* Nav Bar */}
      <nav style={navStyle}>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '20px' }}>StepSync</span>
        </div>
        <div>
          <button style={buttonStyle}>Sign In</button>
          <button style={buttonStyle}>Create Account</button>
        </div>
      </nav>

      {/* Content */}
      <div style={mainContainerStyle}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
          Free personalized dance trainer
        </h1>
        <p style={{ marginBottom: '32px' }}>
          Upload the choreography and your dance and receive feedback in minutes
        </p>
        <button 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#9ca3af', 
            color: 'white',
            borderRadius: '4px'
          }} 
          onClick={handleGetStarted} // go to dashboard.jsx
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Homepage;
