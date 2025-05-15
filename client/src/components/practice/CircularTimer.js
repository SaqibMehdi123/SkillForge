import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Stack, CircularProgress } from '@mui/material';
import { PlayArrow, Pause, Replay, PhotoCamera } from '@mui/icons-material';

const CircularTimer = ({
  isPlaying,
  duration,
  keyProp,
  onComplete,
  onStart,
  onStop,
  onReset,
  onResume,
  onTimeUpdate,
  sessionName,
  sessionIndex,
  totalSessions,
  showCamera,
  onCapture,
  progressColor = '#4caf50',
  inactive,
}) => {
  // State to track remaining time
  const [remainingTime, setRemainingTime] = useState(duration);
  const [timerCompleted, setTimerCompleted] = useState(false);
  
  // Reset timer when duration or key changes
  useEffect(() => {
    setRemainingTime(duration);
    setTimerCompleted(false);
  }, [duration, keyProp]);
  
  // Timer logic
  useEffect(() => {
    let timerId = null;
    
    if (isPlaying && !inactive && !timerCompleted) {
      timerId = setInterval(() => {
        setRemainingTime(prev => {
          // If time is up
          if (prev <= 1) {
            clearInterval(timerId);
            setTimerCompleted(true);
            
            // Notify parent
            if (onComplete) {
              onComplete();
            }
            
            // Notify parent about final time update
            if (onTimeUpdate) {
              onTimeUpdate(0);
            }
            
            return 0;
          }
          
          // Normal decrement
          const newTime = prev - 1;
          
          // Notify parent about time update
          if (onTimeUpdate) {
            onTimeUpdate(newTime);
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [isPlaying, inactive, timerCompleted, onComplete, onTimeUpdate]);
  
  // Calculate progress percentage
  const progress = duration > 0 ? ((duration - remainingTime) / duration) * 100 : 0;
  
  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Button click handlers that update timer state
  const handleStart = useCallback(() => {
    if (timerCompleted) {
      setRemainingTime(duration);
      setTimerCompleted(false);
    }
    
    if (onStart) {
      onStart();
    }
  }, [timerCompleted, duration, onStart]);
  
  const handlePause = useCallback(() => {
    if (onStop) {
      onStop();
    }
  }, [onStop]);
  
  const handleResume = useCallback(() => {
    if (onResume) {
      onResume();
    }
  }, [onResume]);
  
  const handleReset = useCallback(() => {
    setRemainingTime(duration);
    setTimerCompleted(false);
    
    if (onReset) {
      onReset();
    }
  }, [duration, onReset]);
  
  const handleCapture = useCallback(() => {
    if (onCapture) {
      onCapture();
    }
  }, [onCapture]);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        {sessionName}
      </Typography>
      
      {/* Timer with circular progress */}
      <Box 
        sx={{ 
          position: 'relative', 
          width: 260, 
          height: 260, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2
        }}
      >
        {/* Background circle */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={240}
          thickness={6}
          sx={{
            color: theme => theme.palette.grey[200],
            position: 'absolute',
          }}
        />
        
        {/* Progress circle */}
        <CircularProgress
          variant="determinate"
          value={progress}
          size={240}
          thickness={6}
          sx={{
            color: inactive ? 'grey.400' : progressColor,
            position: 'absolute',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
              transition: 'stroke-dashoffset 0.5s ease 0s',
            },
          }}
        />
        
        {/* Timer display */}
        <Box 
          sx={{ 
            position: 'absolute',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1,
            backgroundColor: theme => theme.palette.background.paper,
            borderRadius: '50%',
            width: 200,
            height: 200,
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
          }}
        >
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 'bold', 
              color: inactive ? 'text.disabled' : 'text.primary',
              fontSize: '2.5rem'
            }}
          >
            {formatTime(remainingTime)}
          </Typography>
          <Typography 
            variant="subtitle2" 
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            {totalSessions > 1
              ? `${sessionIndex} of ${totalSessions} Sessions`
              : '1 of 1 Session'}
          </Typography>
        </Box>
      </Box>
      
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        {/* Start/Pause/Resume button logic */}
        {inactive ? (
          <Button variant="contained" color="primary" onClick={handleStart} startIcon={<PlayArrow />}>
            Start
          </Button>
        ) : isPlaying ? (
          <Button variant="contained" color="primary" onClick={handlePause} startIcon={<Pause />}>
            Pause
          </Button>
        ) : timerCompleted ? (
          <Button variant="contained" color="primary" onClick={handleStart} startIcon={<PlayArrow />}>
            Start
          </Button>
        ) : (
          <Button variant="contained" color="primary" onClick={handleResume} startIcon={<PlayArrow />}>
            Resume
          </Button>
        )}
        
        <Button 
          variant="outlined" 
          color="info" 
          onClick={handleReset} 
          startIcon={<Replay />}
          disabled={inactive}
        >
          Reset
        </Button>
        
        {/* Only show capture button when timer completed and showCamera is true */}
        {timerCompleted && showCamera && !isPlaying && !inactive && (
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleCapture} 
            startIcon={<PhotoCamera />}
          >
            Capture
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default CircularTimer; 