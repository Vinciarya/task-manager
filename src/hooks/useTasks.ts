import { useEffect, useCallback } from "react";
import { useTaskStore } from "@/store";
import { taskService } from "@/services";
import { CreateTaskInput, UpdateStatusInput } from "@/modules/task/task.schema";
import { TaskStatus, TaskPriority, ITask } from "@/types";
import { Logger } from "@/lib/logger";

export function useTasks(projectId: string) {
  const {
    tasksByStatus,
    isLoading,
    setTasks,
    addTask,
    moveTask,
    removeTask,
    setLoading,
  } = useTaskStore();

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const response = await taskService.getTasks({ projectId, limit: 100, page: 1 });
      if (response.success && response.data) {
        setTasks(response.data.items);
      }
    } catch (error: unknown) {
      Logger.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, setTasks, setLoading]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: CreateTaskInput): Promise<ITask | null> => {
    const tempId = `temp-task-${Date.now()}`;
    const tempTask: ITask = {
      id: tempId,
      title: data.title,
      description: data.description || null,
      status: TaskStatus.TODO,
      priority: data.priority || TaskPriority.MEDIUM,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId: data.projectId,
      assignedToId: data.assignedToId || null,
      createdById: "temp-user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Optimistic UI update
    addTask(tempTask);

    try {
      const response = await taskService.createTask(data);
      if (response.success && response.data) {
        removeTask(tempId);
        addTask(response.data);
        return response.data;
      }

      removeTask(tempId);
      return null;
    } catch (error) {
      removeTask(tempId);
      throw error;
    }
  };

  const updateStatus = async (id: string, newStatus: TaskStatus): Promise<void> => {
    let originalStatus: TaskStatus | null = null;
    
    // Find original status to allow reverting on failure
    for (const status of Object.values(TaskStatus)) {
      const found = tasksByStatus[status].find((t) => t.id === id);
      if (found) {
        originalStatus = status;
        break;
      }
    }

    if (!originalStatus || originalStatus === newStatus) return;

    // Optimistic kanban drag update
    moveTask(id, newStatus);

    try {
      const updateData: UpdateStatusInput = { status: newStatus };
      const response = await taskService.updateTaskStatus(id, updateData);
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      // Revert kanban drag
      moveTask(id, originalStatus);
      throw error;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    let taskToRestore: ITask | null = null;
    
    for (const status of Object.values(TaskStatus)) {
      const found = tasksByStatus[status].find((t) => t.id === id);
      if (found) {
        taskToRestore = found;
        break;
      }
    }

    if (!taskToRestore) return;

    // Optimistic UI update
    removeTask(id);

    try {
      const response = await taskService.deleteTask(id);
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      // Revert delete
      addTask(taskToRestore);
      throw error;
    }
  };

  return {
    tasksByStatus,
    isLoading,
    createTask,
    updateStatus,
    deleteTask,
    refreshTasks: fetchTasks,
  };
}
