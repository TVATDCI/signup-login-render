/**
 * =============================================================================
 * CONTEXT/AUTHCONTEXT.JSX - Authentication State Management
 * =============================================================================
 * 
 * PURPOSE:
 * AuthContext provides a global state management solution for authentication.
 * It allows any component in the application to access the current user's
 * authentication status without prop drilling.
 * 
 * =============================================================================
 * WHY REACT CONTEXT:
 * =============================================================================
 * 
 * PROBLEM WITHOUT CONTEXT:
 * - Authentication state needed in many places (NavBar, Login, Admin, etc.)
 * - Would need to pass props through every intermediate component
 * - Creates "prop drilling" - repetitive and hard to maintain
 * 
 * SOLUTION WITH CONTEXT:
 * - Global state accessible from anywhere
 * - No prop drilling needed
 * - Single source of truth for auth state
 * 
 * =============================================================================
 * AUTHENTICATION STATE:
 * =============================================================================
 * 
 * The context provides:
 * 
 * isLoggedIn: Boolean indicating if user is authenticated
 *   - true: User has valid JWT cookie
 *   - false: No valid JWT or session expired
 * 
 * user: Object with user information
 *   - { authenticated: true } when logged in
 *   - null when not logged in
 * 
 * loading: Boolean for async auth check
 *   - true: Checking authentication status
 *   - false: Auth check complete
 * 
 * checkAuth: Function to refresh auth state
 *   - Called on mount
 *   - Called after login/register
 *   - Called after logout
 * 
 * logout: Function to clear auth state
 *   - Clears isLoggedIn and user
 *   - Called by Logout component
 * 
 * =============================================================================
 * HOW AUTHENTICATION CHECKING WORKS:
 * =============================================================================
 * 
 * 1. APP MOUNTS
 *    - AuthProvider renders
 *    - checkAuth() is called in useEffect
 * 
 * 2. AUTH CHECK (checkAuth)
 *    - Makes request to /api/user/admin
 *    - /admin is protected by authorizeJwt middleware
 *    - If JWT valid → returns 200 → isLoggedIn = true
 *    - If JWT invalid/missing → returns 401 → isLoggedIn = false
 * 
 * 3. STATE UPDATES
 *    - useEffect triggers on isLoggedIn/loading change
 *    - Consumer components re-render with new state
 *    - Loading spinner shown during check
 * 
 * =============================================================================
 * WHY USE CALLBACK:
 * =============================================================================
 * 
 * checkAuth and logout are wrapped in useCallback to:
 * 1. Maintain referential equality across renders
 * 2. Prevent unnecessary re-renders in child components
 * 3. Allow safe use in useEffect dependencies
 * 
 * =============================================================================
 * SECURITY CONSIDERATIONS:
 * =============================================================================
 * 
 * 1. HTTP-ONLY COOKIES
 *    - JWT stored in HTTP-only cookie
 *    - Cannot be accessed by JavaScript
 *    - Protected against XSS attacks
 * 
 * 2. SERVER VALIDATION
 *    - Auth check happens on server
 *    - Client state derived from server response
 *    - Cannot be spoofed by client-side changes
 * 
 * 3. CREDENTIALS INCLUDED
 *    - withCredentials: true sends cookies with request
 *    - Required for cross-origin requests
 *    - Ensures JWT cookie is sent
 */

import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

/**
 * Create React Context for authentication state
 * 
 * createContext() returns:
 * - AuthContext.Provider: Wraps app to provide auth state
 * - AuthContext.Consumer: (useContext hook preferred)
 */
export const AuthContext = createContext();

/**
 * AuthProvider Component
 * 
 * Wraps the application to provide authentication state.
 * Must wrap any component that uses useAuth().
 * 
 * HOW IT WORKS:
 * 1. Maintains state: isLoggedIn, user, loading
 * 2. Checks auth on mount via API call
 * 3. Provides functions to update auth state
 * 
 * @param {Object} props - Component props including children
 */
export function AuthProvider({ children }) {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  // Loading state for async auth check
  // Shows loading spinner while checking authentication
  const [loading, setLoading] = useState(true);

  /**
   * Check Authentication Status
   * 
   * Makes request to protected /admin endpoint to verify
   * if user has valid JWT token.
   * 
   * HOW IT WORKS:
   * 1. Calls /api/user/admin with credentials (cookies)
   * 2. If successful (200): User is logged in
   * 3. If fails (401): User is not logged in
   * 
   * WHY THIS ENDPOINT:
   * - It's protected by authorizeJwt middleware
   * - Returns 200 if JWT valid, 401 if invalid
   * - Simpler than a dedicated /me endpoint
   * 
   * @returns {Promise<void>}
   */
  const checkAuth = useCallback(async () => {
    try {
      // Make request to protected endpoint
      // withCredentials: true ensures JWT cookie is sent
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/admin`,
        { withCredentials: true },
      );
      
      // Success means user is authenticated
      setIsLoggedIn(true);
      setUser({ authenticated: true });
    } catch (error) {
      // 401 or other error means not authenticated
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      // Always set loading to false when check completes
      setLoading(false);
    }
  }, []);

  /**
   * Check authentication on mount
   * 
   * useEffect runs after render, checking if user
   * has valid session from previous visit.
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Logout Handler
   * 
   * Clears local authentication state.
   * Actual server logout happens in Logout component.
   * 
   * WHY SEPARATE:
   * - Local state cleared immediately for responsive UI
   * - Server request happens in component (with error handling)
   * 
   * @returns {void}
   */
  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  /**
   * Context Value
   * 
   * Object passed to all consumers via AuthContext.Provider
   * Includes state and functions for managing auth.
   */
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,   // Boolean: is user authenticated
        user,         // Object: user data (or null)
        loading,      // Boolean: is checking auth
        checkAuth,    // Function: refresh auth state
        logout,       // Function: clear auth state
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
