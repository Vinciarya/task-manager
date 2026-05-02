'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@/types';
import { ModeToggle } from '@/components/mode-toggle';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  // Derive page title from pathname
  let pageTitle = 'Dashboard';
  if (pathname.startsWith('/projects')) {
    pageTitle = 'Projects';
  } else if (pathname.startsWith('/tasks')) {
    pageTitle = 'My Tasks';
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-heading">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <ModeToggle />
          
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-neutral-800" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="flex items-center gap-x-4">
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-white" aria-hidden="true">
                {user?.name}
              </span>
              {user?.role === Role.ADMIN && (
                <span className="ml-2 inline-flex items-center rounded-md bg-rose-50 dark:bg-rose-900/20 px-2 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 ring-1 ring-inset ring-rose-600/10 dark:ring-rose-500/20">
                  Admin
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
