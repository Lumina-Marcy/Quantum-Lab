# Quantum Lab File Purpose Guide

This document explains the purpose of each scaffolded file and why it exists.

## Root files

- `README.md`
  - Purpose: Provides an overview of the project, how to run the frontend and backend, and the architecture.
  - Why: Helps developers and collaborators get started quickly with the project.

- `.env.example`
  - Purpose: Shows required environment variables for the backend.
  - Why: Provides a safe template for local configuration without exposing secrets.

## Frontend

- `frontend/package.json`
  - Purpose: Lists frontend dependencies and project scripts.
  - Why: Enables installation and execution of the React/Vite application.

- `frontend/vite.config.js`
  - Purpose: Configures Vite for the React application.
  - Why: Sets up the development server and build behavior.

- `frontend/postcss.config.js`
  - Purpose: Enables Tailwind CSS processing.
  - Why: Connects Tailwind CSS to the Vite build pipeline.

- `frontend/tailwind.config.js`
  - Purpose: Specifies Tailwind CSS content scanning and theme configuration.
  - Why: Ensures Tailwind generates only the styles actually used by the app.

- `frontend/index.html`
  - Purpose: The HTML entry point for the frontend app.
  - Why: Loads the React application in the browser.

- `frontend/src/main.jsx`
  - Purpose: Bootstraps the React app and renders the root component.
  - Why: Initializes the app and wraps it with router support.

- `frontend/src/App.jsx`
  - Purpose: Defines the top-level navigation and routes.
  - Why: Centralizes page routing for the interactive experience.

- `frontend/src/index.css`
  - Purpose: Imports Tailwind directives and sets base styles.
  - Why: Provides global styling and theme foundation.

- `frontend/src/components/SectionCard.jsx`
  - Purpose: Reusable card component for mission previews.
  - Why: Standardizes the UI for mission selection and sandbox cards.

- `frontend/src/pages/Home.jsx`
  - Purpose: Landing page with mission list and sandbox call to action.
  - Why: Gives users an entry point to choose their interactive experience.

- `frontend/src/pages/Mission.jsx`
  - Purpose: Mission detail page for a selected story.
  - Why: Displays mission narrative, decision flow, and mission structure.

- `frontend/src/pages/Sandbox.jsx`
  - Purpose: Sandbox simulation landing page.
  - Why: Presents the interactive simulation options and experimentation area.

- `frontend/src/pages/NotFound.jsx`
  - Purpose: 404 page shown when navigation fails.
  - Why: Provides a clear fallback for unknown routes.

## Backend

- `server/requirements.txt`
  - Purpose: Lists Python backend dependencies.
  - Why: Ensures reproducible environment installation.

- `server/app/main.py`
  - Purpose: Creates the FastAPI application and registers middleware and routers.
  - Why: Serves as the backend entry point for the API.

- `server/app/api/routers.py`
  - Purpose: Combines sub-routers into a single API router.
  - Why: Keeps endpoint registration organized and modular.

- `server/app/api/auth.py`
  - Purpose: Provides stubbed authentication endpoints.
  - Why: Defines the API contract for register, login, and logout flows.

- `server/app/api/missions.py`
  - Purpose: Provides mission list and mission detail endpoints.
  - Why: Serves frontend mission data and story metadata.

- `server/app/api/sandbox.py`
  - Purpose: Provides sandbox simulation option data.
  - Why: Supports the interactive sandbox experience with available modes.

- `server/app/api/resources.py`
  - Purpose: Returns learning resource content for the app.
  - Why: Supports the educational content section of the platform.

- `server/app/core/config.py`
  - Purpose: Loads and caches application configuration from `.env`.
  - Why: Centralizes environment configuration for the backend.

- `server/app/db/session.py`
  - Purpose: Creates the SQLAlchemy engine and session factory.
  - Why: Provides database connection management for API operations.

- `server/app/db/models.py`
  - Purpose: Defines the core database schema models.
  - Why: Maps the backend data model for users, missions, mission steps, choices, and sandbox runs.

- `server/app/__init__.py`
  - Purpose: Marks the `app` directory as a Python package.
  - Why: Allows module imports to work cleanly within the server application.

- `server/app/api/__init__.py`
  - Purpose: Exposes the API router from the `app.api` package.
  - Why: Simplifies import paths in `main.py`.
