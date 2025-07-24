# SkillForge


## Overview

SkillForge is a comprehensive skill development and social learning platform that enables users to practice skills, track progress, earn achievements, and connect with fellow learners. The application features a full-fledged social network with messaging capabilities, progress tracking, and personalized practice sessions.

## Features

- **User Authentication**: Secure signup, login, and user management
- **Dashboard**: Personalized dashboard displaying progress metrics and activity
- **Practice Sessions**: Interactive skill practice with customizable sessions
- **Achievement System**: Gamified learning experience with unlockable achievements 
- **Social Features**:
  - Friend connections
  - Real-time messaging with read receipts
  - Media sharing capabilities
  - Notification system
- **Profile Management**: Customizable user profiles with stats and achievements
- **Progress Tracking**: Visual statistics and streak tracking for consistent practice
- **Dark/Light Mode**: Customizable theme for enhanced user experience

## Tech Stack

### Frontend
- **React**: UI library for building component-based interfaces
- **Redux Toolkit**: State management with efficient data flow
- **React Router**: Client-side routing
- **Material UI**: Component library for consistent design
- **Chart.js**: Data visualization
- **Socket.io Client**: Real-time communication
- **Framer Motion**: Animation library
- **Axios**: HTTP client

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication
- **Socket.io**: Websockets for real-time features
- **Bcrypt**: Password hashing
- **Multer**: File uploads

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/SaqibMehdi123/SkillForge.git
   cd SkillForge
   ```

2. Install dependencies
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. Environment setup
   ```bash
   # In the server directory, create a .env file with the following variables:
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:3000
   PORT=5000
   ```

4. Running the application
   ```bash
   # Start server (from server directory)
   node server.js
   
   # Start client (from client directory)
   npm start
   ```

5. The application should now be running at:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

## Project Structure

```
SkillForge/
├── client/                  # Frontend React application
│   ├── public/              # Static assets
│   └── src/
│       ├── app/             # Redux store setup
│       ├── components/      # React components
│       ├── features/        # Redux slices by feature
│       └── ...
├── server/                  # Backend Node.js application
│   ├── controllers/         # API controllers
│   ├── middleware/          # Express middlewares
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Business logic services
│   └── server.js            # Server entry point
└── README.md                # This file
```

## API Endpoints

The API includes the following main endpoints:

- **Authentication**: `/api/auth` - Register, login, user verification
- **Users**: `/api/users` - User profile management
- **Practice**: `/api/practice` - Practice session management
- **Streaks**: `/api/streaks` - User streak tracking
- **Achievements**: `/api/achievements` - User achievements
- **Media**: `/api/media` - Media file management
- **Notifications**: `/api/notifications` - User notifications
- **Friends**: `/api/friends` - Friend connections
- **Messages**: `/api/messages` - User messaging
- **Photos**: `/api/photos` - Photo uploads and management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

Saqib Mehdi - [GitHub](https://github.com/SaqibMehdi123)

Project Link: https://github.com/SaqibMehdi123/SkillForge 
