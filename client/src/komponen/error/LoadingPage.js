import React from 'react';
import Loading from '../umum/Loading';

const LoadingPage = ({ message = 'Memuat halaman...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <Loading message={message} size="xl" />
        <p className="text-gray-400 text-sm mt-3">Mohon tunggu sebentar...</p>
      </div>
    </div>
  );
};

export default LoadingPage;

