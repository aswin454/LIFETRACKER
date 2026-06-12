import Task from '../models/Task.js';
import { mockTasks, isDbConnected } from './mockDb.js';

/**
 * Resets all daily tasks to uncompleted status.
 * This function affects both the MongoDB database (if online) and the mock database (offline fallback).
 */
export const resetDailyTasks = async () => {
  console.log('[Scheduler] Resetting daily tasks at 12 AM...');
  const now = new Date();
  
  try {
    // 1. Reset in-memory mock tasks for offline/local mode
    let mockResetCount = 0;
    mockTasks.forEach((task) => {
      if (task.category === 'daily') {
        task.completed = false;
        task.completedCount = 0;
        task.updatedAt = now.toISOString();
        mockResetCount++;
      }
    });
    console.log(`[Scheduler] Mock daily tasks reset completed. Reset ${mockResetCount} tasks.`);

    // 2. Reset online MongoDB tasks
    if (isDbConnected()) {
      const result = await Task.updateMany(
        { category: 'daily' },
        {
          $set: {
            completed: false,
            completedCount: 0,
          },
        }
      );
      console.log(
        `[Scheduler] DB daily tasks reset completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
      );
    } else {
      console.log('[Scheduler] MongoDB is not connected; skipped DB tasks reset.');
    }
  } catch (error) {
    console.error('[Scheduler] Error during daily tasks reset:', error);
  }
};

/**
 * Checks if daily tasks need to be reset on server startup.
 * Runs if any daily task was last updated on a previous day.
 */
export const checkAndResetOnStartup = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  console.log('[Scheduler] Running startup daily task reset check...');

  try {
    // 1. Clean up mockTasks (if any were last updated before today and are completed/have progress)
    let mockResetCount = 0;
    mockTasks.forEach((task) => {
      if (task.category === 'daily') {
        const taskDate = new Date(task.updatedAt || task.createdAt || Date.now());
        if (taskDate < todayStart && (task.completed || task.completedCount > 0)) {
          task.completed = false;
          task.completedCount = 0;
          task.updatedAt = new Date().toISOString();
          mockResetCount++;
        }
      }
    });
    if (mockResetCount > 0) {
      console.log(`[Scheduler] Reset ${mockResetCount} daily mock tasks on startup.`);
    }

    // 2. Clean up DB tasks
    if (isDbConnected()) {
      const result = await Task.updateMany(
        {
          category: 'daily',
          updatedAt: { $lt: todayStart },
          $or: [{ completed: true }, { completedCount: { $gt: 0 } }],
        },
        {
          $set: {
            completed: false,
            completedCount: 0,
          },
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Scheduler] Reset ${result.modifiedCount} daily DB tasks on startup.`);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error during startup task reset check:', error);
  }
};

/**
 * Starts the daily scheduler to reset tasks at 12 AM every day.
 */
export const startDailyTaskScheduler = () => {
  // First, check and reset immediately on startup if we missed a reset (e.g. server was offline)
  // If DB is not connected yet, we run it after a short delay or when connected.
  if (isDbConnected()) {
    checkAndResetOnStartup();
  } else {
    // If DB is not connected, check once after 5 seconds when it might have connected, or check mock tasks immediately
    setTimeout(() => {
      checkAndResetOnStartup();
    }, 5000);
  }

  const scheduleNextReset = () => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const minutesUntilMidnight = Math.round(msUntilMidnight / 1000 / 60);
    console.log(
      `[Scheduler] Next daily task reset scheduled in ${minutesUntilMidnight} minutes (at ${nextMidnight.toLocaleString()})`
    );

    setTimeout(async () => {
      await resetDailyTasks();
      scheduleNextReset(); // Schedule the next one recursively
    }, msUntilMidnight);
  };

  scheduleNextReset();
};
