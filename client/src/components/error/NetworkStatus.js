import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { setupOnlineListener } from '../../utils/network/networkUtils';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const cleanup = setupOnlineListener((online) => {
            setIsOnline(online);
            if (!online) {
                setShow(true);
            } else {
                // Auto-hide after 3 seconds when back online
                setTimeout(() => setShow(false), 3000);
            }
        });

        return cleanup;
    }, []);

    if (!show) return null;

    return (
        <div
            className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${isOnline ? 'border-green-500' : 'border-red-500'
                } p-4 transition-all duration-300`}
        >
            <div className="flex items-start">
                <div className={`flex-shrink-0 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
                        {isOnline ? 'Koneksi internet kembali aktif' : 'Koneksi internet terputus'}
                    </p>
                    <p className={`text-xs mt-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                        {isOnline
                            ? 'Anda dapat melanjutkan menggunakan aplikasi.'
                            : 'Beberapa fitur mungkin tidak berfungsi. Periksa koneksi internet Anda.'}
                    </p>
                </div>
                <button
                    onClick={() => setShow(false)}
                    className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default NetworkStatus;

