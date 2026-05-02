'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Edit2, Trash2, Users, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { IProjectWithMeta, Role } from '@/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useProjectStore } from '@/store/projectStore';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

interface ProjectCardProps {
  project: IProjectWithMeta;
  onEdit?: (project: IProjectWithMeta) => void;
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const [showMenu, setShowMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const removeProject = useProjectStore((s) => s.removeProject);

  const totalTasks = project.taskCounts.TODO + project.taskCounts.IN_PROGRESS + project.taskCounts.DONE;
  const progress = totalTasks === 0 ? 0 : Math.round((project.taskCounts.DONE / totalTasks) * 100);

  const handleDelete = async () => {
    try {
      await removeProject(project.id);
      setShowDelete(false);
    } catch {
      // Error is handled by store
    }
  };

  return (
    <>
      <Card className="flex flex-col h-full card-premium">
        <CardContent className="flex-1 flex flex-col pt-5">
          {/* Title row + menu */}
          <div className="flex justify-between items-start mb-2 relative">
            <Link href={`/projects/${project.id}`} className="hover:underline flex-1">
              <h3 className="text-xl font-bold text-gray-900 truncate tracking-tight">{project.name}</h3>
            </Link>

            {isAdmin && (
              <div className="relative ml-2">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <button
                      onClick={() => { setShowMenu(false); onEdit?.(project); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Edit2 className="h-4 w-4 mr-2" /> Edit
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); setShowDelete(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-1">
            {project.description || 'No description provided.'}
          </p>

          {/* Progress */}
          <div className="mt-auto">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{project.taskCounts.DONE}/{totalTasks} tasks done</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{project.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Clock className="h-4 w-4" />
                <span>0 overdue</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Link href={`/projects/${project.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            View Project &rarr;
          </Link>
        </CardFooter>
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will permanently delete all associated tasks."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isLoading={useProjectStore.getState().isLoading}
      />
    </>
  );
}
