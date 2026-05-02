'use client';

import { useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ProjectList } from '@/components/project/ProjectList';
import { ProjectForm } from '@/components/project/ProjectForm';
import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@/types';

export default function ProjectsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <PageWrapper>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Projects
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your projects and view their progress.
          </p>
        </div>
        
        {isAdmin && (
          <div className="mt-4 sm:ml-4 sm:mt-0">
            <button
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              New Project
            </button>
          </div>
        )}
      </div>

      <ProjectList />

      {showNewProject && (
        <ProjectForm
          isOpen={true}
          onClose={() => setShowNewProject(false)}
        />
      )}
    </PageWrapper>
  );
}
