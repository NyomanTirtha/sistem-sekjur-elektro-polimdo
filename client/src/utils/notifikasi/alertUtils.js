// utils/alertUtils.js
import React from 'react';
import { createRoot } from 'react-dom/client';

// Alert types
const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Confirm types
const CONFIRM_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info'
};

// Global alert queue management
let alertQueue = [];
let alertContainer = null;
let alertRoot = null;
const MAX_ALERTS = 5; // Maximum concurrent alerts
const ALERT_DEDUP_TIME = 2000; // Prevent same alert within 2 seconds
const recentAlerts = new Map(); // Track recent alerts to prevent duplicates

// Create or get alert container
const getOrCreateAlertContainer = () => {
  if (!alertContainer || !document.body.contains(alertContainer)) {
    // Remove any existing container first
    const existing = document.getElementById('alert-container');
    if (existing) {
      existing.remove();
    }

    alertContainer = document.createElement('div');
    alertContainer.id = 'alert-container';
    alertContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      max-width: 400px;
      width: 90%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(alertContainer);
    alertRoot = createRoot(alertContainer);
  }
  return alertContainer;
};

// Check if alert should be shown (deduplication)
const shouldShowAlert = (message, type) => {
  const key = `${type}-${message}`;
  const now = Date.now();
  const lastShown = recentAlerts.get(key);

  if (lastShown && (now - lastShown) < ALERT_DEDUP_TIME) {
    return false; // Too soon, don't show duplicate
  }

  recentAlerts.set(key, now);
  // Clean old entries (older than 10 seconds)
  for (const [k, v] of recentAlerts.entries()) {
    if (now - v > 10000) {
      recentAlerts.delete(k);
    }
  }
  return true;
};

// Render all alerts in queue
const renderAlerts = () => {
  const container = getOrCreateAlertContainer();
  const alertsToShow = alertQueue.slice(0, MAX_ALERTS);

  const AlertsList = () => {
    return (
      <>
        {alertsToShow.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </>
    );
  };

  alertRoot.render(React.createElement(AlertsList));
};

// Individual Alert Component with smooth animations
const AlertItem = ({ alert }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  React.useEffect(() => {
    // Trigger fade-in animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeAlert(alert.id);
    }, 300); // Match animation duration
  };

  React.useEffect(() => {
    // Auto-remove after duration
    const timer = setTimeout(() => {
      handleClose();
    }, alert.duration);

    return () => clearTimeout(timer);
  }, [alert.duration]);

  const getAlertStyles = () => {
    const baseStyles = {
      padding: '12px 16px',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      maxWidth: '100%',
      wordWrap: 'break-word',
      pointerEvents: 'auto',
      cursor: 'pointer',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      transform: isVisible && !isRemoving ? 'translateY(0)' : 'translateY(-20px)',
      opacity: isVisible && !isRemoving ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative'
    };

    // Simple gray style for all types
    return {
      ...baseStyles,
      color: '#374151'
    };
  };

  const getIcon = () => {
    const iconStyle = { width: '16px', height: '16px', flexShrink: 0, opacity: 0.6 };
    switch (alert.type) {
      case ALERT_TYPES.SUCCESS:
        return <svg style={iconStyle} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
      case ALERT_TYPES.ERROR:
        return <svg style={iconStyle} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
      case ALERT_TYPES.WARNING:
        return <svg style={iconStyle} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
      case ALERT_TYPES.INFO:
      default:
        return <svg style={iconStyle} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
    }
  };

  return (
    <div style={getAlertStyles()} onClick={handleClose}>
      {getIcon()}
      <div style={{ flex: 1, minWidth: 0, fontSize: '14px', lineHeight: '1.5' }}>
        {alert.message}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          color: '#9ca3af',
          opacity: 0.7,
          flexShrink: 0,
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'opacity 0.2s',
          lineHeight: '1'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      >
        ×
      </button>
    </div>
  );
};

// Remove alert from queue
const removeAlert = (id) => {
  alertQueue = alertQueue.filter(alert => alert.id !== id);
  renderAlerts();
  
  // Clean up container if no alerts left
  if (alertQueue.length === 0 && alertContainer) {
    setTimeout(() => {
      if (alertQueue.length === 0 && alertContainer && document.body.contains(alertContainer)) {
        alertContainer.remove();
        alertContainer = null;
        alertRoot = null;
      }
    }, 500);
  }
};

// Show alert function
export const showAlert = (message, type = ALERT_TYPES.INFO, duration = 4000) => {
  // Deduplication check
  if (!shouldShowAlert(message, type)) {
    return;
  }

  // Create alert object
  const alert = {
    id: `alert-${Date.now()}-${Math.random()}`,
    message,
    type,
    duration
  };

  // Add to queue
  alertQueue.push(alert);
  
  // Render alerts
  renderAlerts();

  // Return alert ID for potential manual removal
  return alert.id;
};

// Show confirm dialog function
export const showConfirm = (message, onConfirm, onCancel, title = 'Konfirmasi', type = CONFIRM_TYPES.WARNING, confirmText = 'Ya', cancelText = 'Tidak') => {
  // Prevent multiple confirm dialogs
  const existingConfirm = document.getElementById('confirm-container');
  if (existingConfirm) {
    return; // Already have a confirm dialog open
  }

  // Create confirm container
  const confirmContainer = document.createElement('div');
  confirmContainer.id = 'confirm-container';
  confirmContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  `;
  document.body.appendChild(confirmContainer);

  // Fade in
  requestAnimationFrame(() => {
    confirmContainer.style.opacity = '1';
  });

  // Create React root
  const root = createRoot(confirmContainer);

  // Confirm component
  const Confirm = () => {
    const [isClosing, setIsClosing] = React.useState(false);

    const handleConfirm = () => {
      setIsClosing(true);
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(confirmContainer)) {
          confirmContainer.remove();
        }
        if (onConfirm) onConfirm();
      }, 200);
    };

    const handleCancel = () => {
      setIsClosing(true);
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(confirmContainer)) {
          confirmContainer.remove();
        }
        if (onCancel) onCancel();
      }, 200);
    };

    const handleBackdropClick = (e) => {
      if (e.target === confirmContainer) {
        handleCancel();
      }
    };

    const getConfirmStyles = () => {
      return {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        transform: isClosing ? 'scale(0.95)' : 'scale(1)',
        opacity: isClosing ? 0 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      };
    };

    const getButtonStyles = (isPrimary = false) => {
      const baseStyles = {
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: 500,
        fontSize: '14px',
        cursor: 'pointer',
        border: '1px solid',
        minWidth: '90px',
        transition: 'all 0.2s'
      };

      if (isPrimary) {
        return { 
          ...baseStyles, 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          borderColor: '#3b82f6' 
        };
      } else {
        return { 
          ...baseStyles, 
          backgroundColor: '#fff', 
          color: '#374151',
          borderColor: '#d1d5db'
        };
      }
    };

    React.useEffect(() => {
      const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
          handleCancel();
        }
      };
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }, []);

    return (
      <div style={getConfirmStyles()} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827'
          }}>
            {title}
          </h3>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px 24px',
          color: '#374151',
          lineHeight: '1.6',
          fontSize: '14px'
        }}>
          {message.split('\n').map((line, index) => (
            <div key={index} style={{ marginBottom: index < message.split('\n').length - 1 ? '8px' : 0 }}>
              {line}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 20px 24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <button
            onClick={handleCancel}
            style={getButtonStyles(false)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={getButtonStyles(true)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    );
  };

  // Add click handler to backdrop
  confirmContainer.addEventListener('click', (e) => {
    if (e.target === confirmContainer) {
      root.unmount();
      if (document.body.contains(confirmContainer)) {
        confirmContainer.remove();
      }
      if (onCancel) onCancel();
    }
  });

  root.render(React.createElement(Confirm));
};

// Show prompt dialog function (keeping existing implementation with minor improvements)
export const showPrompt = (message, onConfirm, onCancel, title = 'Input', placeholder = 'Masukkan nilai...', defaultValue = '') => {
  const existingPrompt = document.getElementById('prompt-container');
  if (existingPrompt) {
    return; // Already have a prompt dialog open
  }

  const promptContainer = document.createElement('div');
  promptContainer.id = 'prompt-container';
  promptContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  `;
  document.body.appendChild(promptContainer);

  requestAnimationFrame(() => {
    promptContainer.style.opacity = '1';
  });

  const root = createRoot(promptContainer);

  const Prompt = () => {
    const [inputValue, setInputValue] = React.useState(defaultValue);
    const [isClosing, setIsClosing] = React.useState(false);

    const handleConfirm = () => {
      if (!inputValue.trim()) {
        return;
      }
      setIsClosing(true);
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(promptContainer)) {
          promptContainer.remove();
        }
        if (onConfirm) onConfirm(inputValue);
      }, 200);
    };

    const handleCancel = () => {
      setIsClosing(true);
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(promptContainer)) {
          promptContainer.remove();
        }
        if (onCancel) onCancel();
      }, 200);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleConfirm();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    const getPromptStyles = () => {
      return {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        transform: isClosing ? 'scale(0.95)' : 'scale(1)',
        opacity: isClosing ? 0 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      };
    };

    const getButtonStyles = (isPrimary = false) => {
      const baseStyles = {
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: 500,
        fontSize: '14px',
        cursor: 'pointer',
        border: '1px solid',
        minWidth: '90px',
        transition: 'all 0.2s'
      };

      if (isPrimary) {
        return { ...baseStyles, backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6' };
      } else {
        return { ...baseStyles, backgroundColor: '#fff', color: '#374151', borderColor: '#d1d5db' };
      }
    };

    React.useEffect(() => {
      const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
          handleCancel();
        }
      };
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }, []);

    return (
      <div style={getPromptStyles()} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827'
          }}>
            {title}
          </h3>
        </div>

        <div style={{
          padding: '20px 24px',
          color: '#374151',
          lineHeight: '1.6',
          fontSize: '14px'
        }}>
          <div style={{ marginBottom: '12px' }}>{message}</div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div style={{
          padding: '16px 24px 20px 24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <button
            onClick={handleCancel}
            style={getButtonStyles(false)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!inputValue.trim()}
            style={{
              ...getButtonStyles(true),
              opacity: inputValue.trim() ? 1 : 0.5,
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim()) {
                e.target.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  promptContainer.addEventListener('click', (e) => {
    if (e.target === promptContainer) {
      root.unmount();
      if (document.body.contains(promptContainer)) {
        promptContainer.remove();
      }
      if (onCancel) onCancel();
    }
  });

  root.render(React.createElement(Prompt));
};

// Convenience functions
export const showSuccessAlert = (message, duration = 4000) => showAlert(message, ALERT_TYPES.SUCCESS, duration);
export const showErrorAlert = (message, duration = 5000) => showAlert(message, ALERT_TYPES.ERROR, duration);
export const showWarningAlert = (message, duration = 4000) => showAlert(message, ALERT_TYPES.WARNING, duration);
export const showInfoAlert = (message, duration = 4000) => showAlert(message, ALERT_TYPES.INFO, duration);
