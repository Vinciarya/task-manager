'use client';

import { useEffect, useState, use } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { KanbanBoard } from '@/components/task/KanbanBoard';
import { MemberList } from '@/components/project/MemberList';
import { TaskForm } from '@/components/task/TaskForm';
import { useTaskStore } from '@/store/taskStore';
import { useSession } from 'next-auth/react';
import { Role } from '@/types';
import type { IProject, IProjectMember, IUser } from '@/types';
import { Plus, Users } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { TaskFormPayload } from '@/components/task/TaskForm';
import { getErrorMessage } from '@/lib/error-message';

interface ProjectMemberWithUser extends IProjectMember {
  user: IUser;
}

interface ProjectDetails extends IProject {
  members: ProjectMemberWithUser[];
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  const { fetchTasksByProject, createTask, isLoading: isTaskLoading } = useTaskStore();
  
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<ProjectDetails>(`/api/projects/${projectId}`);
        setProject(res.data);
        await fetchTasksByProject(projectId);
      } catch (error: unknown) {
        setError(getErrorMessage(error, 'Failed to load project details'));
      } finally {
        setIsLoading(false);
      }
    };
    loadProjectData();
  }, [projectId, fetchTasksByProject]);

  const handleCreateTask = async (data: TaskFormPayload): Promise<void> => {
    await createTask({
      title: data.title,
      projectId: data.projectId,
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
    });
  };

  const handleAddMember = async (email: string, role: Role): Promise<void> => {
    if (!project) {
      return;
    }

    const res = await apiClient.post<ProjectMemberWithUser>(`/api/projects/${projectId}/members`, { email, role });
    if (!res.data) {
      return;
    }

    // Update local state
    setProject({
      ...project,
      members: [...project.members, res.data]
    });
  };

  const handleRemoveMember = async (userId: string): Promise<void> => {
    if (!project) {
      return;
    }

    await apiClient.delete(`/api/projects/${projectId}/members/${userId}`);
    // Update local state
    setProject({
      ...project,
      members: project.members.filter((member) => member.userId !== userId)
    });
  };

  if (isLoading) return <PageWrapper><div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div></PageWrapper>;
  if (error) return <PageWrapper><div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div></PageWrapper>;
  if (!project) return null;

  const currentUserMembership = project.members.find((member) => member.userId === currentUserId);
  const userRoleInProject = currentUserMembership?.role;

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="mt-2 text-gray-500 max-w-2xl">{project.description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <div className="flex -space-x-2">
              {project.members.slice(0, 3).map((m) => (
                <div key={m.userId} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 ring-2 ring-white">
                  <span className="text-[10px] font-medium leading-none text-white">
                    {m.user.name?.[0]?.toUpperCase() || m.user.email[0].toUpperCase()}
                  </span>
                </div>
              ))}
              {project.members.length > 3 && (
                <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white">
                  <span className="text-[10px] font-medium leading-none text-gray-500">+{project.members.length - 3}</span>
                </div>
              )}
            </div>
            <Users className="h-4 w-4 ml-1 text-gray-400" />
          </button>
          
          <button
            onClick={() => setShowNewTask(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Task
          </button>
        </div>
      </div>

      {showMembers && (
        <div className="mb-8 max-w-3xl">
          <MemberList
            projectId={projectId}
            members={project.members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
          />
        </div>
      )}

      <div className="h-[calc(100vh-250px)] min-h-[500px]">
        <KanbanBoard
          projectId={projectId}
          userRoleInProject={userRoleInProject}
          projectMembers={project.members}
        />
      </div>

      {showNewTask && (
        <TaskForm
          isOpen={true}
          onClose={() => setShowNewTask(false)}
          projectId={projectId}
          projectMembers={project.members}
          onSubmit={handleCreateTask}
          isLoading={isTaskLoading}
        />
      )}
    </PageWrapper>
  );
}
