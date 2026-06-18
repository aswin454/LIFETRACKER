import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  CheckSquare,
  Clock,
  Percent,
  X,
  PlusCircle,
  FileText,
  AlertCircle,
  Flame,
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  Settings,
  HelpCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function DashboardPage() {
  const { logout, getAuthHeaders, user } = useAuth();

  // Custom Navigation, Theme & Responsive states
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'daily', 'weekly', 'monthly'
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAnalyticsMode, setActiveAnalyticsMode] = useState('daily'); // 'daily', 'weekly', 'monthly'

  // Dashboard & Task states
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overallPercentage: 0,
    streak: 0,
    highestStreak: 0,
    dailyHistory: [],
    weeklyHistory: [],
    monthlyHistory: [],
    categories: {
      daily: { total: 0, completed: 0, pending: 0, percentage: 0 },
      weekly: { total: 0, completed: 0, pending: 0, percentage: 0 },
      monthly: { total: 0, completed: 0, pending: 0, percentage: 0 },
    }
  });

  const [activeCategory, setActiveCategory] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingTaskId, setEditingTaskId] = useState(null);

  // Form States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState('daily');
  const [taskTargetCompletions, setTaskTargetCompletions] = useState(1);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch tasks for active category
      const tasksRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks?category=${activeCategory}`, {
        headers: getAuthHeaders(),
      });
      if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // Fetch summary stats
      const statsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/stats`, {
        headers: getAuthHeaders(),
      });
      if (!statsRes.ok) throw new Error('Failed to fetch statistics');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Show offline warning banner if MongoDB connection is down
      if (statsData.databaseConnected === false) {
        setError('Database connection offline. Running in in-memory simulation mode (your changes will persist for this session).');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the database. Displaying offline/mock tasks instead.');
      setupMockData();
    } finally {
      setLoading(false);
    }
  };

  // Setup mock data for fallback
  const setupMockData = () => {
    const mockTasks = [
      {
        _id: 'mock-1',
        title: 'Morning Yoga and Meditation',
        description: 'Spend 20 minutes in mindfulness and light yoga stretch.',
        category: 'daily',
        completed: true,
        targetCompletions: 1,
        completedCount: 1,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        _id: 'mock-2',
        title: 'Review team pull requests',
        description: 'Check frontend task components and backend router files.',
        category: 'daily',
        completed: false,
        targetCompletions: 1,
        completedCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'mock-3',
        title: 'Weekly grocery shopping',
        description: 'Stock up on organic greens, milk, whole wheat flour, and protein sources.',
        category: 'weekly',
        completed: false,
        targetCompletions: 3,
        completedCount: 2,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        _id: 'mock-4',
        title: 'Submit monthly financial summaries',
        description: 'Finalize receipts, travel expense logs, and balance sheets.',
        category: 'monthly',
        completed: false,
        targetCompletions: 4,
        completedCount: 1,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      }
    ];

    const filteredMock = mockTasks.filter(t => t.category === activeCategory);
    setTasks(filteredMock);

    // Compute stats
    const total = mockTasks.length;
    const completed = mockTasks.filter(t => t.completed).length;
    const pending = total - completed;

    let overallTargetSum = 0;
    let overallCompletedSum = 0;
    mockTasks.forEach(t => {
      const target = t.targetCompletions || 1;
      overallTargetSum += target;
      overallCompletedSum += t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
    });
    const overallPercentage = overallTargetSum > 0 ? Math.round((overallCompletedSum / overallTargetSum) * 100) : 0;

    const categories = ['daily', 'weekly', 'monthly'];
    const categoryStats = {};
    categories.forEach(cat => {
      const catTasks = mockTasks.filter(t => t.category === cat);
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
    });

    setStats({
      total,
      completed,
      pending,
      overallPercentage,
      streak: 2, // Hardcoded default for offline demo
      highestStreak: 5,
      dailyHistory: [
        { label: 'Mon', count: 1, percentage: 20 },
        { label: 'Tue', count: 3, percentage: 60 },
        { label: 'Wed', count: 2, percentage: 40 },
        { label: 'Thu', count: 4, percentage: 80 },
        { label: 'Fri', count: 5, percentage: 100 },
        { label: 'Sat', count: 3, percentage: 60 },
        { label: 'Sun', count: 2, percentage: 40 }
      ],
      weeklyHistory: [
        { label: '3w ago', count: 8, percentage: 65 },
        { label: '2w ago', count: 12, percentage: 80 },
        { label: '1w ago', count: 15, percentage: 95 },
        { label: 'This Week', count: 6, percentage: 50 }
      ],
      monthlyHistory: [
        { label: 'Jan', count: 25, percentage: 70 },
        { label: 'Feb', count: 30, percentage: 85 },
        { label: 'Mar', count: 28, percentage: 80 },
        { label: 'Apr', count: 35, percentage: 90 },
        { label: 'May', count: 42, percentage: 95 },
        { label: 'Jun', count: 20, percentage: 55 }
      ],
      categories: categoryStats
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeCategory, activeView]);

  // Handle Toggle Completion
  const handleToggleComplete = async (task) => {
    const isNowCompleted = !task.completed;
    const target = task.targetCompletions || 1;
    const nextCount = isNowCompleted ? target : 0;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ completed: isNowCompleted }),
      });

      if (!response.ok) throw new Error('Failed to update task');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      // Offline fallback state update
      setTasks(prev =>
        prev.map(t => (t._id === task._id ? { ...t, completed: isNowCompleted, completedCount: nextCount } : t))
      );
      // Re-trigger recalculating stats based on offline tasks
      const updatedTasks = tasks.map(t => (t._id === task._id ? { ...t, completed: isNowCompleted, completedCount: nextCount } : t));
      setStats(prev => {
        const cat = task.category;
        const currentCatTotal = prev.categories[cat].total;
        const currentCatCompleted = updatedTasks.filter(t => t.category === cat && t.completed).length;

        let catTargetSum = 0;
        let catCompletedSum = 0;
        const catTasks = updatedTasks.filter(t => t.category === cat);
        catTasks.forEach(t => {
          const target = t.targetCompletions || 1;
          catTargetSum += target;
          catCompletedSum += t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
        });
        const percentage = catTargetSum > 0 ? Math.round((catCompletedSum / catTargetSum) * 100) : 0;

        let newStreak = prev.streak || 0;
        let newHighest = prev.highestStreak || 0;
        if (task.category === 'daily') {
          if (isNowCompleted) {
            newStreak += 1;
            newHighest = Math.max(newHighest, newStreak);
          } else {
            newStreak = Math.max(0, newStreak - 1);
          }
        }

        const nextCompletedCount = updatedTasks.filter(t => t.completed).length;

        let overallTargetSum = 0;
        let overallCompletedSum = 0;
        updatedTasks.forEach(t => {
          const target = t.targetCompletions || 1;
          overallTargetSum += target;
          overallCompletedSum += t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
        });
        const overallPercentage = overallTargetSum > 0 ? Math.round((overallCompletedSum / overallTargetSum) * 100) : 0;

        return {
          ...prev,
          completed: nextCompletedCount,
          pending: prev.total - nextCompletedCount,
          overallPercentage,
          streak: newStreak,
          highestStreak: newHighest,
          categories: {
            ...prev.categories,
            [cat]: {
              ...prev.categories[cat],
              completed: currentCatCompleted,
              pending: currentCatTotal - currentCatCompleted,
              percentage
            }
          }
        };
      });
    }
  };

  // Handle Update Task completed count
  const handleUpdateCount = async (task, nextCount) => {
    const target = task.targetCompletions || 1;
    const boundedCount = Math.max(0, Math.min(target, nextCount));
    const nextCompleted = boundedCount >= target;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ completedCount: boundedCount }),
      });

      if (!response.ok) throw new Error('Failed to update task count');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      // Offline fallback state update
      setTasks(prev =>
        prev.map(t => (t._id === task._id ? { ...t, completedCount: boundedCount, completed: nextCompleted } : t))
      );
      const updatedTasks = tasks.map(t => (t._id === task._id ? { ...t, completedCount: boundedCount, completed: nextCompleted } : t));
      setStats(prev => {
        const cat = task.category;
        const currentCatTotal = prev.categories[cat].total;
        const currentCatCompleted = updatedTasks.filter(t => t.category === cat && t.completed).length;

        let catTargetSum = 0;
        let catCompletedSum = 0;
        const catTasks = updatedTasks.filter(t => t.category === cat);
        catTasks.forEach(t => {
          const target = t.targetCompletions || 1;
          catTargetSum += target;
          catCompletedSum += t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
        });
        const percentage = catTargetSum > 0 ? Math.round((catCompletedSum / catTargetSum) * 100) : 0;

        const nextCompletedCount = updatedTasks.filter(t => t.completed).length;

        let overallTargetSum = 0;
        let overallCompletedSum = 0;
        updatedTasks.forEach(t => {
          const target = t.targetCompletions || 1;
          overallTargetSum += target;
          overallCompletedSum += t.completedCount !== undefined && t.completedCount !== null ? t.completedCount : (t.completed ? target : 0);
        });
        const overallPercentage = overallTargetSum > 0 ? Math.round((overallCompletedSum / overallTargetSum) * 100) : 0;

        return {
          ...prev,
          completed: nextCompletedCount,
          pending: prev.total - nextCompletedCount,
          overallPercentage,
          categories: {
            ...prev.categories,
            [cat]: {
              ...prev.categories[cat],
              completed: currentCatCompleted,
              pending: currentCatTotal - currentCatCompleted,
              percentage
            }
          }
        };
      });
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete task');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      // Offline fallback deletion
      setTasks(prev => prev.filter(t => t._id !== taskId));
    }
  };

  // Open modal for Create
  const openAddModal = () => {
    setModalMode('add');
    setTaskTitle('');
    setTaskDescription('');
    setTaskCategory(activeCategory);
    setTaskTargetCompletions(1);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const openEditModal = (task) => {
    setModalMode('edit');
    setEditingTaskId(task._id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskCategory(task.category);
    setTaskTargetCompletions(task.targetCompletions || 1);
    setIsModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      if (modalMode === 'add') {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription,
            category: taskCategory,
            targetCompletions: taskCategory === 'daily' ? 1 : taskTargetCompletions
          }),
        });

        if (!response.ok) throw new Error('Failed to create task');
      } else {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${editingTaskId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription,
            category: taskCategory,
            targetCompletions: taskCategory === 'daily' ? 1 : taskTargetCompletions
          }),
        });

        if (!response.ok) throw new Error('Failed to update task');
      }

      setIsModalOpen(false);
      // Set active category to match updated/created task category
      setActiveCategory(taskCategory);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      // Offline creation fallback
      if (modalMode === 'add') {
        const newTask = {
          _id: 'mock-' + Date.now(),
          title: taskTitle,
          description: taskDescription,
          category: taskCategory,
          completed: false,
          targetCompletions: taskCategory === 'daily' ? 1 : Math.max(1, taskTargetCompletions),
          completedCount: 0,
          createdAt: new Date().toISOString()
        };
        if (taskCategory === activeCategory) {
          setTasks(prev => [newTask, ...prev]);
        }
      } else {
        setTasks(prev =>
          prev.map(t =>
            t._id === editingTaskId
              ? {
                ...t,
                title: taskTitle,
                description: taskDescription,
                category: taskCategory,
                targetCompletions: taskCategory === 'daily' ? 1 : Math.max(1, taskTargetCompletions),
                completedCount: t.completedCount > Math.max(1, taskTargetCompletions) ? Math.max(1, taskTargetCompletions) : (t.completedCount || 0),
                completed: (t.completedCount || 0) >= Math.max(1, taskTargetCompletions)
              }
              : t
          )
        );
      }
      setIsModalOpen(false);
    }
  };

  // Helper date formatter
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get time remaining for weekly and monthly resets
  const getTimeRemaining = () => {
    const now = new Date();
    if (activeCategory === 'weekly') {
      const resultDate = new Date();
      resultDate.setDate(now.getDate() + (7 - now.getDay()) % 7);
      resultDate.setHours(23, 59, 59, 999);
      const diffMs = resultDate - now;
      const days = Math.floor(diffMs / (24 * 3600 * 1000));
      const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
      return `${days}d ${hours}h left this week`;
    } else if (activeCategory === 'monthly') {
      const resultDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const diffMs = resultDate - now;
      const days = Math.floor(diffMs / (24 * 3600 * 1000));
      const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
      return `${days}d ${hours}h left this month`;
    }
    return 'Resets daily at midnight';
  };

  // Get dynamic difficulty badges for multi-completions
  const getDifficultyBadge = (target) => {
    if (!target || target <= 1) return null;
    if (target <= 4) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
          Habit Builder
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.08)] animate-pulse">
        Mastery Quest
      </span>
    );
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800',
    sidebar: isDarkMode ? 'bg-slate-900/60 border-slate-800/85' : 'bg-white border-slate-200 shadow-sm shadow-slate-100/60',
    sidebarText: isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    sidebarActive: isDarkMode ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500/50 shadow-md shadow-indigo-600/5' : 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm',
    header: isDarkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-white/70 border-slate-200',
    card: isDarkMode ? 'bg-slate-900/40 border-slate-800/85 hover:border-slate-700/60' : 'bg-white border-slate-200/80 shadow-sm shadow-slate-100/50 hover:border-slate-300 hover:shadow-md transition-all duration-300',
    cardTextSec: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    cardTitle: isDarkMode ? 'text-white' : 'text-slate-900',
    taskItem: (completed) => completed
      ? (isDarkMode ? 'bg-slate-950/20 border-slate-900/40 opacity-70' : 'bg-slate-50 border-slate-200 opacity-60')
      : (isDarkMode ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-900/50' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'),
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setActiveCategory(view);
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${theme.bg}`}>

      {/* LEFT SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col border-r transition-all duration-300 ${theme.sidebar} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b flex items-center justify-between border-inherit">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Life<span className="text-indigo-500">Tracker</span>
              </h1>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block -mt-1">
                Productivity Hub
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors lg:hidden"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>

          {/* Overview button */}
          <button
            onClick={() => { setActiveView('overview'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold border transition-all ${activeView === 'overview' ? theme.sidebarActive : theme.sidebarText + ' border-transparent'
              }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span>Overview</span>
          </button>

          {/* Divider */}
          <div className="h-px bg-slate-800/40 dark:bg-slate-200/10 my-4" />

          {/* Daily button */}
          <button
            onClick={() => { handleViewChange('daily'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold border transition-all ${activeView === 'daily' ? theme.sidebarActive : theme.sidebarText + ' border-transparent'
              }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span>Daily</span>
          </button>

          {/* Weekly button */}
          <button
            onClick={() => { handleViewChange('weekly'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold border transition-all ${activeView === 'weekly' ? theme.sidebarActive : theme.sidebarText + ' border-transparent'
              }`}
          >
            <CalendarRange className="w-4.5 h-4.5" />
            <span>Weekly</span>
          </button>

          {/* Monthly button */}
          <button
            onClick={() => { handleViewChange('monthly'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold border transition-all ${activeView === 'monthly' ? theme.sidebarActive : theme.sidebarText + ' border-transparent'
              }`}
          >
            <CalendarDays className="w-4.5 h-4.5" />
            <span>Monthly</span>
          </button>

          {/* Sidebar CTA */}
          <div className="pt-8 px-2">
            <button
              onClick={openAddModal}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/15"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-inherit space-y-1">
          <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${theme.sidebarText}`}>
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${theme.sidebarText}`}>
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Center</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* RIGHT MAIN PANEL */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className={`h-16 border-b sticky top-0 z-30 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 ${theme.header}`}>
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl border lg:hidden ${isDarkMode ? 'border-slate-800 bg-slate-900/50 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search tasks visual mockup */}
            <div className="relative max-w-xs w-full hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                disabled
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border focus:outline-none transition-all ${isDarkMode
                    ? 'bg-slate-900/50 border-slate-800/80 text-slate-200 placeholder-slate-500'
                    : 'bg-slate-100/60 border-slate-200 text-slate-850 placeholder-slate-400'
                  }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-colors ${isDarkMode
                  ? 'border-slate-800 bg-slate-900/40 text-amber-400 hover:bg-slate-850/60'
                  : 'border-slate-200 bg-slate-100 text-slate-650 hover:bg-slate-200'
                }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <button
              className={`p-2.5 rounded-xl border relative ${isDarkMode ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-850/40' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-650 rounded-full" />
            </button>

            {/* Profile Info */}
            <div className={`flex items-center gap-3 pl-3 border-l ${isDarkMode ? 'border-slate-850' : 'border-slate-200'}`}>
              <div className="hidden md:flex flex-col text-right">
                <span className={`text-xs font-bold leading-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {user?.name || 'Life User'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                  {user?.email || ''}
                </span>
              </div>

              <button
                onClick={logout}
                className={`p-2.5 rounded-xl border transition-colors ${isDarkMode
                    ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:text-indigo-450 text-slate-300'
                    : 'border-slate-200 bg-slate-100 hover:bg-slate-200 hover:text-indigo-650 text-slate-700'
                  }`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN WORKSPACE BODY */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-8">

          {error && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeView === 'overview' ? (

            /* WORKSPACE OVERVIEW VIEW */
            <div className="space-y-8">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.cardTitle}`}>
                    Workspace Overview
                  </h2>
                  <p className={`text-sm mt-1 ${theme.cardTextSec}`}>
                    Welcome back. You've completed {stats.overallPercentage}% of your targets today.
                  </p>
                </div>

                {/* Date card */}
                <div className={`flex items-center gap-2 py-2 px-4 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900/40 border-slate-800 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600'
                  }`}>
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* 4 Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                {/* Card 1: Total Tasks */}
                <div className={`rounded-2xl p-5 border flex items-center justify-between ${theme.card}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Tasks</p>
                      <h3 className={`text-2xl font-black mt-1 ${theme.cardTitle}`}>{stats.total}</h3>
                    </div>
                  </div>
                  <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 py-1 px-2 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    +12%
                  </span>
                </div>

                {/* Card 2: Completed Tasks */}
                <div className={`rounded-2xl p-5 border flex items-center justify-between ${theme.card}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
                      <h3 className={`text-2xl font-black mt-1 ${theme.cardTitle}`}>{stats.completed}</h3>
                    </div>
                  </div>
                  <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 py-1 px-2 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    +5%
                  </span>
                </div>

                {/* Card 3: Pending Tasks */}
                <div className={`rounded-2xl p-5 border flex items-center justify-between ${theme.card}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                      <h3 className={`text-2xl font-black mt-1 ${theme.cardTitle}`}>{stats.pending}</h3>
                    </div>
                  </div>
                  <span className="flex items-center gap-0.5 text-xs font-bold text-rose-500 bg-rose-500/10 py-1 px-2 rounded-full">
                    <TrendingDown className="w-3 h-3" />
                    -2%
                  </span>
                </div>

                {/* Card 4: Completion Rate */}
                <div className={`rounded-2xl p-5 border flex items-center justify-between ${theme.card}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion</p>
                      <h3 className={`text-2xl font-black mt-1 ${theme.cardTitle}`}>{stats.overallPercentage}%</h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-500 bg-indigo-500/10 py-1 px-2.5 rounded-full tracking-wider uppercase">
                    On Track
                  </span>
                </div>

              </div>

              {/* Category Completion Rates Progress Bars */}
              <div className={`rounded-3xl p-6 border ${theme.card} grid grid-cols-1 md:grid-cols-3 gap-6`}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Completion</span>
                    <span className="text-sm font-black text-indigo-500">{stats.categories?.daily?.percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.categories?.daily?.percentage || 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    {stats.categories?.daily?.completed || 0} of {stats.categories?.daily?.total || 0} daily tasks done
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Completion</span>
                    <span className="text-sm font-black text-emerald-500">{stats.categories?.weekly?.percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.categories?.weekly?.percentage || 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    {stats.categories?.weekly?.completed || 0} of {stats.categories?.weekly?.total || 0} weekly tasks done
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Completion</span>
                    <span className="text-sm font-black text-amber-500">{stats.categories?.monthly?.percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.categories?.monthly?.percentage || 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    {stats.categories?.monthly?.completed || 0} of {stats.categories?.monthly?.total || 0} monthly tasks done
                  </p>
                </div>
              </div>

              {/* Grid block for Analytics & Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Card: Performance Analytics Bar Chart */}
                <div className={`lg:col-span-8 rounded-3xl p-6 border flex flex-col justify-between ${theme.card}`}>
                  <div className="flex items-center justify-between border-b pb-4 border-slate-800/40 dark:border-slate-200/5">
                    <div>
                      <h3 className={`text-lg font-bold ${theme.cardTitle}`}>Performance Analytics</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Task completions tracking data</p>
                    </div>

                    <div className="relative">
                      <select
                        value={activeAnalyticsMode}
                        onChange={(e) => setActiveAnalyticsMode(e.target.value)}
                        className={`text-xs font-bold py-2 px-3.5 rounded-xl border focus:outline-none cursor-pointer transition-colors ${isDarkMode
                            ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        <option value="daily">Daily Mode</option>
                        <option value="weekly">Weekly Mode</option>
                        <option value="monthly">Monthly Mode</option>
                      </select>
                    </div>
                  </div>

                  {/* Render Custom SVG / CSS Bar Chart */}
                  <div className="mt-8 flex items-end justify-between h-64 pt-6 pb-2 px-2 relative">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-5">
                      <div className="w-full border-t border-slate-500" />
                      <div className="w-full border-t border-slate-500" />
                      <div className="w-full border-t border-slate-500" />
                      <div className="w-full border-t border-slate-500" />
                    </div>

                    {/* Bars Mapping */}
                    {(() => {
                      const historyData = activeAnalyticsMode === 'daily'
                        ? (stats.dailyHistory || [])
                        : activeAnalyticsMode === 'weekly'
                          ? (stats.weeklyHistory || [])
                          : (stats.monthlyHistory || []);

                      const maxVal = Math.max(...historyData.map(d => d.count), 1);

                      return historyData.map((d, index) => {
                        // Use actual completion percentage directly if available. Otherwise fall back to relative scaling.
                        const rawPercentage = d.percentage !== undefined
                          ? d.percentage
                          : (maxVal > 0 ? (d.count / maxVal) * 100 : 0);

                        return (
                          <div key={index} className="flex flex-col items-center flex-1 group z-10">
                            {/* Value tooltip */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded-md absolute -translate-y-9 shadow-md duration-200">
                              {d.count} Completed ({Math.round(rawPercentage)}%)
                            </span>

                            {/* Bar container */}
                            <div className="w-6 sm:w-12 bg-slate-200/50 dark:bg-slate-900/60 rounded-xl h-48 flex items-end overflow-hidden border border-slate-300/10 dark:border-transparent">
                              <div
                                className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-b-xl rounded-t-lg transition-all duration-700 ease-out cursor-pointer hover:brightness-110 shadow-lg shadow-indigo-500/10"
                                style={{ height: `${Math.max(rawPercentage * 0.85, 4)}%` }}
                              />
                            </div>

                            {/* X-axis Label */}
                            <span className="text-[10px] font-bold mt-3 text-slate-400 group-hover:text-indigo-500 transition-colors uppercase tracking-wider">
                              {d.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right Card: Consistency Peak Circular Progress wheel */}
                <div className={`lg:col-span-4 rounded-3xl p-6 border flex flex-col items-center justify-between text-center ${theme.card}`}>
                  <div className="w-full pb-4 border-b border-slate-800/40 dark:border-slate-200/5 text-left">
                    <h3 className={`text-lg font-bold ${theme.cardTitle}`}>Productivity Insights</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time completion metrics</p>
                  </div>

                  {/* SVG Circle Progress Ring */}
                  <div className="relative flex items-center justify-center my-6">
                    {(() => {
                      const radius = 52;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (stats.overallPercentage / 100) * circumference;
                      return (
                        <>
                          <svg className="w-36 h-36 transform -rotate-90">
                            {/* Underlay Track */}
                            <circle
                              className="text-slate-100 dark:text-slate-900 border"
                              strokeWidth="8"
                              stroke="currentColor"
                              fill="transparent"
                              r={radius}
                              cx="72"
                              cy="72"
                            />
                            {/* Active Ring */}
                            <circle
                              className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-out"
                              strokeWidth="8"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r={radius}
                              cx="72"
                              cy="72"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className={`text-3xl font-black leading-none ${theme.cardTitle}`}>
                              {stats.overallPercentage}%
                            </span>
                            <span className="text-[9px] font-extrabold text-slate-400 tracking-widest mt-1.5 uppercase">
                              Overall
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className={`text-sm font-extrabold tracking-tight ${theme.cardTitle}`}>
                        Consistency Peak
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed px-4">
                        {(() => {
                          const streak = stats.streak || 0;
                          const highest = stats.highestStreak || 0;
                          if (streak === 0) {
                            return `Start your productivity spark! Complete all daily tasks today to build a streak (Best: ${highest} ${highest === 1 ? 'day' : 'days'}).`;
                          } else if (streak <= 2) {
                            return `Good start! Keep finishing your daily schedule to heat up your ${streak}-day streak (Best: ${highest} ${highest === 1 ? 'day' : 'days'}).`;
                          } else if (streak <= 5) {
                            return `You're on fire! A solid ${streak}-day active streak. Maintain the focus to hit a new record!`;
                          } else {
                            return `Phenomenal consistency! Elite ${streak}-day streak active. You are unstoppable!`;
                          }
                        })()}
                      </p>
                    </div>

                    {/* Small visual streak flame widget */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`inline-flex items-center gap-2.5 py-2 px-3.5 rounded-xl border ${stats.streak > 0
                          ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                          : 'bg-slate-200/50 dark:bg-slate-900 border-transparent text-slate-400'
                        }`}>
                        <Flame className={`w-4 h-4 ${stats.streak > 0 ? 'fill-orange-500 animate-flame' : ''}`} />
                        <span className="text-xs font-bold">{stats.streak || 0} Day Streak Active</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                        Highest Streak: {stats.highestStreak || 0} {stats.highestStreak === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          ) : (

            /* TASK LIST AGENDA VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Quick category overview stats */}
              <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Task Category
                </h3>

                <div className={`p-5 rounded-2xl border ${theme.card} border-indigo-500/25 ring-1 ring-indigo-500/5`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-base font-bold capitalize ${theme.cardTitle}`}>
                      {activeCategory} Agenda
                    </span>
                    <span className={`text-xs font-bold bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-md text-slate-400`}>
                      {stats.categories?.[activeCategory]?.completed}/{stats.categories?.[activeCategory]?.total}
                    </span>
                  </div>

                  {/* Category progress indicator */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 font-semibold">
                      <span>Progress Rate</span>
                      <span>{stats.categories?.[activeCategory]?.percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stats.categories?.[activeCategory]?.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveView('overview')}
                  className={`w-full text-center py-3 rounded-xl border border-dashed border-slate-400 dark:border-slate-800 text-xs font-semibold text-slate-450 hover:text-indigo-550 transition-colors`}
                >
                  ← Back to Workspace Overview
                </button>
              </div>

              {/* Right Column: Selected Category Tasks List */}
              <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">

                <div className={`border rounded-2xl p-6 space-y-4 ${theme.card}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xl font-bold capitalize flex items-center gap-2 ${theme.cardTitle}`}>
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                        {activeCategory} Tasks
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{getTimeRemaining()}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-indigo-500 block">
                        {stats.categories?.[activeCategory]?.percentage || 0}%
                      </span>
                      <span className="text-[10px] text-slate-405 block font-bold uppercase tracking-wider">COMPLETED</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stats.categories?.[activeCategory]?.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Task list render */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-slate-805 rounded-2xl bg-slate-950/10">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-400 mt-3">Syncing tasks...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  /* Empty State */
                  <div className="text-center p-12 border border-slate-250 dark:border-slate-800 border-dashed rounded-2xl bg-slate-950/10 space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-slate-850/40 rounded-full text-slate-600 mb-2">
                      <PlusCircle className="w-10 h-10" />
                    </div>
                    <h4 className={`text-lg font-bold ${theme.cardTitle}`}>No tasks created yet</h4>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                      Start mapping your {activeCategory} schedule by creating a fresh task now.
                    </p>
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-500 border border-indigo-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First Task</span>
                    </button>
                  </div>
                ) : (
                  /* List of Tasks */
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
                        className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all ${theme.taskItem(task.completed)}`}
                      >
                        <button
                          onClick={() => {
                            if (task.targetCompletions > 1) {
                              if (task.completed) {
                                handleUpdateCount(task, 0);
                              } else {
                                handleUpdateCount(task, (task.completedCount || 0) + 1);
                              }
                            } else {
                              handleToggleComplete(task);
                            }
                          }}
                          className="mt-0.5 text-slate-455 hover:text-indigo-500 transition-colors flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-scale-in" />
                          ) : task.targetCompletions > 1 && (task.completedCount || 0) > 0 ? (
                            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-400 bg-indigo-500/10">
                              {task.completedCount}
                            </div>
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 sm:pr-16">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-base font-semibold leading-snug truncate ${task.completed ? 'text-slate-500 line-through' : theme.cardTitle
                                }`}
                            >
                              {task.title}
                            </h4>
                            {getDifficultyBadge(task.targetCompletions)}
                          </div>
                          {task.description && (
                            <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {task.targetCompletions > 1 && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/40 w-fit">
                              <button
                                onClick={() => handleUpdateCount(task, (task.completedCount || 0) - 1)}
                                disabled={(task.completedCount || 0) <= 0}
                                className={`p-1 rounded-lg transition-colors border ${isDarkMode
                                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30'
                                    : 'bg-slate-100 border-slate-200 text-slate-550 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30'
                                  }`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold font-mono tracking-wider min-w-[36px] text-center text-slate-500 dark:text-slate-400">
                                {task.completedCount || 0} / {task.targetCompletions}
                              </span>
                              <button
                                onClick={() => handleUpdateCount(task, (task.completedCount || 0) + 1)}
                                disabled={(task.completedCount || 0) >= task.targetCompletions}
                                className={`p-1 rounded-lg transition-colors border ${isDarkMode
                                    ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-850 disabled:opacity-30'
                                    : 'bg-slate-100 border-slate-200 text-indigo-600 hover:text-indigo-800 hover:bg-slate-200 disabled:opacity-30'
                                  }`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Created {formatDate(task.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 self-center sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(task)}
                            title="Edit Task"
                            className="p-2 hover:bg-slate-800/40 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            title="Delete Task"
                            className="p-2 hover:bg-slate-800/40 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          )}

        </main>

        {/* Footer */}
        <footer className={`border-t py-6 text-center text-xs text-slate-405 ${isDarkMode ? 'border-slate-850 bg-slate-950/30' : 'border-slate-200 bg-white/30'}`}>
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} LifeTracker App. Engineered for peak performance and visual excellence.</p>
          </div>
        </footer>

      </div>

      {/* Task Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>{modalMode === 'add' ? 'Create Task' : 'Edit Task'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="What needs to be done?"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Description <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  placeholder="Provide context or instructions..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Category Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['daily', 'weekly', 'monthly'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTaskCategory(cat)}
                      className={`py-2.5 px-4 text-sm font-semibold capitalize rounded-xl border transition-all ${taskCategory === cat
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {taskCategory !== 'daily' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Target Completions (Times to complete)
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <input
                      type="number"
                      min="1"
                      required
                      value={taskTargetCompletions}
                      onChange={(e) => setTaskTargetCompletions(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full sm:w-24 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3.5 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all text-sm font-semibold"
                    />
                    <span className="text-xs text-slate-500 leading-normal">
                      Number of times this task must be completed (e.g. 3 sessions, 5 workouts).
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/15"
                >
                  {modalMode === 'add' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
