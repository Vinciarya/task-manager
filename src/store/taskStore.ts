import { create } from "zustand";
import { ITask, TaskStatus, TaskPriority } from "@/types";
import { taskService } from "@/services/task.service";
import type { CreateTaskInput } from "@/modules/task/task.schema";

export type TasksByStatus = Record<TaskStatus, ITask[]>;

export interface TaskFilters {
  search?: string;
  assigneeId?: string;
  assignedToId?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  isOverdue?: boolean;
  overdue?: boolean;
  page?: number;
  limit?: number;
}

interface TaskState {
  tasks: ITask[];
  tasksByStatus: TasksByStatus;
  groupedTasks: TasksByStatus;
  filters: TaskFilters;
  isLoading: boolean;
  totalTasks: number;
  currentPage: number;
  limit: number;
}

interface TaskActions {
  setTasks: (tasks: ITask[]) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  addTask: (task: ITask) => void;
  updateTask: (id: string, updates: Partial<ITask>) => void;
  removeTask: (id: string) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setLoading: (isLoading: boolean) => void;
  fetchTasksByProject: (projectId: string) => Promise<void>;
  fetchFilteredTasks: () => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<ITask | null>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const initialTasksByStatus: TasksByStatus = {
  [TaskStatus.TODO]: [],
  [TaskStatus.IN_PROGRESS]: [],
  [TaskStatus.DONE]: [],
};

const initialFilters: TaskFilters = {};

export const useTaskStore = create<TaskState & TaskActions>((set) => ({
  tasks: [],
  tasksByStatus: { ...initialTasksByStatus },
  groupedTasks: { ...initialTasksByStatus },
  filters: { ...initialFilters },
  isLoading: false,
  totalTasks: 0,
  currentPage: 1,
  limit: 10,

  setTasks: (tasks) => set(() => {
    const newGrouped: TasksByStatus = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: [],
    };
    
    tasks.forEach(task => {
      newGrouped[task.status].push(task);
    });
    
    return {
      tasks,
      tasksByStatus: newGrouped,
      groupedTasks: newGrouped,
      totalTasks: tasks.length,
    };
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

    const tasks = flattenTasks(newTasksByStatus);
    return { tasksByStatus: newTasksByStatus, groupedTasks: newTasksByStatus, tasks };
  }),

  addTask: (task) => set((state) => {
    const tasksByStatus = {
      ...state.tasksByStatus,
      [task.status]: [...state.tasksByStatus[task.status], task]
    };

    return {
      tasks: [...state.tasks, task],
      tasksByStatus,
      groupedTasks: tasksByStatus,
      totalTasks: state.totalTasks + 1,
    };
  }),

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

    const tasks = flattenTasks(newTasksByStatus);
    return { tasksByStatus: newTasksByStatus, groupedTasks: newTasksByStatus, tasks };
  }),

  removeTask: (id) => set((state) => {
    const tasksByStatus = {
      [TaskStatus.TODO]: state.tasksByStatus[TaskStatus.TODO].filter(t => t.id !== id),
      [TaskStatus.IN_PROGRESS]: state.tasksByStatus[TaskStatus.IN_PROGRESS].filter(t => t.id !== id),
      [TaskStatus.DONE]: state.tasksByStatus[TaskStatus.DONE].filter(t => t.id !== id),
    };
    const tasks = flattenTasks(tasksByStatus);

    return {
      tasks,
      tasksByStatus,
      groupedTasks: tasksByStatus,
      totalTasks: Math.max(0, state.totalTasks - 1),
    };
  }),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
    currentPage: filters.page ?? state.currentPage,
    limit: filters.limit ?? state.limit,
  })),

  setLoading: (isLoading) => set({ isLoading }),

  fetchTasksByProject: async (projectId: string): Promise<void> => {
    set({ isLoading: true });

    try {
      const response = await taskService.getTasks({ projectId, limit: 100, page: 1 });
      setTasksFromResponse(set, response.data?.items ?? [], response.data?.total);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFilteredTasks: async (): Promise<void> => {
    set({ isLoading: true });

    try {
      const state = useTaskStore.getState();
      const response = await taskService.getTasks({
        ...(state.filters.projectId && { projectId: state.filters.projectId }),
        ...(state.filters.status !== undefined && { status: state.filters.status }),
        ...(state.filters.priority !== undefined && { priority: state.filters.priority }),
        ...((state.filters.assignedToId ?? state.filters.assigneeId) !== undefined && {
          assignedToId: state.filters.assignedToId ?? state.filters.assigneeId,
        }),
        ...((state.filters.overdue ?? state.filters.isOverdue) !== undefined && {
          overdue: state.filters.overdue ?? state.filters.isOverdue,
        }),
        page: state.currentPage,
        limit: state.limit,
      });
      setTasksFromResponse(set, response.data?.items ?? [], response.data?.total);
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (data: CreateTaskInput): Promise<ITask | null> => {
    set({ isLoading: true });

    try {
      const response = await taskService.createTask(data);
      const task = response.data ?? null;
      if (task) {
        useTaskStore.getState().addTask(task);
      }
      return task;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus): Promise<void> => {
    useTaskStore.getState().moveTask(id, status);
    await taskService.updateTaskStatus(id, { status });
  },

  deleteTask: async (id: string): Promise<void> => {
    await taskService.deleteTask(id);
    useTaskStore.getState().removeTask(id);
  },
}));

function flattenTasks(tasksByStatus: TasksByStatus): ITask[] {
  return [
    ...tasksByStatus[TaskStatus.TODO],
    ...tasksByStatus[TaskStatus.IN_PROGRESS],
    ...tasksByStatus[TaskStatus.DONE],
  ];
}

function groupTasks(tasks: readonly ITask[]): TasksByStatus {
  const grouped: TasksByStatus = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  return grouped;
}

function setTasksFromResponse(
  set: (
    partial:
      | Partial<TaskState & TaskActions>
      | ((state: TaskState & TaskActions) => Partial<TaskState & TaskActions>)
  ) => void,
  tasks: ITask[],
  total: number | undefined
): void {
  const grouped = groupTasks(tasks);
  set({
    tasks,
    tasksByStatus: grouped,
    groupedTasks: grouped,
    totalTasks: total ?? tasks.length,
  });
}
