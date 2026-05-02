'use client';

import { TaskStatus, ITask, Role } from '@/types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: ITask[];
  onTaskClick?: ((task: ITask) => void) | undefined;
  onEditTask?: ((task: ITask) => void) | undefined;
  onDeleteTask?: ((taskId: string) => Promise<void>) | undefined;
  userRoleInProject?: Role | undefined;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
}

export function KanbanColumn({ 
  status, 
  title, 
  tasks, 
  onTaskClick, 
  onEditTask, 
  onDeleteTask, 
  userRoleInProject,
  onDrop 
}: KanbanColumnProps) {
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDrop(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="flex flex-col bg-gray-100 rounded-xl w-80 shrink-0 max-h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200 shrink-0">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          {title}
          <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            className="cursor-grab active:cursor-grabbing"
          >
            <TaskCard
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onClick={onTaskClick}
              userRoleInProject={userRoleInProject}
            />
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
