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

// Show alert function
export const showAlert = (message, type = ALERT_TYPES.INFO, duration = 5000) => {
  // Create alert container
  const alertContainer = document.createElement('div');
  alertContainer.id = 'alert-container';
  alertContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    max-width: 500px;
    width: 90%;
    pointer-events: none;
  `;
  document.body.appendChild(alertContainer);

  // Create React root
  const root = createRoot(alertContainer);

  // Alert component
  const Alert = () => {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          root.unmount();
          if (document.body.contains(alertContainer)) {
            document.body.removeChild(alertContainer);
          }
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
      setIsVisible(false);
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(alertContainer)) {
          document.body.removeChild(alertContainer);
        }
      }, 300);
    };

    // Auto-hide when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (alertContainer && !alertContainer.contains(event.target)) {
          handleClose();
        }
      };

      const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };

      // Enable pointer events for the alert content
      alertContainer.style.pointerEvents = 'auto';
      
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }, []);

    const getAlertStyles = () => {
      const baseStyles = {
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        marginBottom: '12px',
        transform: `translateY(${isVisible ? '0' : '-100%'})`,
        transition: 'transform 0.3s ease-in-out',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        maxWidth: '100%',
        wordWrap: 'break-word',
        pointerEvents: 'auto',
        cursor: 'pointer'
      };

      switch (type) {
        case ALERT_TYPES.SUCCESS:
          return { ...baseStyles, backgroundColor: '#d1fae5', border: '1px solid #10b981', color: '#065f46' };
        case ALERT_TYPES.ERROR:
          return { ...baseStyles, backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b' };
        case ALERT_TYPES.WARNING:
          return { ...baseStyles, backgroundColor: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' };
        case ALERT_TYPES.INFO:
        default:
          return { ...baseStyles, backgroundColor: '#dbeafe', border: '1px solid #3b82f6', color: '#1e40af' };
      }
    };

    const getIcon = () => {
      switch (type) {
        case ALERT_TYPES.SUCCESS:
          return '✅';
        case ALERT_TYPES.ERROR:
          return '❌';
        case ALERT_TYPES.WARNING:
          return '⚠️';
        case ALERT_TYPES.INFO:
        default:
          return 'ℹ️';
      }
    };

    return (
      <div style={getAlertStyles()} onClick={handleClose}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>{getIcon()}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {type === ALERT_TYPES.SUCCESS && 'Berhasil'}
            {type === ALERT_TYPES.ERROR && 'Error'}
            {type === ALERT_TYPES.WARNING && 'Peringatan'}
            {type === ALERT_TYPES.INFO && 'Info'}
          </div>
          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{message}</div>
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
            color: 'inherit',
            opacity: 0.7,
            flexShrink: 0,
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>
    );
  };

  root.render(React.createElement(Alert));
};

// Show confirm dialog function
export const showConfirm = (message, onConfirm, onCancel, title = 'Konfirmasi', type = CONFIRM_TYPES.WARNING, confirmText = 'Ya', cancelText = 'Tidak') => {
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
  `;
  document.body.appendChild(confirmContainer);

  // Create React root
  const root = createRoot(confirmContainer);

  // Confirm component
  const Confirm = () => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
      // Trigger animation
      setTimeout(() => setIsVisible(true), 10);
    }, []);

    const handleConfirm = () => {
      setIsVisible(false);
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(confirmContainer)) {
          document.body.removeChild(confirmContainer);
        }
        if (onConfirm) onConfirm();
      }, 200);
    };

    const handleCancel = () => {
      setIsVisible(false);
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(confirmContainer)) {
          document.body.removeChild(confirmContainer);
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
        transform: `scale(${isVisible ? 1 : 0.9})`,
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden'
      };
    };

    const getButtonStyles = (isPrimary = false) => {
      const baseStyles = {
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: 'none',
        minWidth: '100px'
      };

      if (isPrimary) {
        switch (type) {
          case CONFIRM_TYPES.DANGER:
            return { ...baseStyles, backgroundColor: '#ef4444', color: 'white' };
          case CONFIRM_TYPES.SUCCESS:
            return { ...baseStyles, backgroundColor: '#10b981', color: 'white' };
          case CONFIRM_TYPES.INFO:
            return { ...baseStyles, backgroundColor: '#3b82f6', color: 'white' };
          case CONFIRM_TYPES.WARNING:
          default:
            return { ...baseStyles, backgroundColor: '#f59e0b', color: 'white' };
        }
      } else {
        return { ...baseStyles, backgroundColor: '#f3f4f6', color: '#374151' };
      }
    };

    const getIcon = () => {
      switch (type) {
        case CONFIRM_TYPES.SUCCESS:
          return '✅';
        case CONFIRM_TYPES.ERROR:
        case CONFIRM_TYPES.DANGER:
          return '❌';
        case CONFIRM_TYPES.WARNING:
          return '⚠️';
        case CONFIRM_TYPES.INFO:
        default:
          return 'ℹ️';
      }
    };

    return (
      <div style={getConfirmStyles()}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>{getIcon()}</span>
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
          padding: '16px 24px',
          color: '#374151',
          lineHeight: '1.6'
        }}>
          {message.split('\n').map((line, index) => (
            <div key={index} style={{ marginBottom: index < message.split('\n').length - 1 ? '8px' : 0 }}>
              {line}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 24px 24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleCancel}
            style={getButtonStyles(false)}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={getButtonStyles(true)}
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
        document.body.removeChild(confirmContainer);
      }
      if (onCancel) onCancel();
    }
  });

  // Add escape key handler
  const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
      root.unmount();
      if (document.body.contains(confirmContainer)) {
        document.body.removeChild(confirmContainer);
      }
      if (onCancel) onCancel();
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };
  
  document.addEventListener('keydown', handleEscapeKey);

  root.render(React.createElement(Confirm));
};

// Convenience functions
export const showSuccessAlert = (message, duration) => showAlert(message, ALERT_TYPES.SUCCESS, duration);
export const showErrorAlert = (message, duration) => showAlert(message, ALERT_TYPES.ERROR, duration);
export const showWarningAlert = (message, duration) => showAlert(message, ALERT_TYPES.WARNING, duration);
export const showInfoAlert = (message, duration) => showAlert(message, ALERT_TYPES.INFO, duration); 