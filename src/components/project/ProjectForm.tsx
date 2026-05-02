'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { IProjectWithMeta } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getValidationErrors } from '@/lib/error-message';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  project?: IProjectWithMeta;
}

export function ProjectForm({ isOpen, onClose, project }: ProjectFormProps) {
  const { createProject, updateProject, isLoading, error } = useProjectStore();
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const isEdit = !!project;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      if (isEdit) {
        await updateProject(project.id, { name, description });
      } else {
        await createProject({ name, description });
      }
      onClose();
    } catch (error: unknown) {
      const errors = getValidationErrors(error);
      if (errors) {
        setValidationErrors(errors);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={isLoading ? undefined : onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && !Object.keys(validationErrors).length && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g. Website Redesign"
              disabled={isLoading}
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-black mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
              placeholder="Brief description of the project..."
              disabled={isLoading}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description[0]}</p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" color="white" className="mr-2" /> : null}
              {isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
