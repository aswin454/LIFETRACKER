import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { isDbConnected, mockTasks, mockUsers } from '../utils/mockDb.js';

const router = express.Router();

// Helper to decay/reset streak if a day is missed
const checkAndDecayStreak = async (user, isDb) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (user.lastStreakUpdate) {
    const lastDate = new Date(user.lastStreakUpdate);
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate < yesterday) {
      user.streak = 0;
      if (isDb) {
        await User.findByIdAndUpdate(user._id, { $set: { streak: 0 } });
      } else {
        const mockU = mockUsers.find(u => u._id === user._id);
        if (mockU) mockU.streak = 0;
      }
    }
  } else {
    if (user.streak > 0) {
      user.streak = 0;
      if (isDb) {
        await User.findByIdAndUpdate(user._id, { $set: { streak: 0 } });
      } else {
        const mockU = mockUsers.find(u => u._id === user._id);
        if (mockU) mockU.streak = 0;
      }
    }
  }
};

// Helper to update streak based on completed day full tasks (all daily tasks completed)
const updateUserStreak = async (user, isDb) => {
  const userId = user._id;

  // 1. Get all daily tasks for the user
  let dailyTasks = [];
  if (isDb) {
    dailyTasks = await Task.find({ user: userId, category: 'daily' });
  } else {
    dailyTasks = mockTasks.filter(t => t.user.toString() === userId.toString() && t.category === 'daily');
  }

  const hasDailyTasks = dailyTasks.length > 0;
  const allCompleted = hasDailyTasks && dailyTasks.every(t => t.completed);

  const isToday = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (allCompleted) {
    // If all daily tasks are completed, and we haven't already incremented the streak today:
    if (!isToday(user.lastStreakUpdate)) {
      let newStreak = (user.streak || 0) + 1;
      let newHighest = Math.max(user.highestStreak || 0, newStreak);
      let newLastUpdate = new Date();

      if (isDb) {
        await User.findByIdAndUpdate(userId, {
          $set: {
            streak: newStreak,
            highestStreak: newHighest,
            lastStreakUpdate: newLastUpdate
          }
        });
      } else {
        const mockU = mockUsers.find(u => u._id === userId.toString());
        if (mockU) {
          mockU.streak = newStreak;
          mockU.highestStreak = newHighest;
          mockU.lastStreakUpdate = newLastUpdate;
        }
      }

      user.streak = newStreak;
      user.highestStreak = newHighest;
      user.lastStreakUpdate = newLastUpdate;
    }
  } else {
    // If not all daily tasks are completed, but we had incremented the streak today:
    // We must revert/decrement the streak.
    if (isToday(user.lastStreakUpdate)) {
      let newStreak = Math.max(0, (user.streak || 0) - 1);
      let newLastUpdate = yesterday; // Set last streak update to yesterday to protect the rest of the streak from decay

      if (isDb) {
        await User.findByIdAndUpdate(userId, {
          $set: {
            streak: newStreak,
            lastStreakUpdate: newLastUpdate
          }
        });
      } else {
        const mockU = mockUsers.find(u => u._id === userId.toString());
        if (mockU) {
          mockU.streak = newStreak;
          mockU.lastStreakUpdate = newLastUpdate;
        }
      }

      user.streak = newStreak;
      user.lastStreakUpdate = newLastUpdate;
    }
  }
};

// Apply protect middleware to all task routes
router.use(protect);

// @desc    Get user tasks, optionally filtered by category
// @route   GET /api/tasks
// @access  Private
router.get('/', async (req, res) => {
  const { category } = req.query;
  const filter = { user: req.user._id };

  if (category) {
    filter.category = category;
  }

  try {
    // Database Offline Fallback
    if (!isDbConnected()) {
      let filtered = mockTasks.filter((t) => t.user.toString() === req.user._id.toString());
      if (category) {
        filtered = filtered.filter((t) => t.category === category);
      }
      // Sort by createdAt descending
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const processed = filtered.map(t => ({
        ...t,
        targetCompletions: t.targetCompletions !== undefined ? t.targetCompletions : 1,
        completedCount: t.completedCount !== undefined ? t.completedCount : (t.completed ? 1 : 0)
      }));
      return res.json(processed);
    }

    // Database Online
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    const processedTasks = tasks.map(t => {
      const taskObj = t.toObject();
      if (taskObj.targetCompletions === undefined || taskObj.targetCompletions === null) {
        taskObj.targetCompletions = 1;
      }
      if (taskObj.completedCount === undefined || taskObj.completedCount === null) {
        taskObj.completedCount = taskObj.completed ? taskObj.targetCompletions : 0;
      }
      return taskObj;
    });
    res.json(processedTasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

// @desc    Get dashboard summary stats
// @route   GET /api/tasks/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Helper to calculate histories
    const calculateHistories = (allTasks) => {
      const dailyHistory = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateString = d.toDateString();
        
        let completedSum = 0;
        let targetSum = 0;
        
        // Filter daily tasks created on or before day d (up to the end of day d)
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);
        const dailyTasks = allTasks.filter(t => t.category === 'daily' && new Date(t.createdAt || Date.now()) <= endOfDay);
        
        dailyTasks.forEach(t => {
          const taskDate = new Date(t.updatedAt || t.createdAt || Date.now());
          const target = t.targetCompletions || 1;
          if (taskDate.toDateString() === dateString) {
            const val = t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
            completedSum += val;
          }
          targetSum += target;
        });
        
        const percentage = targetSum > 0 ? Math.round((completedSum / targetSum) * 100) : 0;
        dailyHistory.push({ label: dayName, count: completedSum, percentage });
      }

      const weeklyHistory = [];
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - (i * 7 + 6));
        start.setHours(0, 0, 0, 0);
        
        const end = new Date();
        end.setDate(end.getDate() - (i * 7));
        end.setHours(23, 59, 59, 999);
        
        const label = i === 0 ? 'This Week' : `${i}w ago`;
        
        let completedSum = 0;
        let targetSum = 0;
        
        // Filter weekly tasks created on or before the end of the week
        const weeklyTasks = allTasks.filter(t => t.category === 'weekly' && new Date(t.createdAt || Date.now()) <= end);
        
        weeklyTasks.forEach(t => {
          const taskDate = new Date(t.updatedAt || t.createdAt || Date.now());
          const target = t.targetCompletions || 1;
          if (taskDate >= start && taskDate <= end) {
            const val = t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
            completedSum += val;
          }
          targetSum += target;
        });
        
        const percentage = targetSum > 0 ? Math.round((completedSum / targetSum) * 100) : 0;
        weeklyHistory.push({ label, count: completedSum, percentage });
      }

      const monthlyHistory = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        
        let completedSum = 0;
        let targetSum = 0;
        
        // Filter monthly tasks created on or before the end of that month
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthlyTasks = allTasks.filter(t => t.category === 'monthly' && new Date(t.createdAt || Date.now()) <= endOfMonth);
        
        monthlyTasks.forEach(t => {
          const taskDate = new Date(t.updatedAt || t.createdAt || Date.now());
          const target = t.targetCompletions || 1;
          if (taskDate.getMonth() === d.getMonth() && taskDate.getFullYear() === d.getFullYear()) {
            const val = t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
            completedSum += val;
          }
          targetSum += target;
        });
        
        const percentage = targetSum > 0 ? Math.round((completedSum / targetSum) * 100) : 0;
        monthlyHistory.push({ label: monthName, count: completedSum, percentage });
      }

      return { dailyHistory, weeklyHistory, monthlyHistory };
    };

    // Database Offline Fallback
    if (!isDbConnected()) {
      const mockU = mockUsers.find((u) => u._id === userId.toString());
      if (mockU) {
        await checkAndDecayStreak(mockU, false);
        req.user.streak = mockU.streak;
        req.user.highestStreak = mockU.highestStreak;
      }

      const userTasks = mockTasks.filter((t) => t.user.toString() === userId.toString());
      const total = userTasks.length;
      const completed = userTasks.filter((t) => t.completed).length;
      const pending = total - completed;

      const categories = ['daily', 'weekly', 'monthly'];
      const categoryStats = {};

      for (const cat of categories) {
        const catTasks = userTasks.filter((t) => t.category === cat);
        const catTotal = catTasks.length;
        const catCompleted = catTasks.filter((t) => t.completed).length;
        
        let catTargetSum = 0;
        let catCompletedSum = 0;
        catTasks.forEach(t => {
          catTargetSum += t.targetCompletions || 1;
          catCompletedSum += t.completedCount !== undefined ? t.completedCount : (t.completed ? (t.targetCompletions || 1) : 0);
        });
        const percentage = catTargetSum > 0 ? Math.round((catCompletedSum / catTargetSum) * 100) : 0;
        
        categoryStats[cat] = {
          total: catTotal,
          completed: catCompleted,
          pending: catTotal - catCompleted,
          percentage
        };
      }

      let overallTargetSum = 0;
      let overallCompletedSum = 0;
      userTasks.forEach(t => {
        overallTargetSum += t.targetCompletions || 1;
        overallCompletedSum += t.completedCount !== undefined ? t.completedCount : (t.completed ? (t.targetCompletions || 1) : 0);
      });
      const overallPercentage = overallTargetSum > 0 ? Math.round((overallCompletedSum / overallTargetSum) * 100) : 0;

      const histories = calculateHistories(userTasks);

      return res.json({
        total,
        completed,
        pending,
        overallPercentage,
        categories: categoryStats,
        streak: req.user.streak || 0,
        highestStreak: req.user.highestStreak || 0,
        ...histories,
        databaseConnected: false
      });
    }

    // Database Online
    // Update streak decay first
    const userDoc = await User.findById(userId);
    if (userDoc) {
      await checkAndDecayStreak(userDoc, true);
      req.user.streak = userDoc.streak;
      req.user.highestStreak = userDoc.highestStreak;
    }

    // Get all user tasks to calculate stats
    const userTasks = await Task.find({ user: userId });
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.completed).length;
    const pending = total - completed;

    // Calculate category stats
    const categories = ['daily', 'weekly', 'monthly'];
    const categoryStats = {};

    for (const cat of categories) {
      const catTasks = userTasks.filter(t => t.category === cat);
      const catTotal = catTasks.length;
      const catCompleted = catTasks.filter(t => t.completed).length;
      
      let catTargetSum = 0;
      let catCompletedSum = 0;
      catTasks.forEach(t => {
        const target = t.targetCompletions || 1;
        catTargetSum += target;
        catCompletedSum += t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
      });
      const percentage = catTargetSum > 0 ? Math.round((catCompletedSum / catTargetSum) * 100) : 0;
      
      categoryStats[cat] = {
        total: catTotal,
        completed: catCompleted,
        pending: catTotal - catCompleted,
        percentage
      };
    }

    let overallTargetSum = 0;
    let overallCompletedSum = 0;
    userTasks.forEach(t => {
      const target = t.targetCompletions || 1;
      overallTargetSum += target;
      overallCompletedSum += t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
    });
    const overallPercentage = overallTargetSum > 0 ? Math.round((overallCompletedSum / overallTargetSum) * 100) : 0;

    const histories = calculateHistories(userTasks);

    res.json({
      total,
      completed,
      pending,
      overallPercentage,
      categories: categoryStats,
      streak: req.user.streak || 0,
      highestStreak: req.user.highestStreak || 0,
      ...histories,
      databaseConnected: true
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
router.post('/', async (req, res) => {
  const { title, description, category, targetCompletions } = req.body;

  try {
    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required' });
    }

    if (!['daily', 'weekly', 'monthly'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category. Must be daily, weekly, or monthly' });
    }

    const target = (category === 'daily') ? 1 : Math.max(1, Number(targetCompletions) || 1);

    // Database Offline Fallback
    if (!isDbConnected()) {
      const newTask = {
        _id: 'mock-task-' + Date.now(),
        title,
        description: description || '',
        category,
        completed: false,
        targetCompletions: target,
        completedCount: 0,
        user: req.user._id,
        createdAt: new Date().toISOString()
      };

      mockTasks.push(newTask);

      if (category === 'daily') {
        const mockU = mockUsers.find(u => u._id === req.user._id.toString());
        if (mockU) {
          await updateUserStreak(mockU, false);
          req.user.streak = mockU.streak;
          req.user.highestStreak = mockU.highestStreak;
          req.user.lastStreakUpdate = mockU.lastStreakUpdate;
        }
      }

      return res.status(201).json(newTask);
    }

    // Database Online
    const task = await Task.create({
      title,
      description: description || '',
      category,
      targetCompletions: target,
      completedCount: 0,
      user: req.user._id,
    });

    if (category === 'daily') {
      const userDoc = await User.findById(req.user._id);
      if (userDoc) {
        await updateUserStreak(userDoc, true);
        req.user.streak = userDoc.streak;
        req.user.highestStreak = userDoc.highestStreak;
        req.user.lastStreakUpdate = userDoc.lastStreakUpdate;
      }
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, description, category, completed, completedCount, targetCompletions } = req.body;

  try {
    // Database Offline Fallback
    if (!isDbConnected()) {
      const taskIndex = mockTasks.findIndex((t) => t._id === req.params.id);
      if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const task = mockTasks[taskIndex];
      // Verify task owner
      if (task.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to edit this task' });
      }

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      
      const oldCategory = task.category;
      if (category !== undefined) {
        if (!['daily', 'weekly', 'monthly'].includes(category)) {
          return res.status(400).json({ message: 'Invalid category' });
        }
        task.category = category;
      }

      let nextTarget = task.targetCompletions || 1;
      if (targetCompletions !== undefined) {
        nextTarget = Math.max(1, Number(targetCompletions));
        task.targetCompletions = nextTarget;
      }

      if (completed !== undefined) {
        task.completed = completed;
        task.completedCount = completed ? nextTarget : 0;
      } else if (completedCount !== undefined) {
        task.completedCount = Math.max(0, Math.min(nextTarget, Number(completedCount)));
        task.completed = task.completedCount >= nextTarget;
      } else {
        const currentCount = task.completedCount || 0;
        task.completedCount = Math.max(0, Math.min(nextTarget, currentCount));
        task.completed = task.completedCount >= nextTarget;
      }

      mockTasks[taskIndex] = task;

      // Update daily streak if this task was or now is a daily task
      if (oldCategory === 'daily' || task.category === 'daily') {
        const mockU = mockUsers.find(u => u._id === req.user._id.toString());
        if (mockU) {
          await updateUserStreak(mockU, false);
          req.user.streak = mockU.streak;
          req.user.highestStreak = mockU.highestStreak;
          req.user.lastStreakUpdate = mockU.lastStreakUpdate;
        }
      }

      return res.json(task);
    }

    // Database Online
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task owner
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this task' });
    }

    let nextTarget = task.targetCompletions || 1;
    if (targetCompletions !== undefined) {
      nextTarget = Math.max(1, Number(targetCompletions));
    }

    let nextCompleted = task.completed;
    let nextCount = task.completedCount || 0;

    if (completed !== undefined) {
      nextCompleted = completed;
      nextCount = completed ? nextTarget : 0;
    } else if (completedCount !== undefined) {
      nextCount = Math.max(0, Math.min(nextTarget, Number(completedCount)));
      nextCompleted = nextCount >= nextTarget;
    } else {
      nextCount = Math.max(0, Math.min(nextTarget, nextCount));
      nextCompleted = nextCount >= nextTarget;
    }

    const oldCategory = task.category;

    // Prepare updates
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) {
      if (!['daily', 'weekly', 'monthly'].includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      updates.category = category;
    }
    updates.targetCompletions = nextTarget;
    updates.completedCount = nextCount;
    updates.completed = nextCompleted;

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Update daily streak if this task was or now is a daily task
    if (oldCategory === 'daily' || task.category === 'daily') {
      const userDoc = await User.findById(req.user._id);
      if (userDoc) {
        await updateUserStreak(userDoc, true);
        req.user.streak = userDoc.streak;
        req.user.highestStreak = userDoc.highestStreak;
        req.user.lastStreakUpdate = userDoc.lastStreakUpdate;
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    // Database Offline Fallback
    if (!isDbConnected()) {
      const taskIndex = mockTasks.findIndex((t) => t._id === req.params.id);
      if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const task = mockTasks[taskIndex];
      // Verify task owner
      if (task.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to delete this task' });
      }

      const wasDaily = task.category === 'daily';
      mockTasks.splice(taskIndex, 1);

      if (wasDaily) {
        const mockU = mockUsers.find(u => u._id === req.user._id.toString());
        if (mockU) {
          await updateUserStreak(mockU, false);
          req.user.streak = mockU.streak;
          req.user.highestStreak = mockU.highestStreak;
          req.user.lastStreakUpdate = mockU.lastStreakUpdate;
        }
      }

      return res.json({ message: 'Task removed successfully', id: req.params.id });
    }

    // Database Online
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task owner
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

    const wasDaily = task.category === 'daily';
    await Task.findByIdAndDelete(req.params.id);

    if (wasDaily) {
      const userDoc = await User.findById(req.user._id);
      if (userDoc) {
        await updateUserStreak(userDoc, true);
        req.user.streak = userDoc.streak;
        req.user.highestStreak = userDoc.highestStreak;
        req.user.lastStreakUpdate = userDoc.lastStreakUpdate;
      }
    }

    res.json({ message: 'Task removed successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

export default router;
