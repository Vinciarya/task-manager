import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const colorClasses = {
  primary: 'text-indigo-600',
  white: 'text-white',
  gray: 'text-gray-500',
};

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
