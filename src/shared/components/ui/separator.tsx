import * as React from 'react';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      className={`${
        orientation === 'vertical'
          ? 'border-r border-gray-200 dark:border-gray-700'
          : 'border-b border-gray-200 dark:border-gray-700'
      } ${className || ''}`}
      {...props}
    />
  )
);
Separator.displayName = 'Separator'; 