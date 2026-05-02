'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ProjectCard } from './ProjectCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { FolderKanban } from 'lucide-react';
import { IProjectWithMeta } from '@/types';
import { ProjectForm } from './ProjectForm';

export function ProjectList() {
  const { projects, isLoading, error, fetchProjects } = useProjectStore();
  const [editingProject, setEditingProject] = useState<IProjectWithMeta | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (isLoading && projects.length === 0) {
    return <div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (error && projects.length === 0) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        Failed to load projects: {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Get started by creating a new project. Projects help you organize your tasks."
        icon={<FolderKanban className="h-12 w-12" />}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onEdit={(p) => setEditingProject(p)} 
          />
        ))}
      </div>
      
      {editingProject && (
        <ProjectForm 
          isOpen={true} 
          onClose={() => setEditingProject(null)} 
          project={editingProject} 
        />
      )}
    </>
  );
}
