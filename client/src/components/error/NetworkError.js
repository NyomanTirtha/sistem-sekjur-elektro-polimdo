import React from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

const NetworkError = ({ onRetry, message }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                    <div className="bg-orange-100 rounded-full p-4">
                        <WifiOff className="w-12 h-12 text-orange-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Koneksi Terputus
                </h1>

                <p className="text-gray-600 mb-2">
                    {message || 'Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif dan server berjalan.'}
                </p>

                <div className="mt-6 space-y-3">
                    <button
                        onClick={onRetry}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Coba Lagi
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Halaman
                    </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-blue-900 mb-1">Tips:</p>
                            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                                <li>Periksa koneksi internet Anda</li>
                                <li>Pastikan server backend berjalan di localhost:5000</li>
                                <li>Coba refresh halaman atau restart server</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkError;

