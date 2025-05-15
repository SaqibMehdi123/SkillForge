import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Slider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Stack,
  IconButton,
} from '@mui/material';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const categories = [
  { label: 'Study', value: 'study', icon: <MenuBookIcon /> },
  { label: 'Yoga', value: 'yoga', icon: <SelfImprovementIcon /> },
  { label: 'Grocery', value: 'grocery', icon: <LocalGroceryStoreIcon /> },
  { label: 'Exercise', value: 'exercise', icon: <FitnessCenterIcon /> },
];

const AddTaskModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0].value);
  const [priority, setPriority] = useState('low');
  const [duration, setDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(10);

  const handleCreate = () => {
    if (name.trim()) {
      onCreate({
        name: name.trim(),
        category,
        priority,
        duration,
        breakDuration,
      });
      setName('');
      setCategory(categories[0].value);
      setPriority('low');
      setDuration(25);
      setBreakDuration(10);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Add New Task</DialogTitle>
      <DialogContent sx={{ px: 3 }}>
        <TextField
          label="Write here"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          sx={{ mb: 2, mt: 1 }}
        />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Categories
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {categories.map((cat) => (
            <IconButton
              key={cat.value}
              color={category === cat.value ? 'primary' : 'default'}
              onClick={() => setCategory(cat.value)}
            >
              {cat.icon}
            </IconButton>
          ))}
        </Stack>
        <FormLabel component="legend">Task Priority</FormLabel>
        <RadioGroup
          row
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          sx={{ mb: 2 }}
        >
          <FormControlLabel value="low" control={<Radio />} label="Low Priority" />
          <FormControlLabel value="high" control={<Radio />} label="High Priority" />
        </RadioGroup>
        <Typography gutterBottom>Task Duration (minutes)</Typography>
        <Slider
          value={duration}
          onChange={(_, v) => setDuration(v)}
          min={5}
          max={60}
          step={1}
          valueLabelDisplay="auto"
          sx={{ mb: 2 }}
        />
        <Typography gutterBottom>Task Break (minutes)</Typography>
        <Slider
          value={breakDuration}
          onChange={(_, v) => setBreakDuration(v)}
          min={5}
          max={25}
          step={1}
          valueLabelDisplay="auto"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleCreate}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTaskModal; 