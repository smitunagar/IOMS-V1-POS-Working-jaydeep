import * as React from 'react';

export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || ''}`}
      {...props}
    />
  )
);
Skeleton.displayName = 'Skeleton'; 