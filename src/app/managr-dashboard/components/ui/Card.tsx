import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'p-5' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${padding} ${className}`}>
      {children}
    </div>
  );
};
