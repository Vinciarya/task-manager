import { TaskPriority } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const priorityVariants: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
  [TaskPriority.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20',
  [TaskPriority.HIGH]: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20',
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
    <Badge
      variant="outline"
      className={cn(
        'font-bold tracking-tight px-2 py-0.5 rounded-md border',
        priorityVariants[priority],
        className
      )}
    >
      {priorityLabels[priority]}
    </Badge>
  );
}
