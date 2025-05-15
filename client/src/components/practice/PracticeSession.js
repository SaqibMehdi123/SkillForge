import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Grid, 
  IconButton, 
  Typography, 
  Button, 
  LinearProgress, 
  Stack,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  ImageList,
  ImageListItem,
  Divider,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { CalendarToday, Assignment, Photo } from '@mui/icons-material';
import CircularTimer from './CircularTimer';
import AddTaskModal from './AddTaskModal';
import Webcam from 'react-webcam';
import {
  addTask,
  startTask,
  pauseTask,
  resumeTask,
  updateTaskTime,
  completeTask,
  stopTask,
  setTaskImage,
  getUserPhotos,
  saveTaskPhoto
} from '../../features/practice/practiceSlice';

function getCurrentWeek() {
  const today = new Date();
  const week = [];
  const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    });
  }
  return week;
}

const PracticeSession = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const webcamRef = useRef(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const week = getCurrentWeek();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

  const tasks = useSelector((state) => state.practice.tasks);
  const completedTasks = useSelector((state) => state.practice.completedTasks);
  const currentTask = useSelector((state) => state.practice.currentTask);
  const user = useSelector((state) => state.auth.user);
  const themeMode = useSelector((state) => state.theme.mode);
  const serverPhotos = useSelector((state) => state.practice.photos);

  const sessionIndex = currentTask ? tasks.findIndex(t => t.id === currentTask.id) + 1 : 1;
  const totalSessions = tasks.length;

  // Save current practice session location to localStorage
  useEffect(() => {
    if (location.pathname === '/practice') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location.pathname]);
  
  // Also save the location when current task changes
  useEffect(() => {
    if (currentTask && location.pathname === '/practice') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [currentTask, location.pathname]);

  // Load photos from server on component mount
  useEffect(() => {
    dispatch(getUserPhotos());
  }, [dispatch]);

  // Add a new task
  const handleAddTask = (task) => {
    // Create the task with the label property set to the task name
    const newTask = {
      ...task,
      label: task.name // Ensure the label property is set from the name field
    };
    dispatch(addTask(newTask));
  };

  // Start timer for selected task
  const handleStart = (taskId) => {
    dispatch(startTask(taskId));
  };
  
  const handlePause = () => {
    dispatch(pauseTask());
  };
  
  const handleResume = () => {
    dispatch(resumeTask());
  };
  
  const handleReset = () => {
    dispatch(stopTask());
  };
  
  const handleComplete = () => {
    // Timer has completed, the camera button will automatically appear
    // No action needed here - CircularTimer component handles the state
  };
  
  // Simplified update time handler - now the timer manages updates itself
  const handleUpdateTime = (remaining) => {
    if (currentTask) {
      dispatch(updateTaskTime(remaining));
    }
  };
  
  const openCamera = () => {
    setCameraOpen(true);
  };
  
  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      // Get complete task information
      const taskName = currentTask?.label || currentTask?.name || 'Untitled Task';
      const taskCategory = currentTask?.category || 'general';
      const taskPriority = currentTask?.priority || 'medium';
      const timestamp = new Date().toISOString();
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Save to local state for immediate display
      const newPhoto = {
        id: Date.now(),
        userId: user.id,
        image: imageSrc,
        taskName: taskName,
        taskCategory: taskCategory,
        taskPriority: taskPriority,
        timestamp: timestamp,
        formattedDate: formattedDate
      };
      setCapturedPhotos(prev => [...prev, newPhoto]);
      
      // Save to Redux store for state management
      dispatch(setTaskImage(imageSrc));
      
      // Save to server with complete task info
      dispatch(saveTaskPhoto({ 
        imageData: imageSrc, 
        taskName: taskName,
        taskCategory: taskCategory,
        taskPriority: taskPriority,
        timestamp: timestamp
      }));
      
      // Complete the task and close the camera
      dispatch(completeTask());
      setCameraOpen(false);
    }
  };

  const openGallery = () => {
    setGalleryOpen(true);
  };

  // Combine local photos with server photos for display
  const userPhotos = [
    ...capturedPhotos.filter(photo => photo.userId === user.id),
    ...serverPhotos.map(photo => ({
      id: photo.id,
      userId: photo.userId,
      image: `http://localhost:5000${photo.path}`,
      taskName: photo.taskName || 'Task',
      taskCategory: photo.taskCategory || 'general',
      taskPriority: photo.taskPriority || 'medium',
      timestamp: photo.createdAt,
      formattedDate: photo.createdAt ? new Date(photo.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Unknown date'
    }))
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: themeMode === 'light' 
          ? 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ff 100%)' 
          : 'linear-gradient(135deg, #1a1f35 0%, #232946 100%)',
        transition: 'background 0.3s',
        py: { xs: 1, sm: 2, md: 6 },
        px: { xs: 0.5, sm: 1, md: 3 },
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={6}
          sx={{
            borderRadius: { xs: 2, md: 4 },
            overflow: 'hidden',
            bgcolor: themeMode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(35,41,70,0.9)',
          }}
        >
          <Grid container>
            <Grid item xs={12} md={11} lg={10} sx={{ mx: 'auto' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'stretch',
                  justifyContent: 'space-between',
                  minHeight: { xs: 'auto', md: '80vh' },
                  position: 'relative',
                  px: { xs: 1.5, sm: 2, md: 6 },
                  py: { xs: 2, sm: 3, md: 5 },
                }}
              >
                {/* Left Side: Calendar and Task List */}
                <Box 
                  sx={{ 
                    flex: { xs: '1 1 auto', md: 1 }, 
                    pr: { md: 4 }, 
                    mb: { xs: 4, md: 0 },
                    borderRight: { md: 1 },
                    borderColor: 'divider',
                  }}
                >
                  {/* Calendar Strip with better styling */}
                  <Box sx={{ mb: { xs: 3, md: 4 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CalendarToday fontSize="small" color="primary" />
                      <Typography variant="h6">This Week</Typography>
                    </Stack>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 2,
                        bgcolor: themeMode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(45,51,80,0.8)',
                        width: '100%',
                        overflowX: 'auto',
                      }}
                    >
                      <Stack 
                        direction="row" 
                        spacing={0.5} 
                        justifyContent={{ xs: 'flex-start', sm: 'space-between' }}
                        sx={{ overflowX: 'auto', pb: 1, minWidth: { xs: 340, sm: 'auto' } }}
                      >
                        {week.map((d) => (
                          <Box
                            key={d.day + d.date}
                            sx={{
                              width: { xs: 38, sm: 42 },
                              height: { xs: 54, sm: 60 },
                              flexShrink: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 2,
                              bgcolor: d.isToday ? 'primary.main' : 'transparent',
                              color: d.isToday ? 'white' : 'text.primary',
                              fontWeight: d.isToday ? 'bold' : 'normal',
                              boxShadow: d.isToday ? 2 : 0,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: d.isToday ? 'primary.main' : 'action.hover',
                              }
                            }}
                          >
                            <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
                              {d.date}
                            </Typography>
                            <Typography variant="caption" align="center">
                              {d.day}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Box>
                  
                  {/* Task List Panel */}
                  <Box sx={{ width: '100%', mb: { xs: 3, md: 4 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Assignment fontSize="small" color="primary" />
                      <Typography variant="h6">Task List</Typography>
                    </Stack>
                    
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        borderRadius: 2,
                        bgcolor: themeMode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(45,51,80,0.8)',
                        maxHeight: { xs: 240, sm: 280, md: 340 },
                        overflowY: 'auto'
                      }}
                    >
                      {tasks.length === 0 && completedTasks.length === 0 && (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No tasks yet. Add a task to get started!
                        </Typography>
                      )}
                      
                      {tasks.map((task) => (
                        <Paper 
                          key={task.id}
                          elevation={currentTask && currentTask.id === task.id ? 3 : 1}
                          sx={{ 
                            mb: { xs: 1.5, sm: 2 }, 
                            p: { xs: 1.5, sm: 2 }, 
                            borderRadius: 2, 
                            bgcolor: currentTask && currentTask.id === task.id 
                              ? (themeMode === 'light' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.15)') 
                              : (themeMode === 'light' ? 'white' : 'rgba(55,61,90,0.6)'), 
                            cursor: 'pointer',
                            border: currentTask && currentTask.id === task.id ? '1px solid #4caf50' : 'none',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: currentTask && currentTask.id === task.id 
                                ? (themeMode === 'light' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.2)') 
                                : (themeMode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(65,71,100,0.7)'),
                            }
                          }} 
                          onClick={() => handleStart(task.id)}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box 
                              sx={{ 
                                width: { xs: 20, sm: 24 }, 
                                height: { xs: 20, sm: 24 }, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: '50%',
                                border: '2px solid',
                                borderColor: currentTask && currentTask.id === task.id 
                                  ? 'primary.main' 
                                  : 'text.secondary',
                                flexShrink: 0
                              }}
                            >
                              {task.completed && (
                                <Box 
                                  sx={{ 
                                    width: { xs: 10, sm: 12 }, 
                                    height: { xs: 10, sm: 12 }, 
                                    borderRadius: '50%', 
                                    bgcolor: 'primary.main' 
                                  }}
                                />
                              )}
                            </Box>
                            
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body1" noWrap>{task.label}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {task.category} | {task.priority} priority
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={task.progress || 0}
                                  sx={{ 
                                    height: { xs: 6, sm: 8 }, 
                                    borderRadius: 5, 
                                    width: '100%', 
                                    mr: 1,
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: currentTask && currentTask.id === task.id 
                                        ? 'primary.main' 
                                        : '#9e9e9e',
                                    }
                                  }}
                                />
                                <Typography variant="caption" sx={{ minWidth: '40px', textAlign: 'right', fontWeight: 'bold' }}>
                                  {task.progress || 0}%
                                </Typography>
                              </Box>
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                      
                      {/* Completed Tasks */}
                      {completedTasks.length > 0 && (
                        <Box sx={{ mt: 3, mb: 2 }}>
                          <Divider sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">COMPLETED</Typography>
                          </Divider>
                          
                          {completedTasks.map((task) => (
                            <Paper
                              key={task.id}
                              elevation={0}
                              sx={{ 
                                mb: { xs: 1.5, sm: 2 }, 
                                p: { xs: 1.5, sm: 2 }, 
                                borderRadius: 2, 
                                bgcolor: themeMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Box 
                                  sx={{ 
                                    width: { xs: 20, sm: 24 }, 
                                    height: { xs: 20, sm: 24 }, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    border: '2px solid #9e9e9e',
                                    flexShrink: 0
                                  }}
                                >
                                  <Box 
                                    sx={{ 
                                      width: { xs: 10, sm: 12 }, 
                                      height: { xs: 10, sm: 12 }, 
                                      borderRadius: '50%', 
                                      bgcolor: '#9e9e9e' 
                                    }}
                                  />
                                </Box>
                                
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }} noWrap>
                                    {task.label}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {task.category} | {task.priority} priority
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={100}
                                      sx={{ 
                                        height: { xs: 6, sm: 8 }, 
                                        borderRadius: 5, 
                                        width: '100%', 
                                        mr: 1, 
                                        opacity: 0.6,
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: '#9e9e9e',
                                        }
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ minWidth: '40px', textAlign: 'right' }}>
                                      100%
                                    </Typography>
                                  </Box>
                                </Box>
                              </Stack>
                            </Paper>
                          ))}
                        </Box>
                      )}
                      
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={{ xs: 1, sm: 2 }} 
                        sx={{ mt: 3 }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ 
                            py: { xs: 1, sm: 1.5 }, 
                            borderRadius: 2,
                            fontWeight: 'bold',
                            boxShadow: 2,
                          }}
                          onClick={() => setAddTaskOpen(true)}
                        >
                          Add a Task
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          fullWidth
                          sx={{ 
                            py: { xs: 1, sm: 1.5 }, 
                            borderRadius: 2,
                            fontWeight: 'bold',
                          }}
                          onClick={openGallery}
                          startIcon={<Photo />}
                        >
                          Gallery
                        </Button>
                      </Stack>
                    </Paper>
                  </Box>
                </Box>
                
                {/* Right Side: Timer */}
                <Box 
                  sx={{ 
                    flex: { xs: '1 1 auto', md: 1 }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    pl: { md: 4 },
                    pt: { xs: 2, md: 0 },
                    mt: { xs: 2, md: 0 },
                    borderTop: { xs: '1px solid', md: 'none' },
                    borderColor: 'divider',
                  }}
                >
                  <CircularTimer
                    isPlaying={currentTask?.isRunning}
                    duration={currentTask ? currentTask.remaining : 1800}
                    keyProp={currentTask ? currentTask.id : 'inactive'}
                    onComplete={handleComplete}
                    onStart={() => handleStart(currentTask?.id)}
                    onStop={handlePause}
                    onResume={handleResume}
                    onReset={handleReset}
                    onTimeUpdate={handleUpdateTime}
                    sessionName={currentTask ? currentTask.label : 'No Task Selected'}
                    sessionIndex={sessionIndex}
                    totalSessions={totalSessions}
                    showCamera={!!currentTask}
                    onCapture={openCamera}
                    progressColor={['#4caf50']}
                    inactive={!currentTask}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Add Task Modal */}
        <AddTaskModal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} onCreate={handleAddTask} />
        
        {/* Camera Modal */}
        <Dialog 
          open={cameraOpen} 
          onClose={() => setCameraOpen(false)} 
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: { xs: 2, sm: 3 },
              boxShadow: 24,
              bgcolor: themeMode === 'light' ? 'white' : '#1e2235',
              m: { xs: 1, sm: 2 },
              width: { xs: 'calc(100% - 16px)', sm: 'auto' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
            Capture Your Progress
          </DialogTitle>
          
          <DialogContent dividers>
            <Box sx={{ width: '100%', p: { xs: 0.5, sm: 1 } }}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={{ 
                  width: '100%', 
                  borderRadius: 12, 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}
              />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => setCameraOpen(false)} 
              variant="outlined"
              sx={{ borderRadius: 2, px: { xs: 2, sm: 3 } }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCapture} 
              variant="contained" 
              color="success"
              sx={{ borderRadius: 2, px: { xs: 2, sm: 3 }, fontWeight: 'bold' }}
            >
              Capture & Complete
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Gallery Modal */}
        <Dialog 
          open={galleryOpen} 
          onClose={() => setGalleryOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: { xs: 2, sm: 3 },
              boxShadow: 24,
              bgcolor: themeMode === 'light' ? 'white' : '#1e2235',
              m: { xs: 1, sm: 2 },
              width: { xs: 'calc(100% - 16px)', sm: 'auto' }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
            Your Practice Photos
          </DialogTitle>
          
          <DialogContent dividers>
            {userPhotos.length === 0 ? (
              <Typography variant="body1" sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
                No photos yet. Complete tasks to build your gallery!
              </Typography>
            ) : (
              <ImageList cols={isMobile ? 1 : (isSm ? 2 : 3)} gap={8}>
                {userPhotos.map((photo) => (
                  <ImageListItem 
                    key={photo.id}
                    sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      boxShadow: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 4,
                      }
                    }}
                  >
                    <img 
                      src={photo.image} 
                      alt={photo.taskName} 
                      loading="lazy"
                      style={{ aspectRatio: '3/2', objectFit: 'cover' }}
                    />
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        bgcolor: themeMode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }} noWrap>
                        {photo.taskName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <span>{photo.taskCategory} • {photo.taskPriority} priority</span>
                        <span>{photo.formattedDate || new Date(photo.timestamp).toLocaleDateString()}</span>
                      </Typography>
                    </Box>
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Button 
              onClick={() => setGalleryOpen(false)}
              variant="contained"
              sx={{ borderRadius: 2, px: { xs: 2, sm: 3 } }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PracticeSession; 