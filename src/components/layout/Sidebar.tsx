'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Role } from '@/types';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-indigo-500" />
          TaskFlow
        </h1>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                    'mr-3 h-5 w-5 shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {user && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center w-full mb-4">
            <div className="flex-shrink-0">
              <span className="inline-block h-9 w-9 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium text-white">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                  user.role === Role.ADMIN ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                )}>
                  {user.role}
                </span>
                <p className="text-xs font-medium text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
