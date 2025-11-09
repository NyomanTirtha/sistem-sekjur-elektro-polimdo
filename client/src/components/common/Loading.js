import React from 'react';

// Loading component yang sederhana dan konsisten
const Loading = ({ message = 'Memuat...', size = 'md', inline = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
    xl: 'w-16 h-16 border-4',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
    ></div>
  );

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        {spinner}
        {message && (
          <span className={`${textSizes[size]} text-gray-600`}>{message}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {spinner}
      {message && (
        <p className={`${textSizes[size]} text-gray-600 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Loading;
