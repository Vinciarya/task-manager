import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface PageWrapperProps {
  children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  );
}
