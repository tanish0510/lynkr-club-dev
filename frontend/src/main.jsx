import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
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
