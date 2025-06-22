import React from 'react';

const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Main Loading Circle */}
        <div className="relative mb-6">
          {/* Outer Ring */}
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
          
          {/* Spinning Ring */}
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-blue-400 rounded-full animate-spin"></div>
          
          {/* Inner Pulse */}
          <div className="absolute top-2 left-2 w-12 h-12 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          
          {/* Center Dot */}
          <div className="absolute top-6 left-6 w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 animate-pulse">
            {message}
          </h3>
          
          {/* Animated Dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Subtle Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Loading; 