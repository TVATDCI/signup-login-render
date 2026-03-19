/**
 * =============================================================================
 * HOOKS/USEAUTH.JS - Authentication Hook
 * =============================================================================
 * 
 * PURPOSE:
 * useAuth is a custom React hook that provides easy access to the authentication
 * context. It abstracts away the Context API complexity and provides a clean
 * interface for functional components.
 * 
 * =============================================================================
 * WHY A CUSTOM HOOK:
 * =============================================================================
 * 
 * WITHOUT useAuth:
 * ```javascript
 * import { useContext } from 'react';
 * import { AuthContext } from '../context/AuthContext';
 * 
 * function MyComponent() {
 *   const context = useContext(AuthContext);
 *   if (!context) {
 *     throw new Error('...');
 *   }
 *   const { isLoggedIn, loading } = context;
 *   // ...
 * }
 * ```
 * 
 * WITH useAuth:
 * ```javascript
 * import { useAuth } from '../hooks/useAuth';
 * 
 * function MyComponent() {
 *   const { isLoggedIn, loading } = useAuth();
 *   // ...
 * }
 * ```
 * 
 * BENEFITS:
 * 1. Cleaner component code
 * 2. Error handling in one place
 * 3. Easy to change context structure
 * 4. Self-documenting (hook name explains purpose)
 * 
 * =============================================================================
 * ERROR HANDLING:
 * =============================================================================
 * 
 * The hook throws an error if used outside AuthProvider.
 * This prevents subtle bugs from undefined auth state.
 * 
 * WHY THROW VS RETURN NULL:
 * - Throwing fails fast - bugs are obvious
 * - Returning null could cause silent failures
 * - Components would need null checks everywhere
 * 
 * ERROR MESSAGE:
 * "useAuth must be used within AuthProvider"
 * 
 * This tells developers exactly what's wrong.
 * 
 * =============================================================================
 * USAGE EXAMPLE:
 * =============================================================================
 * 
 * ```jsx
 * import { useAuth } from '../hooks/useAuth';
 * 
 * function NavBar() {
 *   const { isLoggedIn, loading, logout } = useAuth();
 * 
 *   if (loading) {
 *     return <Spinner />;
 *   }
 *
 *   return (
 *     <nav>
 *       {isLoggedIn ? (
 *         <button onClick={logout}>Logout</button>
 *       ) : (
 *         <>
 *           <Link to="/login">Login</Link>
 *           <Link to="/register">Register</Link>
 *         </>
 *       )}
 *     </nav>
 *   );
 * }
 * ```
 * 
 * =============================================================================
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth Hook
 * 
 * Access authentication state and functions from AuthContext.
 * Must be used within AuthProvider (usually in App.jsx).
 * 
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 * 
 * @example
 * // In a component:
 * const { isLoggedIn, user, loading, checkAuth, logout } = useAuth();
 */
export function useAuth() {
  // Access the context created by AuthContext.Provider
  const context = useContext(AuthContext);

  // Ensure hook is used within AuthProvider
  // This catches usage errors during development
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  // Return context value
  // Components can destructure what they need:
  // - isLoggedIn: boolean
  // - user: object or null
  // - loading: boolean
  // - checkAuth: function
  // - logout: function
  return context;
}
