/**
 * src/main.js
 * Application bootstrap: initializes engine, sets up navigation shell, and binds router.
 */

import { startLoading } from "./core/engine.js";
import { onRoute, initRouter, navigate } from "./app/router.js";
import { clearCourse } from "./storage/store.js";
import { setCourse } from "./app/state.js";
import { createStatusChip } from "./components/status-chip.js";
import { el, append, empty } from "./utils/dom.js";

// Screens
import { renderLanding }   from "./screens/landing.js";
import { renderDashboard } from "./screens/dashboard.js";
import { renderApp }       from "./screens/app.js";
import { renderTeacher }   from "./screens/teacher.js";
import { renderPath }      from "./screens/path.js";
import { renderFinal }     from "./screens/final.js";

// Global error handler
window.addEventListener("error", (event) => {
  console.error("Global uncaught error:", event.error || event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("Global unhandled rejection:", event.reason);
});

// Boot the AI engine immediately in the background
startLoading();

// Initialize authentication before any screen is rendered
import { initAuth, onAuthChange, getAuthState } from './lib/authProvider.js';

// Define root container early
const appContainer = document.getElementById("app");

// Simple loading overlay while auth is being determined
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.textContent = 'Loading…';
loadingOverlay.style.cssText = 'position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:var(--bg); color:var(--text); font-family:var(--font-body); font-size:1.2rem; z-index:1000;';
appContainer.appendChild(loadingOverlay);

(async () => {
  await initAuth();
  // auth state is ready – remove loading overlay
  loadingOverlay.remove();
})();

// Helper to decide if a route is protected (requires auth)
function isProtected(route) {
  const publicRoutes = ['/', '/login'];
  return !publicRoutes.includes(route);
}

// Theme toggle initialization
const savedTheme = localStorage.getItem("lilet_r3ad_theme");
if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

// Create Shell Elements (Header & Screen Outlet)
const appHeader = el("header", { cls: "app-header", attrs: { style: "display:none;" } });
const logo = el("a", {
  cls: "app-header-logo",
  text: "lilet_r3ad",
  attrs: { href: "#/", "aria-label": "lilet_r3ad Home" },
});
const statusChip = createStatusChip();

const isDarkInitial = document.documentElement.getAttribute("data-theme") === "dark" ||
  (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);

const themeToggleBtn = el("button", {
  cls: "btn btn-ghost btn-sm",
  text: isDarkInitial ? "☀️ Light" : "🌙 Dark",
  attrs: { type: "button", "aria-label": "Toggle light or dark theme" },
});

themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const isDark = current === "dark" || (!current && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const next = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("lilet_r3ad_theme", next);
  themeToggleBtn.textContent = next === "dark" ? "☀️ Light" : "🌙 Dark";
});

const newCourseBtn = el("button", {
  cls: "btn btn-outline btn-sm",
  text: "New course",
  attrs: { type: "button", "aria-label": "Start a new course" },
});

newCourseBtn.addEventListener("click", () => {
  clearCourse();
  setCourse(null);
  navigate("/app");
});

append(appHeader, logo, statusChip, themeToggleBtn, newCourseBtn);

const screenOutlet = el("main", { cls: "screen-outlet", attrs: { id: "screen-container", style: "flex:1;display:flex;flex-direction:column;min-height:0;" } });

empty(appContainer);
append(appContainer, appHeader, screenOutlet);

// Router Handler
onRoute((route) => {
  empty(screenOutlet);

  // Show header on screens 2-5, hide on landing and dashboard (which has its own header)
  if (route === "/" || route === "" || route === "/dashboard") {
    appHeader.style.display = "none";
    if (route === "/dashboard") {
      renderDashboard(screenOutlet);
    } else {
      renderLanding(screenOutlet);
    }
  } else {
    appHeader.style.display = "flex";
    switch (route) {
      case "/app":
        renderApp(screenOutlet);
        break;
      case "/teacher":
        renderTeacher(screenOutlet);
        break;
      case "/path":
        renderPath(screenOutlet);
        break;
      case "/final":
        renderFinal(screenOutlet);
        break;
      default:
        renderApp(screenOutlet);
        break;
    }
  }

  // Scroll to top on screen change
  window.scrollTo(0, 0);
});

// Start router (single call, after all DOM setup and route handler registration)
initRouter();
