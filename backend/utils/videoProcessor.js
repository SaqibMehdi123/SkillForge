const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

class VideoProcessor {
  static async createTimelapse(images, outputPath, fps = 2) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      // Add each image to the command
      images.forEach(image => {
        command.input(image);
      });
      
      command
        .fps(fps)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }
  
  static async generateTimelapseFromPractices(practices, outputDir) {
    try {
      // Create temp directory for processing
      const tempDir = path.join(outputDir, 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      // Get all practice images
      const images = practices.map(practice => 
        path.join(process.cwd(), 'uploads', 'practice', practice.image)
      );
      
      // Generate output path
      const outputPath = path.join(outputDir, `timelapse-${Date.now()}.mp4`);
      
      // Create timelapse
      await this.createTimelapse(images, outputPath);
      
      // Cleanup temp directory
      await fs.rmdir(tempDir, { recursive: true });
      
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to generate timelapse: ${error.message}`);
    }
  }
}

module.exports = VideoProcessor;
