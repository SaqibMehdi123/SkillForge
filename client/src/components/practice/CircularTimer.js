import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, Stack, CircularProgress, keyframes, useMediaQuery, useTheme } from '@mui/material';
import { PlayArrow, Pause, Replay, PhotoCamera, Upload } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Define keyframes for more impressive animations
const pulseGradient = keyframes`
  0% { background-position: 0% 50%; filter: brightness(0.9) hue-rotate(0deg); }
  50% { background-position: 100% 50%; filter: brightness(1.1) hue-rotate(10deg); }
  100% { background-position: 0% 50%; filter: brightness(0.9) hue-rotate(0deg); }
`;

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(2deg); }
  50% { transform: translateY(0px) rotate(0deg); }
  75% { transform: translateY(10px) rotate(-2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const rotateGlow = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) rotate(180deg); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) rotate(360deg); opacity: 0.5; }
`;

const shineEffect = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
`;

const breatheAnimation = keyframes`
  0% { transform: scale(0.98); box-shadow: 0 0 0 rgba(124,58,237,0.1); }
  50% { transform: scale(1.02); box-shadow: 0 0 25px rgba(124,58,237,0.4); }
  100% { transform: scale(0.98); box-shadow: 0 0 0 rgba(124,58,237,0.1); }
`;

const rippleEffect = keyframes`
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
`;

const particleFloat = keyframes`
  0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 0.5; }
  100% { transform: translateY(-100px) translateX(${Math.random() * 60 - 30}px) rotate(360deg); opacity: 0; }
`;

// Styled components for enhanced animations
const OuterRing = styled(Box)(({ theme, isActive, isCompleted }) => ({
  position: 'absolute',
  width: 280,
  height: 280,
  borderRadius: '50%',
  background: isActive 
    ? 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 50%, #6d28d9 100%)' 
    : theme.palette.grey[300],
  backgroundSize: '400% 400%',
  animation: isActive ? `${pulseGradient} 8s ease infinite` : 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '5%',
    left: '5%',
    right: '5%',
    bottom: '5%',
    borderRadius: '50%',
    border: `2px solid ${isCompleted ? '#4caf50' : (isActive ? '#a78bfa' : theme.palette.grey[400])}`,
    opacity: 0.6,
    zIndex: 0,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '300%',
    height: '300%',
    top: '50%',
    left: '50%',
    backgroundImage: isActive
      ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(168, 85, 247, 0) 70%)'
      : 'none',
    animation: isActive ? `${rotateGlow} 15s linear infinite` : 'none',
    zIndex: -1,
  },
  transform: isActive ? 'perspective(1200px) rotateX(5deg)' : 'none',
  transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: isActive 
    ? '0 10px 30px rgba(109, 40, 217, 0.2), inset 0 0 20px rgba(167, 139, 250, 0.3)' 
    : 'none',
}));

const MiddleRing = styled(Box)(({ theme, isActive }) => ({
  position: 'relative',
  width: 260,
  height: 260,
  borderRadius: '50%',
  background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(5px)',
  animation: isActive ? `${float} 6s ease-in-out infinite` : 'none',
  transition: 'all 0.5s ease',
  boxShadow: isActive 
    ? '0 5px 15px rgba(0,0,0,0.1)' 
    : '0 2px 5px rgba(0,0,0,0.05)',
}));

const ProgressRing = styled(CircularProgress)(({ theme, isActive, isCompleted, progress }) => ({
  color: isCompleted 
    ? '#4caf50' 
    : (isActive ? 'rgba(167, 139, 250, 0.8)' : theme.palette.grey[400]),
  position: 'absolute',
  filter: isActive 
    ? 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.6))' 
    : 'none',
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
    transition: 'stroke-dashoffset 0.5s ease 0s',
    stroke: isActive 
      ? `url(#gradientId)` 
      : (isCompleted ? '#4caf50' : theme.palette.grey[400]),
  },
}));

const InnerCircle = styled(Box)(({ theme, isActive, isCompleted }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.85)',
  borderRadius: '50%',
  width: 210,
  height: 210,
  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  animation: isActive && !isCompleted ? `${breatheAnimation} 4s ease-in-out infinite` : 'none',
  boxShadow: isActive 
    ? 'inset 0 0 30px rgba(0,0,0,0.2), 0 0 20px rgba(167, 139, 250, 0.2)' 
    : 'inset 0 0 15px rgba(0,0,0,0.1)',
  background: isActive 
    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.9) 100%)` 
    : theme.palette.background.paper,
  backdropFilter: 'blur(10px)',
  border: isCompleted ? `3px solid #4caf50` : 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: '50%',
    border: isActive ? `1px solid rgba(167, 139, 250, 0.2)` : 'none',
  },
}));

const NumberDisplay = styled(Typography)(({ theme, isActive, isCompleted }) => ({
  fontWeight: 'bold',
  fontSize: '3rem',
  color: isCompleted 
    ? '#4caf50' 
    : (isActive ? theme.palette.text.primary : theme.palette.text.disabled),
  textShadow: isActive ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
  backgroundImage: isActive 
    ? 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)' 
    : 'none',
  backgroundClip: isActive ? 'text' : 'none',
  WebkitBackgroundClip: isActive ? 'text' : 'none',
  WebkitTextFillColor: isActive ? 'transparent' : 'inherit',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '200%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    animation: isActive ? `${shineEffect} 4s linear infinite` : 'none',
  }
}));

const RippleCircle = styled(Box)(({ size, delay }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  border: '2px solid rgba(167, 139, 250, 0.5)',
  animation: `${rippleEffect} 2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite`,
  animationDelay: `${delay}s`,
}));

const Particle = styled(Box)(({ size, color, delay }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  backgroundColor: color,
  animation: `${particleFloat} ${2 + Math.random() * 2}s ease-out infinite`,
  animationDelay: `${delay}s`,
  opacity: 0,
}));

const ButtonStyled = styled(Button)(({ theme, glowing }) => ({
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  ...(glowing && {
    boxShadow: '0 0 15px rgba(76, 175, 80, 0.5)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '200%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      animation: `${shineEffect} 2s linear infinite`,
    }
  }),
}));

// Add button styling
const ActionButtonStyled = styled(Button)(({ theme, type }) => ({
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: type === 'capture' 
    ? '0 0 15px rgba(76, 175, 80, 0.3)'
    : '0 0 15px rgba(33, 150, 243, 0.3)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: type === 'capture' 
      ? '0 5px 15px rgba(76, 175, 80, 0.5)'
      : '0 5px 15px rgba(33, 150, 243, 0.5)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

// Create a worker code as a blob
const createWorkerBlob = () => {
  const workerCode = `
    let timerId = null;
    let targetEndTime = null;
    
    self.onmessage = function(e) {
      const { command, remainingTime } = e.data;
      
      if (command === 'start') {
        // Clear any existing timer
        if (timerId) {
          clearInterval(timerId);
        }
        
        // Set the target end time
        targetEndTime = Date.now() + (remainingTime * 1000);
        
        // Start a periodic timer to report back remaining time
        timerId = setInterval(() => {
          const now = Date.now();
          const msRemaining = Math.max(0, targetEndTime - now);
          const secondsRemaining = Math.ceil(msRemaining / 1000);
          
          // Send the current time back to the main thread
          self.postMessage({ 
            type: 'tick', 
            secondsRemaining,
            completed: msRemaining <= 50
          });
          
          // Stop if timer completed
          if (msRemaining <= 50) {
            clearInterval(timerId);
            timerId = null;
          }
        }, 100);
      } 
      else if (command === 'stop') {
        if (timerId) {
          clearInterval(timerId);
          timerId = null;
        }
      }
      else if (command === 'sync') {
        // Just check and report current time without restarting
        if (targetEndTime) {
          const now = Date.now();
          const msRemaining = Math.max(0, targetEndTime - now);
          const secondsRemaining = Math.ceil(msRemaining / 1000);
          
          self.postMessage({ 
            type: 'sync', 
            secondsRemaining,
            completed: msRemaining <= 50
          });
        }
      }
    };
  `;
  
  return URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }));
};

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
  onUpload,
  progressColor = '#4caf50',
  inactive,
  currentTask, // Add currentTask as a prop
}) => {
  // State to track remaining time
  const [remainingTime, setRemainingTime] = useState(duration);
  const [timerCompleted, setTimerCompleted] = useState(false);
  
  // Refs for the worker
  const workerRef = useRef(null);
  const workerBlobURLRef = useRef(null);
  
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Calculate responsive sizes
  const timerSize = isXs ? 220 : isSm ? 260 : 300;
  const outerRingSize = isXs ? 200 : isSm ? 240 : 280;
  const middleRingSize = isXs ? 180 : isSm ? 220 : 260;
  const progressRingSize = isXs ? 170 : isSm ? 210 : 240;
  const innerCircleSize = isXs ? 150 : isSm ? 180 : 210;
  const dotsTransform = isXs ? -88 : isSm ? -103 : -118;
  const fontSize = isXs ? '2.25rem' : isSm ? '2.75rem' : '3rem';
  
  // Store timing information in localStorage to prevent timer reset on page navigation
  useEffect(() => {
    if (currentTask && currentTask.id) {
      const timerKey = `timer_${currentTask.id}`;
      
      // When the timer changes, save it to localStorage
      if (isPlaying) {
        localStorage.setItem(timerKey, JSON.stringify({
          endTime: Date.now() + (remainingTime * 1000),
          isRunning: isPlaying,
          completed: timerCompleted
        }));
      } else if (!isPlaying) {
        localStorage.setItem(timerKey, JSON.stringify({
          remainingTime: remainingTime,
          isRunning: false,
          completed: timerCompleted
        }));
      }
    }
  }, [remainingTime, isPlaying, timerCompleted, currentTask]);
  
  // Initialize the worker
  useEffect(() => {
    // Create the worker blob URL
    workerBlobURLRef.current = createWorkerBlob();
    // Create the worker
    workerRef.current = new Worker(workerBlobURLRef.current);
    
    // Set up message handler
    workerRef.current.onmessage = (e) => {
      const { type, secondsRemaining, completed } = e.data;
      
      if (completed) {
        setRemainingTime(0);
        setTimerCompleted(true);
        
        // Notify parent
        if (onComplete) {
          onComplete();
        }
        
        if (onTimeUpdate) {
          onTimeUpdate(0);
        }
      } else {
        // Only update if changed
        if (secondsRemaining !== remainingTime) {
          setRemainingTime(secondsRemaining);
          
          // Notify parent about time update
          if (onTimeUpdate) {
            onTimeUpdate(secondsRemaining);
          }
        }
      }
    };
    
    // Restore timer state from localStorage if available
    if (currentTask && currentTask.id) {
      const timerKey = `timer_${currentTask.id}`;
      const savedTimer = localStorage.getItem(timerKey);
      
      if (savedTimer) {
        const timerData = JSON.parse(savedTimer);
        
        if (timerData.isRunning) {
          // Calculate remaining time based on saved end time
          const now = Date.now();
          const endTime = timerData.endTime;
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          
          if (remaining > 0) {
            setRemainingTime(remaining);
            if (onTimeUpdate) {
              onTimeUpdate(remaining);
            }
          } else {
            // Timer would have completed
            setRemainingTime(0);
            setTimerCompleted(true);
            if (onComplete) {
              onComplete();
            }
            if (onTimeUpdate) {
              onTimeUpdate(0);
            }
          }
        } else {
          // Timer was paused
          setRemainingTime(timerData.remainingTime);
          setTimerCompleted(timerData.completed);
          if (onTimeUpdate) {
            onTimeUpdate(timerData.remainingTime);
          }
        }
      }
    }
    
    // Cleanup worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      
      if (workerBlobURLRef.current) {
        URL.revokeObjectURL(workerBlobURLRef.current);
      }
    };
  }, []);
  
  // Reset timer when duration or key changes
  useEffect(() => {
    setRemainingTime(duration);
    setTimerCompleted(false);
    
    // Stop any running timer
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'stop' });
    }
  }, [duration, keyProp]);
  
  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When becoming visible again, sync the timer
      if (document.visibilityState === 'visible' && isPlaying && !timerCompleted) {
        if (workerRef.current) {
          workerRef.current.postMessage({ command: 'sync' });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, timerCompleted]);
  
  // Main timer control effect
  useEffect(() => {
    if (isPlaying && !inactive && !timerCompleted) {
      // Start the timer worker
      if (workerRef.current) {
        workerRef.current.postMessage({ 
          command: 'start', 
          remainingTime 
        });
      }
    } else {
      // Stop the timer worker
      if (workerRef.current) {
        workerRef.current.postMessage({ command: 'stop' });
      }
    }
  }, [isPlaying, inactive, timerCompleted, remainingTime]);
  
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
  
  const handleStop = useCallback(() => {
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

  const handleUpload = useCallback(() => {
    if (onUpload) {
      onUpload();
    }
  }, [onUpload]);

  const isActive = !inactive && (isPlaying || timerCompleted);
  
  // Create particles for active timer
  const renderParticles = () => {
    if (!isPlaying) return null;
    
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push(
        <Particle 
          key={i}
          size={Math.random() * 5 + 2}
          color={i % 2 === 0 ? '#a78bfa' : '#6d28d9'}
          delay={Math.random() * 2}
          sx={{ 
            bottom: `${Math.random() * 20 + 100}px`, 
            left: `${Math.random() * (innerCircleSize - 20)}px`
          }}
        />
      );
    }
    return particles;
  };
  
  // Replace the existing buttons with these improved ones
  const renderButtons = () => {
    // Timer not yet started or inactive state
    if (inactive || (!isPlaying && remainingTime === duration)) {
      return (
        <ButtonStyled
          variant="contained"
          color="primary"
          size="large"
          disabled={inactive}
          onClick={handleStart}
          sx={{ 
            borderRadius: '30px',
            px: 3,
            py: 1,
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          <PlayArrow sx={{ mr: 1 }} /> Start
        </ButtonStyled>
      );
    }

    // Timer completed state - show camera and upload buttons
    if (timerCompleted) {
      return (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <ActionButtonStyled
            variant="contained"
            color="success"
            type="capture"
            onClick={handleCapture}
            startIcon={<PhotoCamera />}
            sx={{ 
              borderRadius: '30px',
              px: 2,
              py: 1,
              fontWeight: 'bold',
            }}
          >
            Capture
          </ActionButtonStyled>
          
          <ActionButtonStyled
            variant="contained"
            color="primary"
            type="upload"
            onClick={handleUpload}
            startIcon={<Upload />}
            sx={{ 
              borderRadius: '30px',
              px: 2,
              py: 1,
              fontWeight: 'bold',
            }}
          >
            Upload
          </ActionButtonStyled>
        </Stack>
      );
    }

    // Timer in progress (playing or paused)
    return (
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        {isPlaying ? (
          <ButtonStyled
            variant="outlined"
            color="secondary"
            onClick={handleStop}
            sx={{ 
              borderRadius: '30px',
              minWidth: '120px',
            }}
          >
            <Pause sx={{ mr: 1 }} /> Pause
          </ButtonStyled>
        ) : (
          <ButtonStyled
            variant="contained"
            color="primary"
            onClick={handleResume}
            sx={{ 
              borderRadius: '30px',
              minWidth: '120px',
            }}
          >
            <PlayArrow sx={{ mr: 1 }} /> Resume
          </ButtonStyled>
        )}
        
        <ButtonStyled
          variant="outlined"
          color="error"
          onClick={handleReset}
          sx={{ 
            borderRadius: '30px',
            minWidth: '120px',
          }}
        >
          <Replay sx={{ mr: 1 }} /> Reset
        </ButtonStyled>
      </Stack>
    );
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: { xs: 1, sm: 2 } }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: { xs: 2, sm: 3 }, 
          fontWeight: 'bold', 
          textAlign: 'center',
          color: inactive ? 'text.disabled' : 'text.primary',
          textShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
        }}
      >
        {sessionName || 'No Task Selected'}
      </Typography>
      
      {/* Timer with circular progress */}
      <Box 
        sx={{ 
          position: 'relative', 
          width: timerSize, 
          height: timerSize, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: { xs: 2, sm: 3 },
          perspective: '1200px',
          transformStyle: 'preserve-3d',
          transition: 'all 0.5s ease',
        }}
      >
        <svg width="0" height="0">
          <defs>
            <linearGradient id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6d28d9" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Outer animated ring */}
        <OuterRing isActive={isActive} isCompleted={timerCompleted} 
          sx={{ width: outerRingSize, height: outerRingSize }}
        >
          <MiddleRing isActive={isActive} 
            sx={{ width: middleRingSize, height: middleRingSize }}
          >
            {/* Ripple effects when active */}
            {isPlaying && (
              <>
                <RippleCircle size={middleRingSize - 30} delay={0} />
                <RippleCircle size={middleRingSize - 30} delay={1} />
              </>
            )}
            
            {/* Main progress ring */}
            <ProgressRing
              variant="determinate"
              value={progress}
              size={progressRingSize}
              thickness={isXs ? 6 : 8}
              isActive={isPlaying}
              isCompleted={timerCompleted}
              progress={progress}
            />
            
            {/* Small dots around the circle */}
            {[...Array(24)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  width: i % 2 === 0 ? (isXs ? 3 : 4) : (isXs ? 4 : 6),
                  height: i % 2 === 0 ? (isXs ? 3 : 4) : (isXs ? 4 : 6),
                  borderRadius: '50%',
                  backgroundColor: isActive 
                    ? (i % 3 === 0 ? '#6d28d9' : (i % 3 === 1 ? '#a78bfa' : '#d8b4fe')) 
                    : '#e2e8f0',
                  transform: `rotate(${i * 15}deg) translateY(${dotsTransform}px)`,
                  opacity: isActive ? (i % 4 === 0 ? 0.9 : 0.6) : 0.4,
                  transition: 'all 0.5s ease',
                  boxShadow: isActive && i % 4 === 0 ? '0 0 5px rgba(167, 139, 250, 0.6)' : 'none',
                }}
              />
            ))}
            
            {/* Timer display */}
            <InnerCircle isActive={isActive} isCompleted={timerCompleted}
              sx={{ width: innerCircleSize, height: innerCircleSize }}
            >
              {/* Floating particles when active */}
              {renderParticles()}
              
              <NumberDisplay 
                isActive={isActive} 
                isCompleted={timerCompleted}
                sx={{ fontSize: fontSize }}
              >
                {formatTime(remainingTime)}
              </NumberDisplay>
              
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mt: 2,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'text.primary' : 'text.secondary',
                  letterSpacing: isActive ? '0.5px' : 'normal',
                  transition: 'all 0.3s ease',
                  opacity: isActive ? 1 : 0.8,
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                }}
              >
                {totalSessions > 1
                  ? `${sessionIndex} of ${totalSessions} Sessions`
                  : '1 of 1 Session'}
              </Typography>
            </InnerCircle>
          </MiddleRing>
        </OuterRing>
      </Box>
      
      <Stack 
        direction={isXs ? 'column' : 'row'} 
        spacing={isXs ? 1.5 : 2.5} 
        sx={{ 
          mt: { xs: 1, sm: 2 },
          width: '100%',
          maxWidth: isXs ? timerSize : 'none',
          justifyContent: 'center'
        }}
      >
        {renderButtons()}
      </Stack>
    </Box>
  );
};

export default CircularTimer; 