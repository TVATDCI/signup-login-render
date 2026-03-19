/**
 * =============================================================================
 * COMPONENTS/NAVBAR/NAVBAR.JSX - Navigation Bar
 * =============================================================================
 * 
 * PURPOSE:
 * This component renders the application's navigation bar. It displays
 * different buttons based on the user's authentication state, providing
 * a seamless experience for both logged-in and guest users.
 * 
 * =============================================================================
 * FEATURES:
 * =============================================================================
 * 
 * 1. CONDITIONAL RENDERING
 *    - Shows Login/Register buttons for guests
 *    - Shows Admin/Logout buttons for logged-in users
 *    - Smooth transition between states
 * 
 * 2. AUTHENTICATION INTEGRATION
 *    - Uses useAuth hook to access auth state
 *    - Updates immediately when auth state changes
 *    - Automatically reflects login/logout
 * 
 * 3. LOADING STATE
 *    - Shows spinner while checking auth
 *    - Prevents flash of wrong buttons
 *    - Better user experience
 * 
 * 4. NAVIGATION
 *    - Uses React Router for navigation
 *    - onClick handlers for smooth transitions
 *    - No page reloads
 * 
 * =============================================================================
 * AUTH STATE INTEGRATION:
 * =============================================================================
 * 
 * HOW IT WORKS:
 * 
 * 1. On render, useAuth() returns { isLoggedIn, loading }
 * 2. If loading: Show spinner (prevents wrong button flash)
 * 3. If logged in: Show Admin/Logout buttons
 * 4. If logged out: Show Login/Register buttons
 * 
 * WHY REACT ROUTER LINKS:
 * - Client-side navigation (no page reload)
 * - Preserves application state
 * - Smoother user experience
 * 
 * =============================================================================
 * WHY useNavigate INSTEAD OF href:
 * =============================================================================
 * 
 * <Button onClick={() => navigate("/login")}>
 *   Login
 * </Button>
 * 
 * vs
 * 
 * <Button href="/login">
 *   Login
 * </Button>
 * 
 * BENEFITS OF useNavigate:
 * - Client-side routing (no full page reload)
 * - Preserves React component state
 * - Smoother transitions
 * - Better perceived performance
 * 
 * =============================================================================
 * LOADING STATE:
 * =============================================================================
 * 
 * The loading spinner serves a crucial purpose:
 * 
 * Without loading state:
 * 1. User visits page
 * 2. NavBar renders with "Login/Register"
 * 3. Auth check completes
 * 4. NavBar re-renders with "Admin/Logout"
 * Result: Flash of wrong buttons
 * 
 * With loading state:
 * 1. User visits page
 * 2. NavBar renders with spinner
 * 3. Auth check completes
 * 4. NavBar renders correct buttons
 * Result: No flash
 */

import { useNavigate } from "react-router-dom";
import { AppBar, Box, Button, Toolbar, CircularProgress } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";

/**
 * NavBar Component
 * 
 * Application navigation bar with conditional auth buttons.
 * 
 * HOW IT WORKS:
 * 1. Access auth state via useAuth hook
 * 2. If checking auth, show loading spinner
 * 3. If logged in, show Admin and Logout
 * 4. If logged out, show Login and Register
 */
export default function NavBar() {
  const navigate = useNavigate();
  
  // Get auth state from context
  // isLoggedIn: boolean indicating auth status
  // loading: boolean indicating auth check in progress
  const { isLoggedIn, loading } = useAuth();

  // Show loading spinner while checking authentication
  // This prevents showing wrong buttons during initial load
  if (loading) {
    return (
      <AppBar position="absolute">
        <Toolbar>
          <CircularProgress color="inherit" size={24} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="absolute">
        <Toolbar sx={{ gap: 1 }}>
          {/* Spacer to push buttons to the right */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Conditional buttons based on auth state */}
          {isLoggedIn ? (
            // Logged in: Show Admin and Logout buttons
            <>
              <Button
                variant="contained"
                onClick={() => navigate("/admin")}
              >
                Admin
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/logout")}
              >
                Logout
              </Button>
            </>
          ) : (
            // Logged out: Show Login and Register buttons
            <>
              <Button
                variant="contained"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
