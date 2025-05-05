import React, { useState, useEffect } from 'react';

function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
    setSessionsCompleted((prev) => prev + 1);
    // Play notification sound
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play();
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pomodoro-container">
      <div className="timer-display">
        <div className="time">{formatTime(timeLeft)}</div>
        <div className="sessions">Sessions completed: {sessionsCompleted}</div>
      </div>
      <div className="timer-controls">
        <button 
          className={`timer-button ${isRunning ? 'running' : ''}`} 
          onClick={toggleTimer}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button className="timer-button reset" onClick={resetTimer}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default PomodoroTimer;