import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/error/ErrorBoundary";
import reportWebVitals from "./reportWebVitals";

// ✅ PERFORMANCE: Hide loading overlay lebih cepat
const hideLoadingOverlay = () => {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.opacity = "0";
    loadingOverlay.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => {
      loadingOverlay.style.display = "none";
    }, 300);
  }
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Use requestAnimationFrame untuk memastikan DOM sudah ter-render
requestAnimationFrame(() => {
  setTimeout(() => {
    hideLoadingOverlay();
    // Also add root class to show content
    const root = document.getElementById("root");
    if (root) {
      root.classList.add("loaded");
    }
  }, 300);
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
