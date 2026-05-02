'use client';

import { TaskStatus, TaskPriority } from '@/types';

export interface TaskFilterValues {
  status?: TaskStatus;
  priority?: TaskPriority;
  overdue?: boolean;
  assignedToId?: string;
  page?: number;
}

interface TaskFiltersProps {
  filters: TaskFilterValues;
  onChange: (filters: TaskFilterValues) => void;
  projectMembers?: Array<{ user: { id: string, name: string | null, email: string } }>;
}

export function TaskFilters({ filters, onChange, projectMembers }: TaskFiltersProps) {
  const handleChange = (
    key: keyof TaskFilterValues,
    value: TaskFilterValues[keyof TaskFilterValues] | ''
  ) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
      <div className="w-full sm:w-auto flex-1 min-w-[150px]">
        <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">Status</label>
        <select
          id="status-filter"
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value as TaskStatus | '')}
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        >
          <option value="">All Statuses</option>
          <option value={TaskStatus.TODO}>To Do</option>
          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={TaskStatus.DONE}>Done</option>
        </select>
      </div>

      <div className="w-full sm:w-auto flex-1 min-w-[150px]">
        <label htmlFor="priority-filter" className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
        <select
          id="priority-filter"
          value={filters.priority || ''}
          onChange={(e) => handleChange('priority', e.target.value as TaskPriority | '')}
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        >
          <option value="">All Priorities</option>
          <option value={TaskPriority.LOW}>Low</option>
          <option value={TaskPriority.MEDIUM}>Medium</option>
          <option value={TaskPriority.HIGH}>High</option>
        </select>
      </div>

      {projectMembers && (
        <div className="w-full sm:w-auto flex-1 min-w-[150px]">
          <label htmlFor="assignee-filter" className="block text-xs font-medium text-gray-700 mb-1">Assignee</label>
          <select
            id="assignee-filter"
            value={filters.assignedToId || ''}
            onChange={(e) => handleChange('assignedToId', e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">Anyone</option>
            {projectMembers.map(m => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name || m.user.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-full sm:w-auto flex items-center h-[36px]">
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={filters.overdue || false}
            onChange={(e) => handleChange('overdue', e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-700">Overdue Only</span>
        </label>
      </div>
    </div>
  );
}
