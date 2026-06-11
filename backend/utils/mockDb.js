import mongoose from 'mongoose';

export const mockUsers = [
  {
    _id: 'mock-user-1',
    name: 'Life User',
    email: 'user@example.com',
    password: 'password123',
  }
];

export const mockTasks = [
  {
    _id: 'mock-task-1',
    title: 'Morning Yoga and Meditation',
    description: 'Spend 20 minutes in mindfulness and light yoga stretch.',
    category: 'daily',
    completed: true,
    targetCompletions: 1,
    completedCount: 1,
    user: 'mock-user-1',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    _id: 'mock-task-2',
    title: 'Review team pull requests',
    description: 'Check frontend task components and backend router files.',
    category: 'daily',
    completed: false,
    targetCompletions: 1,
    completedCount: 0,
    user: 'mock-user-1',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-task-3',
    title: 'Weekly grocery shopping',
    description: 'Stock up on organic greens, milk, whole wheat flour, and protein sources.',
    category: 'weekly',
    completed: false,
    targetCompletions: 3,
    completedCount: 2,
    user: 'mock-user-1',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    _id: 'mock-task-4',
    title: 'Submit monthly financial summaries',
    description: 'Finalize receipts, travel expense logs, and balance sheets.',
    category: 'monthly',
    completed: false,
    targetCompletions: 4,
    completedCount: 1,
    user: 'mock-user-1',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};
