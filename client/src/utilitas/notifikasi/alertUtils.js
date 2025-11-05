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
        padding: '12px 16px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        maxWidth: '100%',
        wordWrap: 'break-word',
        pointerEvents: 'auto',
        cursor: 'pointer',
        backgroundColor: '#fff',
        border: '1px solid #ccc'
      };

      switch (type) {
        case ALERT_TYPES.SUCCESS:
          return { ...baseStyles, borderColor: '#28a745', color: '#155724' };
        case ALERT_TYPES.ERROR:
          return { ...baseStyles, borderColor: '#dc3545', color: '#721c24' };
        case ALERT_TYPES.WARNING:
          return { ...baseStyles, borderColor: '#ffc107', color: '#856404' };
        case ALERT_TYPES.INFO:
        default:
          return { ...baseStyles, borderColor: '#17a2b8', color: '#0c5460' };
      }
    };

    return (
      <div style={getAlertStyles()} onClick={handleClose}>
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
            padding: '4px',
            fontWeight: 'bold'
          }}
        >
          ×
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

    const handleConfirm = () => {
      root.unmount();
      if (document.body.contains(confirmContainer)) {
        document.body.removeChild(confirmContainer);
      }
      if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
      root.unmount();
      if (document.body.contains(confirmContainer)) {
        document.body.removeChild(confirmContainer);
      }
      if (onCancel) onCancel();
    };

    const handleBackdropClick = (e) => {
      if (e.target === confirmContainer) {
        handleCancel();
      }
    };

    const getConfirmStyles = () => {
      return {
        background: 'white',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid #ccc',
        overflow: 'hidden'
      };
    };

    const getButtonStyles = (isPrimary = false) => {
      const baseStyles = {
        padding: '8px 16px',
        borderRadius: '4px',
        fontWeight: 500,
        fontSize: '14px',
        cursor: 'pointer',
        border: '1px solid #ccc',
        minWidth: '80px'
      };

      if (isPrimary) {
        return { ...baseStyles, backgroundColor: '#007bff', color: 'white', borderColor: '#007bff' };
      } else {
        return { ...baseStyles, backgroundColor: '#fff', color: '#333' };
      }
    };

    return (
      <div style={getConfirmStyles()}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #e5e7eb'
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

// Show prompt dialog function
export const showPrompt = (message, onConfirm, onCancel, title = 'Input', placeholder = 'Masukkan nilai...', defaultValue = '') => {
  // Create prompt container
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
  `;
  document.body.appendChild(promptContainer);

  // Create React root
  const root = createRoot(promptContainer);

  // Prompt component
  const Prompt = () => {
    const [inputValue, setInputValue] = React.useState(defaultValue);

    const handleConfirm = () => {
      if (!inputValue.trim()) {
        return;
      }
      root.unmount();
      if (document.body.contains(promptContainer)) {
        document.body.removeChild(promptContainer);
      }
      if (onConfirm) onConfirm(inputValue);
    };

    const handleCancel = () => {
      root.unmount();
      if (document.body.contains(promptContainer)) {
        document.body.removeChild(promptContainer);
      }
      if (onCancel) onCancel();
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
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid #ccc',
        overflow: 'hidden'
      };
    };

    const getButtonStyles = (isPrimary = false) => {
      const baseStyles = {
        padding: '8px 16px',
        borderRadius: '4px',
        fontWeight: 500,
        fontSize: '14px',
        cursor: 'pointer',
        border: '1px solid #ccc',
        minWidth: '80px'
      };

      if (isPrimary) {
        return { ...baseStyles, backgroundColor: '#007bff', color: 'white', borderColor: '#007bff' };
      } else {
        return { ...baseStyles, backgroundColor: '#fff', color: '#333' };
      }
    };

    return (
      <div style={getPromptStyles()}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #e5e7eb'
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
          padding: '16px 24px',
          color: '#374151',
          lineHeight: '1.6'
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
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  // Add click handler to backdrop
  promptContainer.addEventListener('click', (e) => {
    if (e.target === promptContainer) {
      root.unmount();
      if (document.body.contains(promptContainer)) {
        document.body.removeChild(promptContainer);
      }
      if (onCancel) onCancel();
    }
  });

  // Add escape key handler
  const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
      root.unmount();
      if (document.body.contains(promptContainer)) {
        document.body.removeChild(promptContainer);
      }
      if (onCancel) onCancel();
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };
  
  document.addEventListener('keydown', handleEscapeKey);

  root.render(React.createElement(Prompt));
};

// Convenience functions
export const showSuccessAlert = (message, duration) => showAlert(message, ALERT_TYPES.SUCCESS, duration);
export const showErrorAlert = (message, duration) => showAlert(message, ALERT_TYPES.ERROR, duration);
export const showWarningAlert = (message, duration) => showAlert(message, ALERT_TYPES.WARNING, duration);
export const showInfoAlert = (message, duration) => showAlert(message, ALERT_TYPES.INFO, duration); 