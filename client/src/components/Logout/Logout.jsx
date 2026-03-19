/**
 * =============================================================================
 * COMPONENTS/LOGOUT/LOGOUT.JSX - User Logout Handler
 * =============================================================================
 * 
 * PURPOSE:
 * This component handles the user logout process. It makes a request to
 * the server to clear the JWT cookie and updates the authentication
 * state throughout the application.
 * 
 * =============================================================================
 * LOGOUT FLOW:
 * =============================================================================
 * 
 * 1. USER CLICKS LOGOUT
 *    - NavBar shows Logout button
 *    - Click navigates to /logout route
 *    - Logout component renders
 * 
 * 2. COMPONENT LOADS (useEffect)
 *    - Calls handleLogout() function
 *    - Makes POST to /api/user/logout
 *    - Server clears JWT cookie
 *    - Client clears auth state (logout from context)
 *    - Redirects to home page
 * 
 * 3. LOGOUT COMPLETE
 *    - User sees "Logging out..." message briefly
 *    - Redirected to home page
 *    - NavBar now shows Login/Register
 * 
 * =============================================================================
 * SECURITY CONSIDERATIONS:
 * =============================================================================
 * 
 * 1. HTTP-ONLY COOKIE CLEARING
 *    - Server clears the HTTP-only cookie
 *    - Client cannot clear HTTP-only cookies directly
 *    - Ensures proper security settings are used
 * 
 * 2. CLEANUP ON ERROR
 *    - Even if server request fails, clear local state
 *    - User shouldn't be stuck in logged-in state
 *    - Better user experience on network errors
 * 
 * 3. NO SENSITIVE DATA
 *    - Don't store user data after logout
 *    - Clear all authentication state
 *    - Ensure no data leaks
 * 
 * =============================================================================
 * WHY USE EFFECT:
 * =============================================================================
 * 
 * Logout happens in useEffect because:
 * 
 * 1. AVOID INFINITE LOOPS
 *    - Direct API call in component body
 *    - Would re-trigger on every render
 *    - useEffect runs once (with empty deps)
 * 
 * 2. CLEANUP LIFECYCLE
 *    - Component mounts → effect runs
 *    - Logout completes → user navigates away
 *    - Proper React lifecycle
 * 
 * 3. ERROR HANDLING
 *    - Can wrap in try/catch
 *    - Can handle network errors
 *    - Can show user feedback
 * 
 * =============================================================================
 * DEPENDENCIES:
 * =============================================================================
 * 
 * Dependencies: [navigate, logout]
 * 
 * WHY navigate:
 * - Needed to redirect after logout
 * - Not expected to change
 * 
 * WHY logout:
 * - Function from useAuth context
 * - Clears local auth state
 * - Should be stable reference (useCallback)
 * 
 * RISK OF STALE CLOSURES:
 * - Without in deps, might use old values
 * - With deps, might cause issues if logout changes
 * - logout is wrapped in useCallback, so stable
 */

import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Logout Component
 * 
 * Handles user logout process.
 * 
 * HOW IT WORKS:
 * 1. Component mounts
 * 2. useEffect triggers handleLogout
 * 3. POST to /api/user/logout
 * 4. Clear auth context state
 * 5. Redirect to home page
 */
export default function Logout() {
  const navigate = useNavigate();
  
  // Get logout function from auth context
  // Clears local auth state (isLoggedIn = false)
  const { logout } = useAuth();

  useEffect(() => {
    /**
     * Handle Logout
     * 
     * Performs the logout process:
     * 1. Call server to clear cookie
     * 2. Clear local auth state
     * 3. Redirect to home page
     */
    const handleLogout = async () => {
      try {
        // Call server to clear JWT cookie
        // withCredentials: true ensures cookie is sent/cleared
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/user/logout`,
          {},
          { withCredentials: true },
        );
        
        // Clear local auth state
        // Updates NavBar immediately
        logout();
        
        // Redirect to home page
        navigate("/");
      } catch (error) {
        // Even on error, clear local state
        // User shouldn't be stuck logged in
        console.error("Logout failed", error);
        logout();
        navigate("/");
      }
    };

    // Trigger logout on component mount
    handleLogout();
    
    // Dependencies: navigate and logout
    // Both are stable references (useNavigate, useCallback)
  }, [navigate, logout]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Logging out...</h1>
    </div>
  );
}
