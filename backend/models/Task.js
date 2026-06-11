import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: [true, 'Category is required (daily, weekly, monthly)'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    targetCompletions: {
      type: Number,
      default: 1,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;
