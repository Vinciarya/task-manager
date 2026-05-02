'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { IProjectWithMeta } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getValidationErrors } from '@/lib/error-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

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

      <Card className="relative w-full max-w-md gap-0">
        <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle>{isEdit ? 'Edit Project' : 'New Project'}</CardTitle>
            <CardDescription>
              {isEdit ? 'Update the project details below.' : 'Deploy your new project in one-click.'}
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50 ml-4 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="py-6">
            <div className="grid w-full items-center gap-4">
              {error && !Object.keys(validationErrors).length && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="proj-name">Project Name *</Label>
                <Input
                  id="proj-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  disabled={isLoading}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name[0]}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="proj-description">Description</Label>
                <textarea
                  id="proj-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                  placeholder="Brief description of the project..."
                  disabled={isLoading}
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-600">{validationErrors.description[0]}</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-between border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" color="white" className="mr-2" /> : null}
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
