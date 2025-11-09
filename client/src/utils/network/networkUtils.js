// Utility untuk mendeteksi network error dan offline status

export const isNetworkError = (error) => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('networkerror') ||
    errorMessage.includes('connection') ||
    errorName === 'networkerror' ||
    errorName === 'typeerror' ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNREFUSED'
  );
};

export const isOffline = () => {
  return !navigator.onLine;
};

export const setupOnlineListener = (callback) => {
  const handleOnline = () => {
    callback(true);
  };
  
  const handleOffline = () => {
    callback(false);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

