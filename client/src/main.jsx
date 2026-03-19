/**
 * =============================================================================
 * MAIN.JSX - Application Entry Point
 * =============================================================================
 * 
 * PURPOSE:
 * This is the main entry point for the React frontend application.
 * It sets up React DOM, the root component, and wraps the application
 * with the AuthProvider for global authentication state.
 * 
 * =============================================================================
 * WHAT THIS FILE DOES:
 * =============================================================================
 * 
 * 1. IMPORTS
 *    - React and ReactDOM for UI rendering
 *    - App component (main application component)
 *    - AuthProvider (authentication state wrapper)
 *    - CSS styles
 * 
 * 2. RENDERS
 *    - Creates React root on #root DOM element
 *    - Wraps App in AuthProvider for auth state
 *    - Wraps in StrictMode for development checks
 * 
 * =============================================================================
 * WRAPPING WITH AUTHPROVIDER:
 * =============================================================================
 * 
 * WHY HERE AND NOT IN APP:
 * 
 * Option A: Wrap in main.jsx
 * - Auth state available to ALL components
 * - Includes components rendered by React Router
 * - Simplest setup
 * 
 * Option B: Wrap in App.jsx
 * - Same effect, just different file
 * - App.jsx could become cluttered
 * 
 * Option C: Wrap individual components
 * - Requires prop drilling
 * - Harder to maintain
 * 
 * CONCLUSION: main.jsx is the cleanest place because:
 * - It handles application bootstrapping
 * - All components automatically have access
 * - Follows React best practices
 * 
 * =============================================================================
 * REACT STRICT MODE:
 * =============================================================================
 * 
 * StrictMode is a development tool that:
 * - Highlights potential problems in application
 * - Double-invokes certain functions (effects, reducers)
 * - Detects deprecated API usage
 * - Does NOT run in production
 * 
 * WHY STRICT:
 * - Catches bugs early in development
 * - Ensures components are pure/reproducible
 * 
 * =============================================================================
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Import AuthProvider to wrap the application
import { AuthProvider } from "./context/AuthContext";

/**
 * Render the React Application
 * 
 * ReactDOM.createRoot creates a React root container.
 * render() renders the React element into the container.
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/*
      AuthProvider wraps the entire application.
      
      WHY WRAP HERE:
      - Auth state available to ALL components
      - No need to wrap individual components
      - Clean separation of concerns
      
      PROVIDER HIERARCHY:
      <AuthProvider>
        <App />  ← All children have access to auth state
      </AuthProvider>
    */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
