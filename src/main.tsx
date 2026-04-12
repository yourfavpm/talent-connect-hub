import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handlers to catch unhandled promise rejections and errors
window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Prevent the default handling (which would print to console)
  event.preventDefault();
});

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(<App />);

