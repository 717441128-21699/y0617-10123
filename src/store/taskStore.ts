import { create } from 'zustand';
import type { Task, TaskStatus, TaskPriority, TaskType } from '../types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { mockTasks } from '../data/mockTasks';

const generateTaskId = (): string => {
  return `t${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

interface TaskStore {
  tasks: Task[];
  getTasksByEventId: (eventId: string) => Task[];
  getTasksByAssignee: (userId: string) => Task[];
  getOverdueTasks: (userId?: string) => Task[];
  pendingTasksCount: (userId: string) => number;
  tasksStatusBreakdown: Record<TaskStatus, number>;
  initTasks: () => void;
  addTask: (taskData: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: storage.get<Task[]>(STORAGE_KEYS.TASKS, []),

  getTasksByEventId: (eventId: string) => {
    return get().tasks.filter((t) => t.eventId === eventId);
  },

  getTasksByAssignee: (userId: string) => {
    return get().tasks.filter((t) => t.assigneeId === userId);
  },

  getOverdueTasks: (userId?: string) => {
    const now = new Date().getTime();
    return get().tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      const deadline = new Date(t.deadline).getTime();
      if (deadline >= now) return false;
      if (userId && t.assigneeId !== userId) return false;
      return true;
    });
  },

  pendingTasksCount: (userId: string) => {
    return get().tasks.filter(
      (t) =>
        t.assigneeId === userId &&
        (t.status === 'todo' || t.status === 'in_progress' || t.status === 'review')
    ).length;
  },

  get tasksStatusBreakdown() {
    const breakdown: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      cancelled: 0,
    };
    get().tasks.forEach((t) => {
      breakdown[t.status]++;
    });
    return breakdown;
  },

  initTasks: () => {
    const stored = storage.get<Task[]>(STORAGE_KEYS.TASKS, []);
    if (stored.length === 0) {
      storage.set(STORAGE_KEYS.TASKS, mockTasks);
      set({ tasks: mockTasks });
    } else {
      set({ tasks: stored });
    }
  },

  addTask: (taskData: Partial<Task>) => {
    const now = new Date().toISOString();
    const id = generateTaskId();

    const newTask: Task = {
      id,
      eventId: taskData.eventId || '',
      title: taskData.title || '未命名任务',
      description: taskData.description || '',
      type: (taskData.type as TaskType) || 'other',
      priority: (taskData.priority as TaskPriority) || 'medium',
      status: (taskData.status as TaskStatus) || 'todo',
      assigneeId: taskData.assigneeId || 'u001',
      assignorId: taskData.assignorId || 'u001',
      createdAt: now,
      deadline: taskData.deadline || now,
      comments: [],
      attachments: [],
    };

    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  updateTask: (id: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  updateTaskStatus: (id: string, status: TaskStatus) => {
    const now = new Date().toISOString();
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated: Task = { ...t, status };
        if (status === 'completed' && !updated.completedAt) {
          updated.completedAt = now;
        }
        return updated;
      }),
    }));
  },

  deleteTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },
}));

useTaskStore.subscribe((state) => {
  storage.set(STORAGE_KEYS.TASKS, state.tasks);
});
