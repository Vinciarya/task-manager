'use client';

import { useState } from 'react';
import { ITask, TaskStatus, Role } from '@/types';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Calendar, User, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: ITask;
  onEdit?: ((task: ITask) => void) | undefined;
  onDelete?: ((taskId: string) => Promise<void>) | undefined;
  userRoleInProject?: Role | undefined;
  onClick?: ((task: ITask) => void) | undefined;
  className?: string | undefined;
}

export function TaskCard({ task, onEdit, onDelete, userRoleInProject, onClick, className }: TaskCardProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isAdmin = userRoleInProject === Role.ADMIN;
  const isCreator = task.createdById === currentUserId;
  const canEditOrDelete = isAdmin || isCreator;

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      setShowDelete(false);
    } catch {
      // Error handled by store/parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer card-premium flex flex-col gap-0 group relative',
          className,
        )}
        onClick={() => onClick?.(task)}
      >
        <CardContent className="flex flex-col gap-3 pt-4">
          {/* Header row: badges + menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              {isOverdue && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 tracking-tight">
                  Overdue
                </span>
              )}
            </div>

            {canEditOrDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 opacity-0 group-hover:opacity-100 transition-opacity outline-none"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit?.(task)} className="cursor-pointer">
                    <Edit2 className="h-3 w-3 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDelete(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                    <Trash2 className="h-3 w-3 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Title + description */}
          <div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-white leading-tight mb-1 tracking-tight">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{task.description}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
          {task.assignedToId ? (
            <div className="flex items-center gap-1.5" title="Assigned to">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100/50 dark:bg-indigo-500/20">
                <span className="text-[10px] font-medium leading-none text-indigo-600 dark:text-indigo-400">
                  <User className="h-3 w-3" />
                </span>
              </span>
            </div>
          ) : (
            <div className="text-neutral-400 dark:text-neutral-500 italic">Unassigned</div>
          )}

          {task.dueDate && (
            <div className={cn('flex items-center gap-1', isOverdue && 'text-rose-600 dark:text-rose-400 font-medium')}>
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          )}
        </CardFooter>
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
