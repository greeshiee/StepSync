import React from 'react';

const Dashboard = () => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100vh',
    padding: '20px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    marginLeft: '8px',
  };

  const mainTitleStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    marginTop: '50px',
    textAlign: 'left',
    width: '75%',

  };

  const boxStyle = {
    width: '75%',  
    height: '100px', 
    backgroundColor: 'white', 
    border: '2px solid black',
    borderRadius: '2px', 
    marginTop: '30px', 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: '20px',
  };

  return (
    <div style={containerStyle}>
      <nav style={headerStyle}>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '20px' }}>StepSync</span>
        </div>
        <div>
          <button style={buttonStyle}>Sign In</button>
          <button style={buttonStyle}>Create Account</button>
        </div>
      </nav>

      {/* title */}
      <h1 style={mainTitleStyle}>Your Dances</h1>

      {/* analyze box */}
      <div style={boxStyle}>
        <p style={{ fontSize: '18px', color: 'black' }}>
            +  Analyze new dance
        </p>
        </div>
    </div>
  );
};

export default Dashboard;
