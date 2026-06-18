import Task from '../models/Task.js';
import User from '../models/User.js';
import { mockTasks, mockUsers, isDbConnected } from './mockDb.js';

/**
 * Calculates the most recent 12:10 AM (00:10) datetime.
 */
export const getMostRecentTenPastMidnight = () => {
  const now = new Date();
  const todayTenPastMidnight = new Date(now);
  todayTenPastMidnight.setHours(0, 10, 0, 0);

  if (now >= todayTenPastMidnight) {
    return todayTenPastMidnight;
  } else {
    const yesterdayTenPastMidnight = new Date(todayTenPastMidnight);
    yesterdayTenPastMidnight.setDate(yesterdayTenPastMidnight.getDate() - 1);
    return yesterdayTenPastMidnight;
  }
};

/**
 * Checks all users' daily tasks. If all daily tasks are completed, increments streak.
 * If not all are completed, resets streak to 0.
 * Then deletes/removes all daily tasks.
 */
export const removeDailyTasksAndProcessStreaks = async (cutoffDate = new Date()) => {
  console.log(`[Scheduler] Processing daily tasks and updating streaks for cutoff ${cutoffDate.toISOString()}...`);
  
  try {
    const cutoffDay = new Date(cutoffDate);
    const todayStr = cutoffDay.toDateString();
    
    const yesterday = new Date(cutoffDay);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // 1. Process Mock DB
    for (const mockU of mockUsers) {
      // Find all daily tasks for this user updated/created before cutoffDate
      const dailyTasks = mockTasks.filter(
        (t) =>
          t.user.toString() === mockU._id.toString() &&
          t.category === 'daily' &&
          new Date(t.updatedAt || t.createdAt || Date.now()) < cutoffDate
      );

      if (dailyTasks.length > 0) {
        const allCompleted = dailyTasks.every((t) => t.completed);
        if (allCompleted) {
          const lastUpdate = mockU.lastStreakUpdate ? new Date(mockU.lastStreakUpdate) : null;
          const lastUpdateStr = lastUpdate ? lastUpdate.toDateString() : '';
          
          const alreadyUpdated = lastUpdateStr === todayStr || lastUpdateStr === yesterdayStr;
          if (!alreadyUpdated) {
            mockU.streak = (mockU.streak || 0) + 1;
            mockU.highestStreak = Math.max(mockU.highestStreak || 0, mockU.streak);
            mockU.lastStreakUpdate = yesterday.toISOString();
            console.log(`[Scheduler] Mock User ${mockU.name} completed all tasks. Streak incremented to ${mockU.streak}`);
          }
        } else {
          mockU.streak = 0;
          console.log(`[Scheduler] Mock User ${mockU.name} did not complete all tasks. Streak reset to 0`);
        }
      }
    }

    // Remove mock daily tasks older than cutoffDate
    let mockRemoved = 0;
    for (let i = mockTasks.length - 1; i >= 0; i--) {
      const t = mockTasks[i];
      if (t.category === 'daily' && new Date(t.updatedAt || t.createdAt || Date.now()) < cutoffDate) {
        mockTasks.splice(i, 1);
        mockRemoved++;
      }
    }
    console.log(`[Scheduler] Removed ${mockRemoved} mock daily tasks.`);

    // 2. Process DB
    if (isDbConnected()) {
      const dbUsers = await User.find({});
      for (const user of dbUsers) {
        // Find all daily tasks for this user older than cutoffDate
        const dailyTasks = await Task.find({
          user: user._id,
          category: 'daily',
          updatedAt: { $lt: cutoffDate }
        });

        if (dailyTasks.length > 0) {
          const allCompleted = dailyTasks.every((t) => t.completed);
          if (allCompleted) {
            const lastUpdate = user.lastStreakUpdate ? new Date(user.lastStreakUpdate) : null;
            const lastUpdateStr = lastUpdate ? lastUpdate.toDateString() : '';
            
            const alreadyUpdated = lastUpdateStr === todayStr || lastUpdateStr === yesterdayStr;
            if (!alreadyUpdated) {
              const newStreak = (user.streak || 0) + 1;
              const newHighest = Math.max(user.highestStreak || 0, newStreak);
              await User.findByIdAndUpdate(user._id, {
                $set: {
                  streak: newStreak,
                  highestStreak: newHighest,
                  lastStreakUpdate: yesterday
                }
              });
              console.log(`[Scheduler] DB User ${user.name} completed all tasks. Streak incremented to ${newStreak}`);
            }
          } else {
            await User.findByIdAndUpdate(user._id, {
              $set: {
                streak: 0
              }
            });
            console.log(`[Scheduler] DB User ${user.name} did not complete all tasks. Streak reset to 0`);
          }
        }
      }

      // Remove DB daily tasks older than cutoffDate
      const deleteResult = await Task.deleteMany({
        category: 'daily',
        updatedAt: { $lt: cutoffDate }
      });
      console.log(`[Scheduler] DB daily tasks removed completed. Deleted: ${deleteResult.deletedCount}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error during daily tasks processing and removal:', error);
  }
};

/**
 * Resets all weekly tasks to uncompleted status.
 */
export const resetWeeklyTasks = async () => {
  console.log('[Scheduler] Resetting weekly tasks at Monday 12 AM...');
  const now = new Date();
  
  try {
    // 1. Reset in-memory mock tasks
    let mockResetCount = 0;
    mockTasks.forEach((task) => {
      if (task.category === 'weekly') {
        task.completed = false;
        task.completedCount = 0;
        task.updatedAt = now.toISOString();
        mockResetCount++;
      }
    });
    console.log(`[Scheduler] Mock weekly tasks reset completed. Reset ${mockResetCount} tasks.`);

    // 2. Reset DB tasks
    if (isDbConnected()) {
      const result = await Task.updateMany(
        { category: 'weekly' },
        {
          $set: {
            completed: false,
            completedCount: 0,
          },
        }
      );
      console.log(
        `[Scheduler] DB weekly tasks reset completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
      );
    }
  } catch (error) {
    console.error('[Scheduler] Error during weekly tasks reset:', error);
  }
};

/**
 * Resets all monthly tasks to uncompleted status.
 */
export const resetMonthlyTasks = async () => {
  console.log('[Scheduler] Resetting monthly tasks at Month 1st 12 AM...');
  const now = new Date();
  
  try {
    // 1. Reset in-memory mock tasks
    let mockResetCount = 0;
    mockTasks.forEach((task) => {
      if (task.category === 'monthly') {
        task.completed = false;
        task.completedCount = 0;
        task.updatedAt = now.toISOString();
        mockResetCount++;
      }
    });
    console.log(`[Scheduler] Mock monthly tasks reset completed. Reset ${mockResetCount} tasks.`);

    // 2. Reset DB tasks
    if (isDbConnected()) {
      const result = await Task.updateMany(
        { category: 'monthly' },
        {
          $set: {
            completed: false,
            completedCount: 0,
          },
        }
      );
      console.log(
        `[Scheduler] DB monthly tasks reset completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
      );
    }
  } catch (error) {
    console.error('[Scheduler] Error during monthly tasks reset:', error);
  }
};

/**
 * Checks if daily, weekly, or monthly tasks need to be reset on server startup.
 */
export const checkAndResetOnStartup = async () => {
  console.log('[Scheduler] Running startup task reset check...');

  try {
    // 1. Clean up daily tasks (remove and update streaks)
    const cutoffDate = getMostRecentTenPastMidnight();
    await removeDailyTasksAndProcessStreaks(cutoffDate);

    // Get current week start (Monday 12:00 AM)
    const currentWeekStart = new Date();
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Get current month start (1st of month 12:00 AM)
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    // 2. Clean up mockTasks (weekly and monthly)
    mockTasks.forEach((task) => {
      const taskDate = new Date(task.updatedAt || task.createdAt || Date.now());
      if (task.category === 'weekly') {
        if (taskDate < currentWeekStart && (task.completed || task.completedCount > 0)) {
          task.completed = false;
          task.completedCount = 0;
          task.updatedAt = new Date().toISOString();
        }
      } else if (task.category === 'monthly') {
        if (taskDate < currentMonthStart && (task.completed || task.completedCount > 0)) {
          task.completed = false;
          task.completedCount = 0;
          task.updatedAt = new Date().toISOString();
        }
      }
    });

    // 3. Clean up DB tasks (weekly and monthly)
    if (isDbConnected()) {
      // Reset weekly
      const weeklyResult = await Task.updateMany(
        {
          category: 'weekly',
          updatedAt: { $lt: currentWeekStart },
          $or: [{ completed: true }, { completedCount: { $gt: 0 } }],
        },
        {
          $set: {
            completed: false,
            completedCount: 0,
          },
        }
      );
      if (weeklyResult.modifiedCount > 0) {
        console.log(`[Scheduler] Reset ${weeklyResult.modifiedCount} weekly DB tasks on startup.`);
      }

      // Reset monthly
      const monthlyResult = await Task.updateMany(
        {
          category: 'monthly',
          updatedAt: { $lt: currentMonthStart },
          $or: [{ completed: true }, { completedCount: { $gt: 0 } }],
        },
        {
          $set: {
            completed: false,
            completedCount: 0,
          },
        }
      );
      if (monthlyResult.modifiedCount > 0) {
        console.log(`[Scheduler] Reset ${monthlyResult.modifiedCount} monthly DB tasks on startup.`);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error during startup task reset check:', error);
  }
};

/**
 * Starts the task scheduler to reset tasks at their designated intervals.
 */
export const startTaskScheduler = () => {
  // Check and reset immediately on startup
  if (isDbConnected()) {
    checkAndResetOnStartup();
  } else {
    setTimeout(() => {
      checkAndResetOnStartup();
    }, 5000);
  }

  // 1. Daily Reset and Remove scheduling (Every day at 00:10)
  const scheduleDailyResetAndRemove = () => {
    const now = new Date();
    const nextTenPastMidnight = new Date(now);
    nextTenPastMidnight.setHours(0, 10, 0, 0);

    if (now >= nextTenPastMidnight) {
      nextTenPastMidnight.setDate(now.getDate() + 1);
    }

    const msUntilTenPastMidnight = nextTenPastMidnight.getTime() - now.getTime();
    console.log(`[Scheduler] Next daily tasks reset and remove scheduled in ${Math.round(msUntilTenPastMidnight / 1000 / 60)} minutes (at ${nextTenPastMidnight.toLocaleString()})`);

    setTimeout(async () => {
      await removeDailyTasksAndProcessStreaks();
      scheduleDailyResetAndRemove();
    }, msUntilTenPastMidnight);
  };

  // 2. Weekly Reset scheduling (Every Monday 12 AM)
  const scheduleWeeklyReset = () => {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (7 - now.getDay() + 1) % 7 || 7);
    nextMonday.setHours(0, 0, 0, 0);

    const msUntilMonday = nextMonday.getTime() - now.getTime();
    setTimeout(async () => {
      await resetWeeklyTasks();
      scheduleWeeklyReset();
    }, msUntilMonday);
  };

  // 3. Monthly Reset scheduling (Every 1st of month 12 AM)
  const scheduleMonthlyReset = () => {
    const now = new Date();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const msUntilMonthStart = nextMonthStart.getTime() - now.getTime();
    setTimeout(async () => {
      await resetMonthlyTasks();
      scheduleMonthlyReset();
    }, msUntilMonthStart);
  };

  scheduleDailyResetAndRemove();
  scheduleWeeklyReset();
  scheduleMonthlyReset();
  
  console.log('[Scheduler] Task scheduler successfully initialized (Daily [00:10] with Streak Update & Deletion / Weekly / Monthly).');
};
