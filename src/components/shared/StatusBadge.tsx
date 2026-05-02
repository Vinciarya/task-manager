import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusVariants: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-gray-100 text-gray-800 border-gray-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TaskStatus.DONE]: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
};

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusVariants[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
