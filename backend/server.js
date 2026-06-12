import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import User from './models/User.js';
import { startDailyTaskScheduler, checkAndResetOnStartup } from './utils/scheduler.js';

dotenv.config();

// Disable Mongoose query buffering so queries fail immediately when offline
mongoose.set('bufferCommands', false);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scheduler';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[Backend Request] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Start the server immediately
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  startDailyTaskScheduler();
});

// Connect to MongoDB asynchronously in the background
console.log('Attempting MongoDB connection to URI:', MONGO_URI);
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB Database');
    try {
      await User.syncIndexes();
      console.log('Database indexes synchronized successfully');
      await checkAndResetOnStartup();
    } catch (indexError) {
      console.error('Error synchronizing database indexes:', indexError.message);
    }
  })
  .catch((error) => {
    console.error('MongoDB database connection error:', error.message);
    console.log('Server is running in database-offline mode. Fallback mock data will be served by frontend.');
  });
