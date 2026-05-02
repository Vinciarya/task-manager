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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectCardProps {
  project: IProjectWithMeta;
  onEdit?: (project: IProjectWithMeta) => void;
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
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
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white truncate tracking-tight font-heading">{project.name}</h3>
            </Link>

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-100/80 dark:bg-neutral-800/80 transition-colors outline-none">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit?.(project)} className="cursor-pointer">
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDelete(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 line-clamp-2 flex-1">
            {project.description || 'No description provided.'}
          </p>

          {/* Progress */}
          <div className="mt-auto">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span>{project.taskCounts.DONE}/{totalTasks} tasks done</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-indigo-100/50 dark:bg-indigo-950/30 rounded-full h-2 mb-4 border border-indigo-200/20 dark:border-indigo-500/10">
              <div className="bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)] h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-3">
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
