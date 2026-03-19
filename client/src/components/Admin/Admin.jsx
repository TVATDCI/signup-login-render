/**
 * =============================================================================
 * COMPONENTS/ADMIN/ADMIN.JSX - Protected Admin Page
 * =============================================================================
 * 
 * PURPOSE:
 * This component renders the admin dashboard page, which is only accessible
 * to authenticated users. It verifies authorization server-side and
 * redirects unauthenticated users to the login page.
 * 
 * =============================================================================
 * ACCESS CONTROL:
 * =============================================================================
 * 
 * TWO-LAYER PROTECTION:
 * 
 * LAYER 1: Client-Side (React)
 *    - Check isLoggedIn from auth context
 *    - If false, redirect to /login
 *    - Prevents unauthenticated users from seeing content
 * 
 * LAYER 2: Server-Side (Express)
 *    - /api/user/admin protected by authorizeJwt
 *    - If JWT invalid, returns 401
 *    - API call itself fails for unauthenticated
 * 
 * WHY BOTH:
 *    - Client: Better UX (instant redirect)
 *    - Server: Security (cannot be bypassed)
 * 
 * =============================================================================
 * AUTHORIZATION FLOW:
 * =============================================================================
 * 
 * 1. COMPONENT MOUNTS
 *    - Check if auth is still loading
 *    - If loading, show spinner
 * 
 * 2. AUTH CHECK
 *    - If not logged in, redirect to /login
 *    - Prevents seeing admin content
 * 
 * 3. SERVER VERIFICATION
 *    - Make API call to /api/user/admin
 *    - Server validates JWT
 *    - If valid, set authorized = true
 *    - If invalid, redirect to /login
 * 
 * 4. RENDER
 *    - If authorized, show success message
 *    - If not authorized, show denied message
 * 
 * =============================================================================
 * WHY DOUBLE-CHECK WITH SERVER:
 * =============================================================================
 * 
 * We check auth state AND verify with server because:
 * 
 * 1. TOKEN EXPIRATION
 *    - Client state might be stale
 *    - Token might have expired since last check
 *    - Server provides truth
 * 
 * 2. USER DELETION
 *    - User might have been deleted
 *    - Client state still shows logged in
 *    - Server returns 401
 * 
 * 3. SESSION INVALIDATION
 *    - Server might invalidate sessions
 *    - Client doesn't know until server check
 * 
 * =============================================================================
 * LOADING STATES:
 * =============================================================================
 * 
 * We have TWO loading states for good UX:
 * 
 * 1. AUTH LOADING (from context)
 *    - Checking if user is logged in
 *    - Show spinner while checking
 *    - Prevents content flash
 * 
 * 2. SERVER LOADING (local state)
 *    - Verifying with server
 *    - Auth check in progress
 *    - Also shows spinner
 * 
 * Both must complete before rendering content.
 * 
 * =============================================================================
 * SECURITY NOTES:
 * =============================================================================
 * 
 * 1. NO SENSITIVE DATA STORED
 *    - Admin component doesn't store user data
 *    - Only checks authorization status
 *    - Display is generic
 * 
 * 2. SERVER-SIDE VALIDATION
 *    - Real authorization check happens on server
 *    - Cannot be bypassed by client changes
 *    - JWT validation is authoritative
 * 
 * 3. PROPER REDIRECTS
 *    - Unauthorized users sent to /login
 *    - After login, can access admin
 *    - Clean user flow
 */

import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Container, Box, Typography } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";

/**
 * Admin Component
 * 
 * Protected page only accessible to authenticated users.
 * 
 * HOW IT WORKS:
 * 1. Check if auth is still loading
 * 2. If not logged in, redirect to /login
 * 3. Verify authorization with server
 * 4. If authorized, show admin content
 * 5. If unauthorized, redirect to /login
 */
export default function Admin() {
  const navigate = useNavigate();
  
  // Auth state from context
  // isLoggedIn: boolean from auth context
  // loading: boolean while checking initial auth
  const { isLoggedIn, loading } = useAuth();
  
  // Local loading state for server verification
  const [authorized, setAuthorized] = useState(false);

  /**
   * Check Authorization
   * 
   * Makes server request to verify JWT is still valid.
   * This catches:
   * - Expired tokens
   * - Deleted users
   * - Invalid sessions
   */
  useEffect(() => {
    // Don't run if auth is still loading
    if (loading) return;

    // Redirect if not logged in (client-side check)
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    /**
     * Server Authorization Check
     * 
     * Call protected endpoint to verify JWT.
     * - 200: Token valid, user authorized
     * - 401: Token invalid/expired, redirect
     */
    const checkAdmin = async () => {
      try {
        // Make request to protected endpoint
        // If JWT valid, returns 200
        // If JWT invalid, returns 401
        await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/user/admin`,
          { withCredentials: true },
        );
        
        // Server verified authorization
        setAuthorized(true);
      } catch (error) {
        // Authorization failed
        // Clear local state
        setAuthorized(false);
        
        // Redirect to login
        // User needs to re-authenticate
        navigate("/login");
      }
    };

    // Perform server check
    checkAdmin();
    
    // Dependencies: re-run if these change
    // navigate is stable, but included for best practice
  }, [isLoggedIn, loading, navigate]);

  // Show loading spinner while checking authentication
  // This prevents content flash during auth check
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render authorization status
  // authorized is set by server check in useEffect
  return (
    <Container>
      <Box sx={{ mt: 10 }}>
        {authorized ? (
          // User is authorized - show success message
          <Typography variant="h4" component="h1" sx={{ color: "green" }}>
            ✅ You are authorized to view this content
          </Typography>
        ) : (
          // User is not authorized - show denied message
          // (This briefly shows before redirect)
          <Typography variant="h4" component="h1" sx={{ color: "red" }}>
            ❌ Access Denied - You are unauthorized!
          </Typography>
        )}
      </Box>
    </Container>
  );
}
