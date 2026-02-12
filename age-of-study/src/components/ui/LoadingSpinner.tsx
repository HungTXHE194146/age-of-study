import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div 
        className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
      ></div>
      {text && (
        <p className="text-gray-600 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );
}