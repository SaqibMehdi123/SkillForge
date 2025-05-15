import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const ProgressSidebar = ({ ongoingTasks, completedTasks, onAddTask }) => {
  const [newTask, setNewTask] = useState('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      onAddTask(newTask.trim());
      setNewTask('');
    }
  };

  return (
    <Box sx={{ width: 300, p: 2, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        My Progress
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Add Task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleAddTask} sx={{ minWidth: 0, px: 2 }}>
          +
        </Button>
      </Stack>
      <Accordion defaultExpanded sx={{ mb: 1, boxShadow: 'none' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 'bold' }}>OnGoing</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {ongoingTasks.length === 0 && (
              <ListItem>
                <ListItemText primary="No ongoing tasks" />
              </ListItem>
            )}
            {ongoingTasks.map((task, idx) => (
              <ListItem key={task.id || idx}>
                <ListItemIcon>
                  <Chip size="small" sx={{ bgcolor: task.color || 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary={task.label} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded sx={{ boxShadow: 'none' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 'bold' }}>Completed</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {completedTasks.length === 0 && (
              <ListItem>
                <ListItemText primary="No completed tasks" />
              </ListItem>
            )}
            {completedTasks.map((task, idx) => (
              <ListItem key={task.id || idx}>
                <ListItemIcon>
                  <Chip size="small" sx={{ bgcolor: task.color || 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary={task.label} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ProgressSidebar; 