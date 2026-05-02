'use client';

import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { CheckSquare, Clock, AlertTriangle, CalendarDays } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { TaskStatus } from '@/types';

interface DashboardTask {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | Date | null;
  projectId: string;
}

interface DashboardStats {
  totalTasks: number;
  byStatus: Partial<Record<TaskStatus, number>>;
  overdueCount?: number;
  overdueTasks?: number;
  dueTodayCount?: number;
  tasksDueToday?: number;
  myTasks?: DashboardTask[];
  recentActivity?: DashboardTask[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get<DashboardStats>('/api/dashboard/stats');
        setStats(res.data);
      } catch {
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (!stats) {
    return (
      <PageWrapper>
        <div className="text-center py-24">
          <p className="text-gray-500">Failed to load dashboard statistics. Please try refreshing.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-gray-100">
          <dt>
            <div className="absolute rounded-md bg-indigo-500 p-3">
              <CheckSquare className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Total Tasks</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{stats.totalTasks}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-gray-100">
          <dt>
            <div className="absolute rounded-md bg-blue-500 p-3">
              <Clock className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">In Progress</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{stats.byStatus?.IN_PROGRESS || 0}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-red-100 ring-1 ring-red-500/20">
          <dt>
            <div className="absolute rounded-md bg-red-500 p-3">
              <AlertTriangle className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-red-600">Overdue</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-red-600">{stats.overdueCount ?? stats.overdueTasks ?? 0}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-gray-100">
          <dt>
            <div className="absolute rounded-md bg-orange-500 p-3">
              <CalendarDays className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Due Today</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{stats.dueTodayCount ?? stats.tasksDueToday ?? 0}</p>
          </dd>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks by Status</h2>
          <div className="flex flex-col gap-4">
            {/* Simple CSS-based bar charts instead of Recharts to save setup */}
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm text-gray-600">To Do</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div className="bg-gray-400 h-full" style={{ width: `${(stats.byStatus?.TODO || 0) / (stats.totalTasks || 1) * 100}%` }} />
              </div>
              <span className="text-sm font-medium">{stats.byStatus?.TODO || 0}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm text-gray-600">In Progress</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${(stats.byStatus?.IN_PROGRESS || 0) / (stats.totalTasks || 1) * 100}%` }} />
              </div>
              <span className="text-sm font-medium">{stats.byStatus?.IN_PROGRESS || 0}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm text-gray-600">Done</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${(stats.byStatus?.DONE || 0) / (stats.totalTasks || 1) * 100}%` }} />
              </div>
              <span className="text-sm font-medium">{stats.byStatus?.DONE || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
            <Link href="/tasks" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(stats.myTasks ?? stats.recentActivity ?? []).length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {(stats.myTasks ?? stats.recentActivity ?? []).slice(0, 5).map((task) => (
                  <li key={task.id} className="p-4 hover:bg-gray-50">
                    <Link href={`/projects/${task.projectId}`} className="block">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{task.status}</span>
                        {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">No tasks assigned to you.</div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
