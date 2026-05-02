'use client';

import { useState } from 'react';
import { ITask, TaskStatus, Role } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { useTaskStore } from '@/store/taskStore';
import { TaskForm, type TaskFormPayload } from './TaskForm';
import { Logger } from '@/lib/logger';

interface KanbanBoardProps {
  projectId: string;
  userRoleInProject?: Role | undefined;
  projectMembers: Array<{ user: { id: string, name: string | null, email: string } }>;
}

export function KanbanBoard({ projectId, userRoleInProject, projectMembers }: KanbanBoardProps) {
  const { groupedTasks, updateTaskStatus, deleteTask, updateTask, isLoading } = useTaskStore();
  const [editingTask, setEditingTask] = useState<ITask | null>(null);

  const handleDrop = async (taskId: string, newStatus: TaskStatus) => {
    // Find task
    let taskToUpdate: ITask | undefined;
    for (const status in groupedTasks) {
      const task = groupedTasks[status as TaskStatus].find((item) => item.id === taskId);
      if (task) {
        taskToUpdate = task;
        break;
      }
    }

    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error: unknown) {
      Logger.error('Failed to update task status', error);
    }
  };

  const handleEditTaskSubmit = async (data: TaskFormPayload, id?: string): Promise<void> => {
    if (id) {
      await updateTask(id, toTaskUpdates(data));
    }
  };

  const columns = [
    { status: TaskStatus.TODO, title: 'To Do' },
    { status: TaskStatus.IN_PROGRESS, title: 'In Progress' },
    { status: TaskStatus.DONE, title: 'Done' }
  ];

  return (
    <>
      <div className="flex gap-6 h-full overflow-x-auto pb-4 pt-2">
        {columns.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            tasks={groupedTasks[col.status] || []}
            onDrop={handleDrop}
            onEditTask={setEditingTask}
            onDeleteTask={deleteTask}
            userRoleInProject={userRoleInProject}
          />
        ))}
      </div>

      {editingTask && (
        <TaskForm
          isOpen={true}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          projectId={projectId}
          projectMembers={projectMembers}
          onSubmit={handleEditTaskSubmit}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

function toTaskUpdates(data: TaskFormPayload): Partial<ITask> {
  const updates: Partial<ITask> = {
    title: data.title,
    status: data.status,
    priority: data.priority,
  };

  if (data.description !== undefined) {
    updates.description = data.description;
  }

  if (data.assignedToId !== undefined) {
    updates.assignedToId = data.assignedToId;
  }

  if (data.dueDate !== undefined) {
    updates.dueDate = new Date(data.dueDate);
  }

  return updates;
}
