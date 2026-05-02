'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  LogOut,
} from 'lucide-react';

import {
  Sidebar as AcetSidebar,
  SidebarBody,
  SidebarLink,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Role } from '@/types';

// ─── Logo ────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center gap-2 py-1 text-sm font-normal"
    >
      <CheckSquare className="h-5 w-6 shrink-0 text-indigo-500 dark:text-indigo-400" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="whitespace-pre font-bold text-neutral-900 dark:text-white tracking-tight text-lg font-heading"
      >
        TaskFlow
      </motion.span>
    </Link>
  );
}

// ─── Navigation items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: <FolderKanban className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: 'My Tasks',
    href: '/tasks',
    icon: <CheckSquare className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
];

// ─── ActiveSidebarLink — wraps SidebarLink with active-route highlight ────────

function ActiveSidebarLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <SidebarLink
      link={{ label, href, icon }}
      className={cn(
        'rounded-md px-2 transition-colors',
        isActive
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
          : 'text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-neutral-700/50',
      )}
    />
  );
}

// ─── Main Sidebar export ──────────────────────────────────────────────────────

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  // Avatar initials fallback
  const initials = user?.name?.[0]?.toUpperCase() ?? 'U';

  const avatarIcon = (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
      {initials}
    </span>
  );

  return (
    <AcetSidebar open={open} setOpen={setOpen}>
      <SidebarBody className="h-full justify-between gap-10 border-r border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
        {/* Top section */}
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <Logo />

          <nav className="mt-8 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <ActiveSidebarLink key={item.href} {...item} />
            ))}
          </nav>
        </div>

        {/* Bottom section — user profile + sign out */}
        {user && (
          <div className="flex flex-col gap-1 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            {/* User row */}
            <SidebarLink
              link={{
                label: user.name ?? user.email ?? 'User',
                href: '#',
                icon: avatarIcon,
              }}
              className="cursor-default select-none px-2"
            />

            {/* Role badge — visible only when expanded */}
            <motion.div
              animate={{
                display: open ? 'flex' : 'none',
                opacity: open ? 1 : 0,
              }}
              className="items-center gap-2 px-2 pb-1"
            >
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                  user.role === Role.ADMIN
                    ? 'bg-red-500/10 text-red-500 dark:text-red-400'
                    : 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
                )}
              >
                {user.role}
              </span>
              <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                {user.email}
              </span>
            </motion.div>

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-neutral-700/50"
            >
              <LogOut className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              <motion.span
                animate={{
                  display: open ? 'inline-block' : 'none',
                  opacity: open ? 1 : 0,
                }}
                className="whitespace-pre text-sm"
              >
                Sign Out
              </motion.span>
            </button>
          </div>
        )}
      </SidebarBody>
    </AcetSidebar>
  );
}
