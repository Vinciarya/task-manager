'use client';

import { useState } from 'react';
import { X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ITask, TaskPriority, TaskStatus } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getErrorMessage, getValidationErrors } from '@/lib/error-message';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface TaskFormPayload {
  title: string;
  description?: string | undefined;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignedToId?: string | undefined;
  dueDate?: string | undefined;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: ITask;
  projectId: string;
  projectMembers: Array<{ user: { id: string, name: string | null, email: string } }>;
  onSubmit: (data: TaskFormPayload, id?: string) => Promise<void>;
  isLoading: boolean;
  defaultStatus?: TaskStatus;
}

export function TaskForm({ isOpen, onClose, task, projectId, projectMembers, onSubmit, isLoading, defaultStatus = TaskStatus.TODO }: TaskFormProps) {
  const isEdit = !!task;
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || TaskPriority.MEDIUM);
  const [assignedToId, setAssignedToId] = useState(task?.assignedToId || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setFormError(null);

    const payload: TaskFormPayload = {
      title,
      description: description || undefined,
      status,
      priority,
      projectId,
      assignedToId: assignedToId || undefined,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    };

    try {
      await onSubmit(payload, task?.id);
      onClose();
    } catch (error: unknown) {
      const errors = getValidationErrors(error);
      if (errors) {
        setValidationErrors(errors);
      } else {
        setFormError(getErrorMessage(error, 'An error occurred'));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={isLoading ? undefined : onClose} />

      <Card className="relative w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] gap-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 py-4">
          <CardTitle>{isEdit ? 'Edit Task' : 'New Task'}</CardTitle>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          <form id="task-form" onSubmit={handleSubmit} className="py-4 space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {formError}
              </div>
            )}

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                disabled={isLoading}
              />
              {validationErrors.title && <p className="text-sm text-red-600">{validationErrors.title[0]}</p>}
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                placeholder="Details..."
                disabled={isLoading}
              />
              {validationErrors.description && <p className="text-sm text-red-600">{validationErrors.description[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as TaskStatus)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.status && <p className="text-sm text-red-600">{validationErrors.status[0]}</p>}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as TaskPriority)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.priority && <p className="text-sm text-red-600">{validationErrors.priority[0]}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                  value={assignedToId || '_unassigned'}
                  onValueChange={(v) => setAssignedToId(v === '_unassigned' ? '' : v)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_unassigned">Unassigned</SelectItem>
                    {projectMembers.map(m => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.name ?? m.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.assignedToId && <p className="text-sm text-red-600">{validationErrors.assignedToId[0]}</p>}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      id="dueDate"
                      type="button"
                      disabled={isLoading}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm text-left focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                        !dueDate && 'text-gray-400',
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0 text-gray-500" />
                      {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="rounded-md border shadow"
                    />
                  </PopoverContent>
                </Popover>
                {validationErrors.dueDate && <p className="text-sm text-red-600">{validationErrors.dueDate[0]}</p>}
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" color="white" className="mr-2" /> : null}
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
