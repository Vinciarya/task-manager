'use client';

import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { CheckSquare, Clock, AlertTriangle, CalendarDays } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { TaskStatus } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

const statCards = (stats: DashboardStats) => [
  {
    label: 'Total Tasks',
    value: stats.totalTasks,
    icon: <CheckSquare className="h-6 w-6 text-white" aria-hidden="true" />,
    bg: 'bg-indigo-500',
    accent: '',
  },
  {
    label: 'In Progress',
    value: stats.byStatus?.IN_PROGRESS ?? 0,
    icon: <Clock className="h-6 w-6 text-white" aria-hidden="true" />,
    bg: 'bg-blue-500',
    accent: '',
  },
  {
    label: 'Overdue',
    value: stats.overdueCount ?? stats.overdueTasks ?? 0,
    icon: <AlertTriangle className="h-6 w-6 text-white" aria-hidden="true" />,
    bg: 'bg-red-500',
    accent: 'ring-1 ring-red-500/20',
    valueClass: 'text-red-600 dark:text-red-400',
    labelClass: 'text-red-600 dark:text-red-400',
  },
  {
    label: 'Due Today',
    value: stats.dueTodayCount ?? stats.tasksDueToday ?? 0,
    icon: <CalendarDays className="h-6 w-6 text-white" aria-hidden="true" />,
    bg: 'bg-orange-500',
    accent: '',
  },
];

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
          <p className="text-gray-500 dark:text-neutral-400">Failed to load dashboard statistics. Please try refreshing.</p>
        </div>
      </PageWrapper>
    );
  }

  const tasks = stats.myTasks ?? stats.recentActivity ?? [];

  return (
    <PageWrapper>
      <div className="mb-10">
        <h1 className="text-3xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-4xl sm:tracking-tight">
          Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {statCards(stats).map((s) => (
          <Card key={s.label} className={`overflow-hidden card-premium ${s.accent}`}>
            <CardContent className="relative pt-6 pb-12 px-5 sm:px-8">
              <dt>
                <div className={`absolute rounded-xl ${s.bg} p-3.5 shadow-lg`}>
                  {s.icon}
                </div>
                <p className={`ml-20 truncate text-sm font-bold uppercase tracking-wider ${s.labelClass ?? 'text-gray-500 dark:text-neutral-400'}`}>
                  {s.label}
                </p>
              </dt>
              <dd className="ml-20 flex items-baseline">
                <p className={`text-3xl font-bold tracking-tight ${s.valueClass ?? 'text-gray-900 dark:text-white'}`}>
                  {s.value}
                </p>
              </dd>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tasks by status */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              { label: 'To Do', key: TaskStatus.TODO, color: 'bg-gray-400' },
              { label: 'In Progress', key: TaskStatus.IN_PROGRESS, color: 'bg-blue-500' },
              { label: 'Done', key: TaskStatus.DONE, color: 'bg-green-500' },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600 dark:text-neutral-400">{label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-full h-4 overflow-hidden">
                  <div
                    className={`${color} h-full`}
                    style={{ width: `${((stats.byStatus?.[key] ?? 0) / (stats.totalTasks || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{stats.byStatus?.[key] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent tasks */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-neutral-800">
            <CardTitle>Recent Tasks</CardTitle>
            <Link href="/tasks" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {tasks.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
                {tasks.slice(0, 5).map((task) => (
                  <li key={task.id} className="p-4 hover:bg-accent transition-colors">
                    <Link href={`/projects/${task.projectId}`} className="block">
                      <p className="text-sm font-bold text-foreground truncate tracking-tight">{task.title}</p>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{task.status}</span>
                        {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-neutral-400">No tasks assigned to you.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
