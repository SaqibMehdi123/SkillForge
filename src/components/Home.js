import React from 'react';
import { useNavigate } from 'react-router-dom';
import PomodoroTimer from './PomodoroTimer';
import '../App.css';

function Home() {
  const name = localStorage.getItem('name');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h2>Welcome, <span className="user-name">{name}</span></h2>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </nav>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>Focus Timer</h3>
          <PomodoroTimer />
        </div>
      </div>
    </div>
  );
}

export default Home;
