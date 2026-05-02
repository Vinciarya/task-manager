'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, LayoutDashboard, FolderKanban, CheckSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@/types';
import { ModeToggle } from '@/components/mode-toggle';

// ── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground top-0 left-1/2 -translate-x-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground left-0 top-1/2 -translate-y-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground right-0 top-1/2 -translate-y-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground bottom-0 left-1/2 -translate-x-1/2 opacity-80" />
    </div>
  );
}

// ── Animated nav link (vertical slide on hover) ───────────────────────────────
function AnimatedNavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group relative inline-flex h-5 items-start overflow-hidden text-sm font-medium ${
        active ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span className="flex h-5 items-center">{children}</span>
        <span className="flex h-5 items-center text-foreground">{children}</span>
      </div>
      {active && (
        <span className="absolute bottom-0 left-0 h-px w-full bg-foreground/40 rounded-full" />
      )}
    </a>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive page title from pathname
  let pageTitle = 'Dashboard';
  if (pathname.startsWith('/projects')) pageTitle = 'Projects';
  else if (pathname.startsWith('/tasks')) pageTitle = 'My Tasks';

  // Pill ↔ card shape toggle with delayed restore
  useEffect(() => {
    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    };
  }, [isOpen]);

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  ];

  // User initials avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '??';

  return (
    <header
      className={`fixed top-5 left-1/2 z-40 flex flex-col items-center
                  -translate-x-1/2
                  px-5 py-2.5
                  border border-border bg-background/80 backdrop-blur-md
                  shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                  w-[calc(100%-2rem)] sm:w-auto
                  ${headerShapeClass}
                  transition-[border-radius] duration-300 ease-in-out`}
    >
      {/* ── Top row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <LogoMark />
          <span className="hidden sm:block text-xs font-semibold tracking-widest text-foreground uppercase">
            TaskFlow
          </span>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <AnimatedNavLink
              key={link.href}
              href={link.href}
              active={pathname.startsWith(link.href)}
            >
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        {/* Desktop right-side controls */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Page title badge */}
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-foreground border border-border">
            {pageTitle}
          </span>

          <ModeToggle />

          <button
            type="button"
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {/* notification dot */}
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>

          {/* Separator */}
          <div className="h-5 w-px bg-border" aria-hidden="true" />

          {/* User chip */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {initials}
            </div>
            <span className="hidden lg:block text-sm font-medium text-foreground">
              {user?.name}
            </span>
            {user?.role === Role.ADMIN && (
              <span className="hidden lg:inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Mobile: page title + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
          <button
            className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground focus:outline-none"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ─────────────────────────────────────────── */}
      <div
        className={`sm:hidden flex flex-col items-center w-full overflow-hidden transition-all ease-in-out duration-300 ${
          isOpen ? 'max-h-96 opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col items-center gap-4 w-full">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 w-full justify-center py-1 text-sm transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Mobile user info */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border w-full justify-center">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <span className="text-sm text-foreground">{user?.name}</span>
          {user?.role === Role.ADMIN && (
            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">
              Admin
            </span>
          )}
          <ModeToggle />
          <button
            type="button"
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
