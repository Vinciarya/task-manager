'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@/types';

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
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="flex items-center gap-x-4">
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                {user?.name}
              </span>
              {user?.role === Role.ADMIN && (
                <span className="ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
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
