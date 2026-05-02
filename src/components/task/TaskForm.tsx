'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ITask, TaskPriority, TaskStatus } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getErrorMessage, getValidationErrors } from '@/lib/error-message';

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
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
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
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
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
      
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="task-form" onSubmit={handleSubmit} className="p-6 space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Task title"
                disabled={isLoading}
              />
              {validationErrors.title && <p className="mt-1 text-sm text-red-600">{validationErrors.title[0]}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                placeholder="Details..."
                disabled={isLoading}
              />
              {validationErrors.description && <p className="mt-1 text-sm text-red-600">{validationErrors.description[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isLoading}
                >
                  <option value={TaskStatus.TODO}>To Do</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.DONE}>Done</option>
                </select>
                {validationErrors.status && <p className="mt-1 text-sm text-red-600">{validationErrors.status[0]}</p>}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isLoading}
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                </select>
                {validationErrors.priority && <p className="mt-1 text-sm text-red-600">{validationErrors.priority[0]}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  id="assignee"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isLoading}
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map(m => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name || m.user.email}
                    </option>
                  ))}
                </select>
                {validationErrors.assignedToId && <p className="mt-1 text-sm text-red-600">{validationErrors.assignedToId[0]}</p>}
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]} // Block past dates
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isLoading}
                />
                {validationErrors.dueDate && <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate[0]}</p>}
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={isLoading}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" color="white" className="mr-2" /> : null}
            {isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
