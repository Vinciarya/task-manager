'use client';

import { useEffect } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { TaskFilters } from '@/components/task/TaskFilters';
import { useTaskStore } from '@/store/taskStore';
import { useSession } from 'next-auth/react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { CheckSquare } from 'lucide-react';
import { TaskStatus } from '@/types';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Pagination } from '@/components/shared/Pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import type { TaskFilterValues } from '@/components/task/TaskFilters';

export default function TasksPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  const { tasks, totalTasks, currentPage, limit, filters, setFilters, fetchFilteredTasks, isLoading, updateTaskStatus } = useTaskStore();

  useEffect(() => {
    if (currentUserId) {
      // Initialize with assignedToId = current user
      if (!filters.assignedToId) {
        setFilters({ ...filters, assignedToId: currentUserId });
      } else {
        fetchFilteredTasks();
      }
    }
  }, [currentUserId, filters, setFilters, fetchFilteredTasks]);

  const handleFilterChange = (newFilters: TaskFilterValues): void => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  return (
    <PageWrapper>
      <div className="mb-10">
        <h1 className="text-3xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-4xl sm:tracking-tight">
          All My Tasks
        </h1>
      </div>

      <div className="mb-6">
        <TaskFilters filters={filters} onChange={handleFilterChange} />
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your filters or checking a different project."
          icon={<CheckSquare className="h-12 w-12" />}
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-gray-200 dark:ring-neutral-800 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-neutral-800">
            <thead className="bg-gray-50 dark:bg-neutral-800/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Title</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Project</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Priority</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800 bg-card">
              {tasks.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
                
                return (
                  <tr key={task.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6 max-w-[200px] truncate">
                      {task.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-neutral-400">
                      <Link href={`/projects/${task.projectId}`} className="text-indigo-600 hover:underline">
                        View Project
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-neutral-400">
                      <Select
                        value={task.status}
                        onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                          <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                          <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-neutral-400">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-neutral-400">
                      {task.dueDate ? (
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            total={totalTasks}
            page={currentPage}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </PageWrapper>
  );
}
