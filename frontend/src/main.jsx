import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { ThemeProvider } from "@/hooks/useTheme";

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#fff",
          textAlign: "center",
        }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#888", marginBottom: 16, maxWidth: 360 }}>
            Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) or clear the site cache. If the problem continues, open the browser console for details.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              cursor: "pointer",
              backgroundColor: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 8,
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      })
      .catch(() => {
        // Avoid crashing app if SW registration fails in unsupported environments.
      });
  });
}
