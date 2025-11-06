import React from 'react';

const Loading = ({ message = "Memuat..." }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        {/* Fast & Simple Spinner */}
        <div className="relative mb-4">
          {/* Main Spinning Ring - Faster animation */}
          <div 
            className="w-12 h-12 border-[3px] border-blue-200 border-t-blue-600 rounded-full"
            style={{
              animation: 'spin 0.6s linear infinite'
            }}
          ></div>
        </div>

        {/* Loading Text - Simple */}
        {message && (
          <p className="text-sm text-gray-600 font-medium">{message}</p>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loading; 