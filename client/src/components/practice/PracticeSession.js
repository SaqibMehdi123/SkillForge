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
  useMediaQuery,
  Card,
  CardContent,
  Fab,
  Tabs,
  Tab,
  Chip,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  CalendarToday, 
  Assignment, 
  Photo, 
  FileUpload, 
  Add as AddIcon,
  AccessTime,
  ArrowUpward,
  ArrowDownward,
  Dashboard,
  History 
} from '@mui/icons-material';
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
  saveTaskPhoto,
  savePracticeSession,
  getUserPracticePhotos,
  getHistory
} from '../../features/practice/practiceSlice';
import { updateUserStreak } from '../../features/auth/authSlice';
import { setNavbarTitle } from '../../features/ui/uiSlice';

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
  const fileInputRef = useRef(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
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
  const practicePhotos = useSelector((state) => state.practice.practicePhotos);

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
    dispatch(getUserPracticePhotos()); // Also load practice photos
    dispatch(getHistory()); // Load practice history
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
    // Save the practice session when the timer completes
    if (currentTask) {
      // Create session data
      dispatch(savePracticeSession({
        ...currentTask,
        image: currentTask.image || null
      }))
        .then((result) => {
          console.log('Practice session saved automatically on completion:', result);
          dispatch(completeTask());
          // Load updated history after completing task
          dispatch(getHistory());
        })
        .catch(error => {
          console.error('Error saving practice session on completion:', error);
        });
    }
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
      
      // Save practice session data and get the session ID
      if (currentTask) {
        dispatch(savePracticeSession({
          ...currentTask,
          image: imageSrc
        }))
          .then((result) => {
            // After session is saved, save the photo with the session ID
            if (result.payload && result.payload.session && result.payload.session._id) {
              // Save to server with complete task info and session ID
              dispatch(saveTaskPhoto({ 
                imageData: imageSrc, 
                taskName: taskName,
                taskCategory: taskCategory,
                taskPriority: taskPriority,
                timestamp: timestamp,
                sessionId: result.payload.session._id // Link photo to session
              }));
            } else {
              // Fallback if no session ID is returned
      dispatch(saveTaskPhoto({ 
        imageData: imageSrc, 
        taskName: taskName,
        taskCategory: taskCategory,
        taskPriority: taskPriority,
        timestamp: timestamp
      }));
            }
      
      // Complete the task and close the camera
            dispatch(completeTask());
            setCameraOpen(false);
          });
      } else {
        // If no current task, just save the photo without session ID
        dispatch(saveTaskPhoto({ 
          imageData: imageSrc, 
          taskName: taskName,
          taskCategory: taskCategory,
          taskPriority: taskPriority,
          timestamp: timestamp
        }));
      dispatch(completeTask());
      setCameraOpen(false);
      }
    }
  };

  // Open the file upload dialog
  const openUpload = () => {
    // Directly open the file picker dialog
    fileInputRef.current.click();
  };
  
  // Handle file selection for upload
  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Read the image file as data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result;
      // Store the image temporarily and show confirmation dialog
      setUploadedImage({
        file,
        imageData,
        fileName: file.name
      });
      setUploadConfirmOpen(true);
    };
    
    reader.readAsDataURL(file);
  };

  // Handle confirming the upload
  const confirmUpload = () => {
    if (!uploadedImage) return;
    
    const imageData = uploadedImage.imageData;
      
      // Get complete task information (same as in handleCapture)
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
        image: imageData,
        taskName: taskName,
        taskCategory: taskCategory,
        taskPriority: taskPriority,
        timestamp: timestamp,
        formattedDate: formattedDate
      };
      setCapturedPhotos(prev => [...prev, newPhoto]);
      
      // Save to Redux store for state management
      dispatch(setTaskImage(imageData));
      
    // Save practice session data and get the session ID
    if (currentTask) {
      dispatch(savePracticeSession({
        ...currentTask,
        image: imageData
      }))
        .then((result) => {
          // After session is saved, save the photo with the session ID
          if (result.payload && result.payload.session && result.payload.session._id) {
            // Save to server with complete task info and session ID
            dispatch(saveTaskPhoto({ 
              imageData: imageData, 
              taskName: taskName,
              taskCategory: taskCategory,
              taskPriority: taskPriority,
              timestamp: timestamp,
              sessionId: result.payload.session._id // Link photo to session
            }));
          } else {
            // Fallback if no session ID is returned
      dispatch(saveTaskPhoto({ 
        imageData: imageData, 
        taskName: taskName,
        taskCategory: taskCategory,
        taskPriority: taskPriority,
        timestamp: timestamp
      }));
          }
      
          // Complete the task and show gallery
      dispatch(completeTask());
          setUploadConfirmOpen(false); // Close confirmation
          setGalleryOpen(true); // Show gallery so user can see the uploaded image
        });
    } else {
      // If no current task, just save the photo without session ID
      dispatch(saveTaskPhoto({ 
        imageData: imageData, 
        taskName: taskName,
        taskCategory: taskCategory,
        taskPriority: taskPriority,
        timestamp: timestamp
      }))
      .then(() => {
        dispatch(completeTask());
        setUploadConfirmOpen(false); // Close confirmation
        setGalleryOpen(true); // Show gallery so user can see the uploaded image
      });
    }
    
    // Clean up
    setUploadedImage(null);
    // Reset the file input - using fileInputRef instead of event
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openGallery = () => {
    setGalleryOpen(true);
  };

  // Combine local photos with server photos for display
  const userPhotos = (() => {
    // Step 1: Start with local photos (captured in this session)
    let combinedPhotos = capturedPhotos.filter(photo => photo.userId === user.id);
    
    // Step 2: Add server photos with full URLs
    const serverPhotosList = serverPhotos.map(photo => ({
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
      }) : 'Unknown date',
      path: photo.path // Store original path for deduplication
    }));
    
    // Step 3: Add practice photos with URLs
    const practicePhotosList = (practicePhotos || [])
      .filter(photo => photo.image || photo.url || photo.path) // Only include photos with valid images
      .map(photo => ({
        id: photo.id || photo._id,
        userId: photo.userId || user.id,
        image: photo.url || (photo.path ? `http://localhost:5000${photo.path}` : photo.image),
        taskName: photo.skillName || photo.taskName || 'Practice Task',
        taskCategory: photo.category || 'practice',
        taskPriority: photo.priority || 'medium',
        timestamp: photo.date || photo.createdAt || photo.timestamp,
        formattedDate: photo.date || photo.createdAt || photo.timestamp ? 
          new Date(photo.date || photo.createdAt || photo.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Unknown date',
        path: photo.path || photo.url // Store original path for deduplication
      }));
    
    // Step 4: Deduplicate photos by checking paths/URLs
    // Track which photos we've already added
    const photoPathMap = new Map();
    const uniquePhotos = [];
    
    const addUniquePhoto = (photo) => {
      // For data URLs, use a different approach
      if (photo.image && photo.image.startsWith('data:')) {
        // For data URLs, we don't have a reliable way to deduplicate,
        // so add them all unless they're exact matches
        if (!uniquePhotos.some(p => p.image === photo.image)) {
          uniquePhotos.push(photo);
        }
        return;
      }
      
      // Extract the filename for comparison
      let imagePath = '';
      if (photo.path) {
        imagePath = photo.path;
      } else if (photo.image) {
        // Extract filename from URL or path
        const parts = photo.image.split('/');
        imagePath = parts[parts.length - 1];
      }
      
      if (imagePath && !photoPathMap.has(imagePath)) {
        photoPathMap.set(imagePath, true);
        uniquePhotos.push(photo);
      }
    };
    
    // Process all photos
    combinedPhotos.forEach(addUniquePhoto);
    serverPhotosList.forEach(addUniquePhoto);
    practicePhotosList.forEach(addUniquePhoto);
    
    // Sort by timestamp, newest first
    return uniquePhotos.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  })();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: themeMode === 'light' 
          ? 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ff 100%)' 
          : 'linear-gradient(135deg, #1a1f35 0%, #232946 100%)',
        transition: 'background 0.3s',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={3}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: themeMode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(35,41,70,0.9)',
          }}
        >
          {/* Dashboard Header */}
              <Box
                sx={{
              p: { xs: 2, sm: 3 },
              background: themeMode === 'light' 
                ? 'linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)'
                : 'linear-gradient(90deg, #3a4a7b 0%, #5d4a8a 100%)',
              color: 'white',
                  display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold">Practice Dashboard</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {currentTask 
                  ? `Currently working on: ${currentTask.label || currentTask.name}`
                  : 'Start a practice session to improve your skills'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Gallery">
                <Button 
                  variant="contained" 
                  color="secondary"
                  startIcon={<Photo />}
                  onClick={openGallery}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  Gallery
                </Button>
              </Tooltip>
              
              <Tooltip title="Add New Task">
                <Button 
                  variant="contained" 
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={() => setAddTaskOpen(true)}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  New Task
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Tabs for navigation */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
                    borderColor: 'divider',
              bgcolor: themeMode === 'light' ? 'rgba(245,247,250,0.5)' : 'rgba(35,41,70,0.5)'
            }}
          >
            <Tab 
              icon={<Dashboard />} 
              label="Dashboard" 
              sx={{ textTransform: 'none', py: 1.5 }} 
            />
            <Tab 
              icon={<Assignment />} 
              label="Tasks" 
              sx={{ textTransform: 'none', py: 1.5 }} 
            />
            <Tab 
              icon={<History />} 
              label="History" 
              sx={{ textTransform: 'none', py: 1.5 }} 
            />
          </Tabs>

          {/* Main Content Area */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {activeTab === 0 && (
              <Grid container spacing={3}>
                {/* Timer Section */}
                <Grid item xs={12} md={7} lg={8}>
                  <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ 
                      p: { xs: 2, sm: 3 }, 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
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
                        onUpload={openUpload}
                        progressColor={['#4caf50']}
                        inactive={!currentTask}
                        currentTask={currentTask} // Pass currentTask to CircularTimer
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Weekly Progress & Current Task Section */}
                <Grid item xs={12} md={5} lg={4}>
                  <Stack spacing={3} height="100%">
                    {/* Weekly Calendar */}
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CalendarToday fontSize="small" color="primary" />
                          <Typography variant="h6" fontWeight="medium">This Week</Typography>
                    </Stack>
                        
                      <Stack 
                        direction="row" 
                        spacing={0.5} 
                          justifyContent="space-between"
                          sx={{ overflow: 'auto', pb: 1 }}
                      >
                        {week.map((d) => (
                          <Box
                            key={d.day + d.date}
                            sx={{
                                width: { xs: 40, sm: 48 },
                                height: { xs: 56, sm: 64 },
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
                                  transform: 'translateY(-2px)'
                              }
                            }}
                          >
                              <Typography variant="h6" align="center" sx={{ fontWeight: 'bold' }}>
                              {d.date}
                            </Typography>
                            <Typography variant="caption" align="center">
                              {d.day}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                      </CardContent>
                    </Card>
                  
                    {/* Task Stats */}
                    <Card elevation={2} sx={{ borderRadius: 2, flexGrow: 1 }}>
                      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Assignment fontSize="small" color="primary" />
                          <Typography variant="h6" fontWeight="medium">Task Progress</Typography>
                    </Stack>
                    
                        {currentTask ? (
                          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                              {currentTask.label || currentTask.name}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                              <Chip 
                                label={currentTask.category || 'General'} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${currentTask.priority || 'Medium'} Priority`} 
                                size="small" 
                                color={
                                  currentTask.priority === 'high' ? 'error' :
                                  currentTask.priority === 'medium' ? 'warning' : 'success'
                                }
                                variant="outlined"
                              />
                            </Box>
                            
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Progress
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={currentTask.progress || 0}
                      sx={{ 
                                  height: 8, 
                                  borderRadius: 1,
                                  mb: 0.5
                                }}
                              />
                              <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                                {currentTask.progress || 0}% Complete
                        </Typography>
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                              <Typography variant="body2" color="text.secondary">
                                <AccessTime fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                                Duration:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {Math.floor(currentTask.duration / 60)} minutes
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 3
                          }}>
                            <Typography color="text.secondary" align="center" sx={{ mb: 2 }}>
                              No active task. Start a task to track progress.
                            </Typography>
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<AddIcon />}
                              onClick={() => setAddTaskOpen(true)}
                            >
                              Add New Task
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>
            )}
            
            {activeTab === 1 && (
              <Box>
                <Grid container spacing={3}>
                  {/* Pending Tasks Section */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                          <ArrowUpward fontSize="small" color="primary" />
                          <Typography variant="h6" fontWeight="medium">Pending Tasks</Typography>
                          
                          <Chip 
                            label={tasks.length} 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 'auto' }} 
                          />
                        </Stack>
                        
                        {tasks.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                              No pending tasks. Add a task to get started!
                            </Typography>
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<AddIcon />}
                              onClick={() => setAddTaskOpen(true)}
                            >
                              Add New Task
                            </Button>
                          </Box>
                        ) : (
                          <Stack spacing={2} sx={{ 
                            maxHeight: {xs: '300px', md: '500px'}, 
                            overflowY: 'auto', 
                            pr: 1,
                            '&::-webkit-scrollbar': {
                              width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: 'rgba(0,0,0,0.05)',
                              borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: 'rgba(0,0,0,0.15)',
                              borderRadius: '10px',
                            },
                          }}>
                      {tasks.map((task) => (
                              <Card 
                          key={task.id}
                          elevation={currentTask && currentTask.id === task.id ? 3 : 1}
                          sx={{ 
                                  p: 2, 
                            borderRadius: 2, 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                                  border: currentTask && currentTask.id === task.id ? '1px solid' : 'none',
                                  borderColor: 'primary.main',
                              bgcolor: currentTask && currentTask.id === task.id 
                                    ? (themeMode === 'light' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.1)') 
                                    : 'background.paper',
                                  '&:hover': {
                                    transform: 'translateY(-3px)',
                                    boxShadow: 4
                            }
                          }} 
                          onClick={() => handleStart(task.id)}
                        >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Box 
                              sx={{ 
                                      width: 16, 
                                      height: 16, 
                                borderRadius: '50%',
                                border: '2px solid',
                                      borderColor: 'primary.main',
                                      mr: 1.5,
                                      mt: 0.7,
                                flexShrink: 0
                                    }}
                                  />
                                  
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 0.5 }}>
                                      {task.label || task.name}
                              </Typography>
                                    
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                                      <Chip 
                                        label={task.category || 'General'} 
                                        size="small" 
                                        variant="outlined"
                                        color="primary"
                                        sx={{ height: 24 }}
                                      />
                                      <Chip 
                                        label={`${task.priority || 'Medium'} Priority`} 
                                        size="small" 
                                        variant="outlined"
                                        color={
                                          task.priority === 'high' ? 'error' :
                                          task.priority === 'medium' ? 'warning' : 'success'
                                        }
                                        sx={{ height: 24 }}
                                      />
                                      <Chip 
                                        label={`${Math.floor(task.duration / 60)} min`} 
                                        size="small" 
                                        variant="outlined"
                                        color="info"
                                        icon={<AccessTime style={{fontSize: '0.875rem'}} />}
                                        sx={{ height: 24 }}
                                      />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={task.progress || 0}
                                  sx={{ 
                                          height: 6, 
                                          borderRadius: 3, 
                                    width: '100%', 
                                    mr: 1,
                                          backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                                        }}
                                      />
                                      <Typography variant="caption" sx={{ minWidth: '36px', textAlign: 'right' }}>
                                  {task.progress || 0}%
                                </Typography>
                              </Box>
                            </Box>
                                </Box>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Completed Tasks Section */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                          <ArrowDownward fontSize="small" color="success" />
                          <Typography variant="h6" fontWeight="medium">Completed Tasks</Typography>
                          
                          <Chip 
                            label={completedTasks.length} 
                            size="small" 
                            color="success" 
                            sx={{ ml: 'auto' }} 
                          />
                        </Stack>
                        
                        {completedTasks.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                              No completed tasks yet. Complete a task to see it here.
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={2} sx={{ 
                            maxHeight: {xs: '300px', md: '500px'}, 
                            overflowY: 'auto', 
                            pr: 1,
                            '&::-webkit-scrollbar': {
                              width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: 'rgba(0,0,0,0.05)',
                              borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: 'rgba(0,0,0,0.15)',
                              borderRadius: '10px',
                            },
                          }}>
                          {completedTasks.map((task) => (
                              <Card 
                              key={task.id}
                              elevation={0}
                              sx={{ 
                                  p: 2, 
                                borderRadius: 2, 
                                  bgcolor: themeMode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                              }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Box 
                                  sx={{ 
                                      width: 16, 
                                      height: 16, 
                                      borderRadius: '50%',
                                      border: '2px solid',
                                      borderColor: 'success.main',
                                      mr: 1.5,
                                      mt: 0.7,
                                      flexShrink: 0,
                                    display: 'flex', 
                                    alignItems: 'center', 
                                      justifyContent: 'center'
                                  }}
                                >
                                  <Box 
                                    sx={{ 
                                        width: 8, 
                                        height: 8,
                                      borderRadius: '50%', 
                                        bgcolor: 'success.main'
                                    }}
                                  />
                                </Box>
                                
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography 
                                      variant="subtitle1" 
                                      fontWeight="medium" 
                                      sx={{ 
                                        mb: 0.5,
                                        color: 'text.secondary',
                                        textDecoration: 'line-through'
                                      }}
                                    >
                                      {task.label || task.name}
                                  </Typography>
                                    
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                                      <Chip 
                                        label={task.category || 'General'} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ 
                                          height: 24,
                                          opacity: 0.7,
                                          '& .MuiChip-label': { color: 'text.secondary' }
                                        }}
                                      />
                                      <Chip 
                                        label={`${task.priority || 'Medium'} Priority`} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ 
                                          height: 24,
                                          opacity: 0.7,
                                          '& .MuiChip-label': { color: 'text.secondary' }
                                        }}
                                      />
                                      <Chip 
                                        label={`${Math.floor(task.duration / 60)} min`} 
                                        size="small" 
                                        variant="outlined"
                                        icon={<AccessTime style={{fontSize: '0.875rem'}} />}
                                        sx={{ 
                                          height: 24,
                                          opacity: 0.7,
                                          '& .MuiChip-label': { color: 'text.secondary' }
                                        }}
                                      />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={100}
                                      sx={{ 
                                          height: 6, 
                                          borderRadius: 3, 
                                        width: '100%', 
                                        mr: 1, 
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: 'success.main'
                                        }
                                      }}
                                    />
                                      <Typography variant="caption" sx={{ minWidth: '36px', textAlign: 'right' }}>
                                      100%
                                    </Typography>
                                  </Box>
                                </Box>
                                </Box>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                        </Box>
                      )}
                      
            {activeTab === 2 && (
              <Box>
                <Grid container spacing={3}>
                  {/* Stats Overview */}
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                          Your Practice Stats
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={6} md={3}>
                            <Box sx={{ 
                              p: 2, 
                              textAlign: 'center',
                              bgcolor: themeMode === 'light' ? 'rgba(76, 175, 80, 0.08)' : 'rgba(76, 175, 80, 0.15)',
                              borderRadius: 2
                            }}>
                              <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>
                                {completedTasks.length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Sessions Completed
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Box sx={{ 
                              p: 2, 
                              textAlign: 'center',
                              bgcolor: themeMode === 'light' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.15)',
                              borderRadius: 2
                            }}>
                              <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mb: 1 }}>
                                {userPhotos.length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Practice Works
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Box sx={{ 
                              p: 2, 
                              textAlign: 'center',
                              bgcolor: themeMode === 'light' ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.15)',
                              borderRadius: 2
                            }}>
                              <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ mb: 1 }}>
                                {completedTasks.reduce((total, task) => total + Math.floor(task.duration / 60), 0)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Minutes Practiced
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Box sx={{ 
                              p: 2, 
                              textAlign: 'center',
                              bgcolor: themeMode === 'light' ? 'rgba(156, 39, 176, 0.08)' : 'rgba(156, 39, 176, 0.15)',
                              borderRadius: 2
                            }}>
                              <Typography variant="h4" fontWeight="bold" sx={{ 
                                mb: 1,
                                background: 'linear-gradient(45deg, #9c27b0 30%, #f06292 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text', 
                              }}>
                                {tasks.length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Upcoming Sessions
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Gallery Section */}
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                          <Photo fontSize="small" color="primary" />
                          <Typography variant="h6" fontWeight="medium">Your Gallery</Typography>
                          
                        <Button
                            variant="outlined" 
                            size="small" 
                            sx={{ ml: 'auto' }}
                            onClick={openGallery}
                          >
                            View All
                          </Button>
                        </Stack>
                        
                        {userPhotos.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                              No practice photos yet. Complete sessions to build your gallery!
                            </Typography>
                          </Box>
                        ) : (
                          <ImageList 
                            cols={isMobile ? 2 : (isSm ? 3 : 4)} 
                            gap={12}
                            sx={{ overflow: 'visible' }}
                          >
                            {userPhotos.slice(0, 8).map((photo) => (
                              <ImageListItem 
                                key={photo.id}
                          sx={{ 
                            borderRadius: 2,
                                  overflow: 'hidden',
                            boxShadow: 2,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    transform: 'scale(1.03)',
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
                                    backdropFilter: 'blur(4px)',
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }} noWrap>
                                    {photo.taskName}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                                      justifyContent: 'space-between', 
                                      flexWrap: 'wrap'
                                    }}
                                  >
                                    <span>{photo.taskCategory}</span>
                                    <span>{photo.formattedDate}</span>
                                  </Typography>
                </Box>
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )}
                        
                        {userPhotos.length > 8 && (
                          <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Button 
                              variant="outlined" 
                              onClick={openGallery}
                              endIcon={<ArrowDownward />}
                            >
                              Show More
                            </Button>
              </Box>
                        )}
                      </CardContent>
                    </Card>
            </Grid>
          </Grid>
              </Box>
            )}
          </Box>
        </Paper>
        
        {/* Mobile action button */}
        {isMobile && (
          <Fab 
            color="primary" 
            aria-label="add task" 
            onClick={() => setAddTaskOpen(true)}
            sx={{ 
              position: 'fixed', 
              bottom: 24, 
              right: 24,
              boxShadow: '0 8px 16px rgba(85, 105, 255, 0.3)'
            }}
          >
            <AddIcon />
          </Fab>
        )}
        
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
        
        {/* Upload Confirmation Modal */}
        <Dialog 
          open={uploadConfirmOpen} 
          onClose={() => setUploadConfirmOpen(false)} 
          maxWidth="sm" 
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
            Confirm Upload
          </DialogTitle>
          
          <DialogContent dividers>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                Would you like to save this image to your practice gallery?
              </Typography>
              
              {uploadedImage?.imageData && (
                <Box sx={{ 
                  width: '100%', 
                  maxWidth: 350, 
                  mb: 2,
                  mx: 'auto',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 3,
                }}>
                  <img 
                    src={uploadedImage.imageData} 
                    alt="Preview" 
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      objectFit: 'contain',
                      display: 'block',
                      maxHeight: '350px'
                    }} 
                  />
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary">
                {uploadedImage?.fileName || "Selected image"}
              </Typography>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                setUploadedImage(null);
                setUploadConfirmOpen(false);
              }}
              variant="outlined"
              sx={{ borderRadius: 2, px: { xs: 2, sm: 3 } }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmUpload} 
              variant="contained" 
              color="success"
              sx={{ borderRadius: 2, px: { xs: 2, sm: 3 }, fontWeight: 'bold' }}
            >
              Save to Gallery
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Hidden file input for uploading images */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleUpload}
          onClick={(e) => {
            // Reset the file input value to ensure onChange fires even if selecting the same file
            e.target.value = '';
          }}
        />

      </Container>
    </Box>
  );
};

export default PracticeSession;