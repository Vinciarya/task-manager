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
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 tracking-tight">
                  Overdue
                </span>
              )}
            </div>

            {canEditOrDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity outline-none"
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
            <h4 className="text-base font-bold text-gray-900 leading-tight mb-1 tracking-tight">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
          {task.assignedToId ? (
            <div className="flex items-center gap-1.5" title="Assigned to">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                <span className="text-[10px] font-medium leading-none text-gray-600">
                  <User className="h-3 w-3" />
                </span>
              </span>
            </div>
          ) : (
            <div className="text-gray-400 italic">Unassigned</div>
          )}

          {task.dueDate && (
            <div className={cn('flex items-center gap-1', isOverdue && 'text-red-600 font-medium')}>
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
