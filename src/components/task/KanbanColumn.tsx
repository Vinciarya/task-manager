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
      className="flex flex-col bg-muted/40 dark:bg-neutral-900/40 rounded-xl w-80 shrink-0 max-h-full border border-border/50"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-4 flex items-center justify-between border-b border-border shrink-0">
        <h3 className="font-bold text-foreground flex items-center gap-2 font-heading text-sm uppercase tracking-wider">
          {title}
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-bold">
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
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-xs font-medium bg-muted/20">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
