import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Task from './models/Task.js';
import { removeDailyTasksAndProcessStreaks, getMostRecentTenPastMidnight } from './utils/scheduler.js';
import { mockTasks, mockUsers } from './utils/mockDb.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scheduler';

async function runTests() {
  console.log('--- STARTING SCHEDULER TESTS ---');

  // Test 1: Mock Database path
  console.log('\n--- Test 1: Mock Database Streaks and Deletion ---');
  
  // Set up mock users and tasks
  mockUsers.length = 0;
  mockTasks.length = 0;

  mockUsers.push({
    _id: 'mock-user-test-1',
    name: 'Test Mock User 1',
    streak: 5,
    highestStreak: 10,
    lastStreakUpdate: null
  });

  mockUsers.push({
    _id: 'mock-user-test-2',
    name: 'Test Mock User 2',
    streak: 3,
    highestStreak: 5,
    lastStreakUpdate: null
  });

  // Mock User 1 has completed tasks
  mockTasks.push({
    _id: 'task-1',
    title: 'Completed Task 1',
    category: 'daily',
    completed: true,
    user: 'mock-user-test-1',
    updatedAt: new Date(Date.now() - 3600 * 1000).toISOString() // 1 hour ago
  });

  // Mock User 2 has incomplete tasks
  mockTasks.push({
    _id: 'task-2',
    title: 'Incomplete Task 2',
    category: 'daily',
    completed: false,
    user: 'mock-user-test-2',
    updatedAt: new Date(Date.now() - 3600 * 1000).toISOString() // 1 hour ago
  });

  // Task created after cutoff (should not be processed or deleted)
  mockTasks.push({
    _id: 'task-3',
    title: 'Future Task 3',
    category: 'daily',
    completed: true,
    user: 'mock-user-test-1',
    updatedAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour in the future
  });

  console.log('Before mock processing:');
  console.log('Mock Users:', JSON.stringify(mockUsers, null, 2));
  console.log('Mock Tasks Count:', mockTasks.length);

  // Run scheduler function with current time as cutoff
  await removeDailyTasksAndProcessStreaks(new Date());

  console.log('\nAfter mock processing:');
  console.log('Mock Users:', JSON.stringify(mockUsers, null, 2));
  console.log('Mock Tasks Count (should be 1 because task-3 is after cutoff):', mockTasks.length);
  console.log('Remaining Mock Tasks:', JSON.stringify(mockTasks, null, 2));

  // Assertions for mock
  if (mockUsers[0].streak !== 6) {
    console.error('ERROR: Mock User 1 streak should be 6, got:', mockUsers[0].streak);
  } else {
    console.log('SUCCESS: Mock User 1 streak incremented to 6.');
  }

  if (mockUsers[1].streak !== 0) {
    console.error('ERROR: Mock User 2 streak should be 0, got:', mockUsers[1].streak);
  } else {
    console.log('SUCCESS: Mock User 2 streak reset to 0.');
  }

  if (mockTasks.length !== 1 || mockTasks[0]._id !== 'task-3') {
    console.error('ERROR: Mock task deletion failed.');
  } else {
    console.log('SUCCESS: Mock tasks processed and deleted correctly.');
  }

  // Test 2: MongoDB Database path
  console.log('\n--- Test 2: MongoDB Database Streaks and Deletion ---');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear test collections
    await User.deleteMany({ email: /@test\.com$/ });
    await Task.deleteMany({ title: /Test Daily/ });

    // Create test users
    const user1 = await User.create({
      name: 'DB User 1',
      email: 'user1@test.com',
      password: 'password123',
      streak: 5,
      highestStreak: 10,
      lastStreakUpdate: null
    });

    const user2 = await User.create({
      name: 'DB User 2',
      email: 'user2@test.com',
      password: 'password123',
      streak: 3,
      highestStreak: 5,
      lastStreakUpdate: null
    });

    // Create daily tasks for user1 (all completed)
    const task1 = await Task.create({
      title: 'Test Daily Completed 1',
      category: 'daily',
      completed: true,
      user: user1._id,
      updatedAt: new Date(Date.now() - 3600 * 1000)
    });

    // Create daily tasks for user2 (some incomplete)
    const task2 = await Task.create({
      title: 'Test Daily Incomplete 2',
      category: 'daily',
      completed: false,
      user: user2._id,
      updatedAt: new Date(Date.now() - 3600 * 1000)
    });

    // Create daily task for user1 with updatedAt after cutoff
    const task3 = await Task.create({
      title: 'Test Daily Future 3',
      category: 'daily',
      completed: true,
      user: user1._id,
      updatedAt: new Date(Date.now() + 3600 * 1000)
    });

    console.log('Before DB processing:');
    const u1Before = await User.findById(user1._id);
    const u2Before = await User.findById(user2._id);
    console.log('User 1 Streak:', u1Before.streak);
    console.log('User 2 Streak:', u2Before.streak);
    console.log('Total daily tasks in DB:', await Task.countDocuments({ category: 'daily' }));

    // Run scheduler function with current time as cutoff
    await removeDailyTasksAndProcessStreaks(new Date());

    console.log('\nAfter DB processing:');
    const u1After = await User.findById(user1._id);
    const u2After = await User.findById(user2._id);
    const remainingTasks = await Task.find({ category: 'daily' });

    console.log('User 1 Streak (should be 6):', u1After.streak);
    console.log('User 2 Streak (should be 0):', u2After.streak);
    console.log('Remaining daily tasks in DB (should be 1):', remainingTasks.length);

    if (u1After.streak !== 6) {
      console.error('ERROR: User 1 streak not updated correctly.');
    } else {
      console.log('SUCCESS: User 1 streak successfully updated to 6.');
    }

    if (u2After.streak !== 0) {
      console.error('ERROR: User 2 streak not reset correctly.');
    } else {
      console.log('SUCCESS: User 2 streak successfully reset to 0.');
    }

    if (remainingTasks.length !== 1 || remainingTasks[0]._id.toString() !== task3._id.toString()) {
      console.error('ERROR: DB task deletion failed.');
    } else {
      console.log('SUCCESS: DB tasks processed and deleted correctly.');
    }

    // Clean up
    await User.deleteMany({ email: /@test\.com$/ });
    await Task.deleteMany({ title: /Test Daily/ });

  } catch (err) {
    console.error('MongoDB test failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }

  console.log('\n--- TESTS COMPLETED ---');
}

runTests();
