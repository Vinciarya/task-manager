import { create } from "zustand";
import { ITask, TaskStatus, TaskPriority } from "@/types";

export type TasksByStatus = Record<TaskStatus, ITask[]>;

export interface TaskFilters {
  search?: string;
  assigneeId?: string;
  projectId?: string;
  priority?: TaskPriority;
  isOverdue?: boolean;
}

interface TaskState {
  tasksByStatus: TasksByStatus;
  filters: TaskFilters;
  isLoading: boolean;
}

interface TaskActions {
  setTasks: (tasks: ITask[]) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  addTask: (task: ITask) => void;
  updateTask: (id: string, updates: Partial<ITask>) => void;
  removeTask: (id: string) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setLoading: (isLoading: boolean) => void;
}

const initialTasksByStatus: TasksByStatus = {
  [TaskStatus.TODO]: [],
  [TaskStatus.IN_PROGRESS]: [],
  [TaskStatus.DONE]: [],
};

const initialFilters: TaskFilters = {};

export const useTaskStore = create<TaskState & TaskActions>((set) => ({
  tasksByStatus: { ...initialTasksByStatus },
  filters: { ...initialFilters },
  isLoading: false,

  setTasks: (tasks) => set(() => {
    const newGrouped: TasksByStatus = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: [],
    };
    
    tasks.forEach(task => {
      newGrouped[task.status].push(task);
    });
    
    return { tasksByStatus: newGrouped };
  }),

  moveTask: (id, newStatus) => set((state) => {
    let taskToMove: ITask | undefined;
    const newTasksByStatus: TasksByStatus = {
      [TaskStatus.TODO]: [...state.tasksByStatus[TaskStatus.TODO]],
      [TaskStatus.IN_PROGRESS]: [...state.tasksByStatus[TaskStatus.IN_PROGRESS]],
      [TaskStatus.DONE]: [...state.tasksByStatus[TaskStatus.DONE]],
    };

    // Find and remove from current status
    for (const status of Object.values(TaskStatus)) {
      const index = newTasksByStatus[status as TaskStatus].findIndex(t => t.id === id);
      if (index !== -1) {
        taskToMove = { ...newTasksByStatus[status as TaskStatus][index], status: newStatus };
        newTasksByStatus[status as TaskStatus].splice(index, 1);
        break;
      }
    }

    // Add to new status
    if (taskToMove) {
      newTasksByStatus[newStatus].push(taskToMove);
    }

    return { tasksByStatus: newTasksByStatus };
  }),

  addTask: (task) => set((state) => ({
    tasksByStatus: {
      ...state.tasksByStatus,
      [task.status]: [...state.tasksByStatus[task.status], task]
    }
  })),

  updateTask: (id, updates) => set((state) => {
    const newTasksByStatus: TasksByStatus = {
      [TaskStatus.TODO]: [...state.tasksByStatus[TaskStatus.TODO]],
      [TaskStatus.IN_PROGRESS]: [...state.tasksByStatus[TaskStatus.IN_PROGRESS]],
      [TaskStatus.DONE]: [...state.tasksByStatus[TaskStatus.DONE]],
    };

    let foundStatus: TaskStatus | undefined;
    let taskIndex: number = -1;

    for (const status of Object.values(TaskStatus)) {
      const index = newTasksByStatus[status as TaskStatus].findIndex(t => t.id === id);
      if (index !== -1) {
        foundStatus = status as TaskStatus;
        taskIndex = index;
        break;
      }
    }

    if (foundStatus !== undefined && taskIndex !== -1) {
      const existingTask = newTasksByStatus[foundStatus][taskIndex];
      const updatedTask = { ...existingTask, ...updates };

      if (updates.status && updates.status !== foundStatus) {
        // Status changed, move task
        newTasksByStatus[foundStatus].splice(taskIndex, 1);
        newTasksByStatus[updates.status].push(updatedTask);
      } else {
        // Status didn't change
        newTasksByStatus[foundStatus][taskIndex] = updatedTask;
      }
    }

    return { tasksByStatus: newTasksByStatus };
  }),

  removeTask: (id) => set((state) => ({
    tasksByStatus: {
      [TaskStatus.TODO]: state.tasksByStatus[TaskStatus.TODO].filter(t => t.id !== id),
      [TaskStatus.IN_PROGRESS]: state.tasksByStatus[TaskStatus.IN_PROGRESS].filter(t => t.id !== id),
      [TaskStatus.DONE]: state.tasksByStatus[TaskStatus.DONE].filter(t => t.id !== id),
    }
  })),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  setLoading: (isLoading) => set({ isLoading }),
}));
