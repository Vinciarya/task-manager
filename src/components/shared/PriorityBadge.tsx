import { TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

const priorityVariants: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-transparent text-green-700 border-green-500',
  [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TaskPriority.HIGH]: 'bg-red-100 text-red-800 border-red-200',
};

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        priorityVariants[priority],
        className
      )}
    >
      {priorityLabels[priority]}
    </span>
  );
}
