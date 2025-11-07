import React from 'react';

const LoadingPage = ({ message = 'Memuat halaman...' }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="text-gray-600 text-lg font-medium mt-4">{message}</p>
                <p className="text-gray-400 text-sm mt-2">Mohon tunggu sebentar...</p>
            </div>
        </div>
    );
};

export default LoadingPage;

