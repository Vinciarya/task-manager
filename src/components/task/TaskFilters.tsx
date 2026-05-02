'use client';

import { TaskStatus, TaskPriority } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Filter, Users, CalendarDays, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    onChange({ ...filters, [key]: value === '' ? undefined : value, page: 1 });
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-end">
      <div className="w-full sm:w-auto flex-1 min-w-[180px]">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
          <Filter className="h-3 w-3" /> Status
        </Label>
        <Select
          value={filters.status || '_all'}
          onValueChange={(v) => handleChange('status', v === '_all' ? '' : v as TaskStatus)}
        >
          <SelectTrigger className="h-9 font-medium tracking-tight border-gray-200">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Statuses</SelectItem>
            <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-auto flex-1 min-w-[180px]">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" /> Priority
        </Label>
        <Select
          value={filters.priority || '_all'}
          onValueChange={(v) => handleChange('priority', v === '_all' ? '' : v as TaskPriority)}
        >
          <SelectTrigger className="h-9 font-medium tracking-tight border-gray-200">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Priorities</SelectItem>
            <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
            <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
            <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {projectMembers && (
        <div className="w-full sm:w-auto flex-1 min-w-[180px]">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
            <Users className="h-3 w-3" /> Assignee
          </Label>
          <Select
            value={filters.assignedToId || '_all'}
            onValueChange={(v) => handleChange('assignedToId', v === '_all' ? '' : v)}
          >
            <SelectTrigger className="h-9 font-medium tracking-tight border-gray-200">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Anyone</SelectItem>
              {projectMembers.map(m => (
                <SelectItem key={m.user.id} value={m.user.id}>
                  {m.user.name || m.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="w-full sm:w-auto flex items-center gap-3 h-9 px-4 rounded-md border border-gray-100 bg-gray-50/50">
        <Switch
          id="overdue-filter"
          checked={filters.overdue || false}
          onCheckedChange={(checked) => handleChange('overdue', checked)}
        />
        <Label 
          htmlFor="overdue-filter" 
          className="text-sm font-bold tracking-tight text-gray-700 cursor-pointer select-none flex items-center gap-1.5"
        >
          <CalendarDays className={cn("h-4 w-4", filters.overdue ? "text-red-500" : "text-gray-400")} />
          Overdue Only
        </Label>
      </div>
    </div>
  );
}
