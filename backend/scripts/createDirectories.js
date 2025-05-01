const fs = require('fs').promises;
const path = require('path');

const createUploadDirectories = async () => {
  const uploadDirs = [
    'uploads/practice',
    'uploads/profile',
    'uploads/category',
    'uploads/achievement'
  ];

  try {
    for (const dir of uploadDirs) {
      await fs.mkdir(path.join(__dirname, '..', dir), { recursive: true });
    }
    console.log('Upload directories created successfully');
  } catch (error) {
    console.error('Error creating upload directories:', error);
    process.exit(1);
  }
};

createUploadDirectories();
