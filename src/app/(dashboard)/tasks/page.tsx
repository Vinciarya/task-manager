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
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
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
        <div className="bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Project</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Priority</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tasks.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
                
                return (
                  <tr key={task.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 max-w-[200px] truncate">
                      {task.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <Link href={`/projects/${task.projectId}`} className="text-indigo-600 hover:underline">
                        View Project
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="rounded-md border-0 py-1 pl-2 pr-8 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 bg-transparent cursor-pointer"
                        disabled={isLoading}
                      >
                        <option value={TaskStatus.TODO}>To Do</option>
                        <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                        <option value={TaskStatus.DONE}>Done</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
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
