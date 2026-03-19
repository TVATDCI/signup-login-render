/**
 * =============================================================================
 * MIDDLEWARE/AUTH.JS - JWT Authentication Middleware
 * =============================================================================
 * 
 * PURPOSE:
 * This middleware protects routes that require authentication. It extracts
 * the JWT from cookies or Authorization headers, verifies it, and attaches
 * the user object to the request for use in route handlers.
 * 
 * =============================================================================
 * HOW MIDDLEWARE WORKS:
 * =============================================================================
 * 
 * In Express, middleware functions run before your route handler:
 * 
 * Request → [Auth Middleware] → [Route Handler] → Response
 *                    ↓
 *            Valid token? Continue
 *            Invalid? Return 401
 * 
 * WHY MIDDLEWARE:
 * - Reusable: Apply to any route that needs protection
 * - Separation of concerns: Auth logic separate from business logic
 * - Centralized: All auth logic in one place
 * 
 * =============================================================================
 * TOKEN EXTRACTION:
 * =============================================================================
 * 
 * We support TWO ways to send the JWT:
 * 
 * 1. HTTP-ONLY COOKIE (Primary)
 *    Cookie: jwt=eyJhbGciOiJIUzI1NiIs...
 *    WHY COOKIE: 
 *    - Secure: HTTP-only means JavaScript can't read it (XSS protection)
 *    - Automatic: Browser sends cookie with every request automatically
 *    - CSRF Protected: sameSite cookie attribute prevents CSRF
 * 
 * 2. AUTHORIZATION HEADER (Alternative)
 *    Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 *    WHY HEADER:
 *    - For API clients (curl, Postman, mobile apps)
 *    - For JavaScript clients that can't use cookies
 * 
 * =============================================================================
 * AUTHENTICATION FLOW:
 * =============================================================================
 * 
 * 1. REQUEST ARRIVES
 *    Middleware checks for token in cookie or header
 * 
 * 2. TOKEN EXTRACTION
 *    - Check Authorization header starting with "Bearer "
 *    - If not found, check cookies for "jwt"
 * 
 * 3. TOKEN VERIFICATION
 *    - Call verifyJwt() to check signature and expiration
 *    - If invalid, return 401 Unauthorized
 * 
 * 4. USER LOOKUP
 *    - Extract user ID from decoded token
 *    - Fetch user from database (excluding password hash)
 *    - If user not found, return 401 Unauthorized
 * 
 * 5. ATTACH USER
 *    - Attach sanitized user to req.user
 *    - Call next() to continue to route handler
 * 
 * =============================================================================
 * SECURITY CONSIDERATIONS:
 * =============================================================================
 * 
 * 1. WHY CHECK BOTH COOKIE AND HEADER:
 *    - Cookies for browser requests (our frontend)
 *    - Headers for API clients (external integrations)
 * 
 * 2. WHY FETCH USER AFTER VERIFY:
 *    - Token could be valid but user deleted
 *    - Token could be valid but user disabled
 *    - Always verify user still exists
 * 
 * 3. WHY EXCLUDE HASH FROM USER:
 *    - req.user is passed to route handlers
 *    - We don't want password hash in request object
 *    - Defense in depth: even if request is logged, hash is safe
 * 
 * 4. WHY LOG AUTHENTICATION:
 *    - Audit trail: who accessed protected resources
 *    - Debugging: track authentication issues
 *    - Security monitoring: spot unusual access patterns
 * 
 * =============================================================================
 */

import { verifyJwt } from "../libs/jwt.js";
import User from "../models/User.js";
import logger from "../libs/logger.js";

/**
 * JWT Authentication Middleware
 * 
 * Protects routes by verifying JWT token and attaching user to request.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function authorizeJwt(req, res, next) {
  let token;

  // Step 1: Extract token from cookie or Authorization header
  // 
  // Cookie method (primary):
  // Browser automatically sends cookies with same-origin requests
  // HTTP-only cookies cannot be accessed by JavaScript (XSS safe)
  //
  // Header method (alternative):
  // For API clients, mobile apps, or when cookies aren't available
  if (req.headers.authorization?.startsWith("Bearer")) {
    // Authorization: Bearer <token>
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    // Cookie: jwt=<token>
    token = req.cookies.jwt;
  }

  // Step 2: Reject if no token found
  // 
  // Why "Unauthorized" not "Not Found":
  // - We don't want to reveal if the resource exists
  // - "Unauthorized" means you need to authenticate first
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized to access this resource" });
  }

  try {
    // Step 3: Verify token signature and expiration
    //
    // What verifyJwt does:
    // 1. Checks token signature with JWT_SECRET
    // 2. Verifies token hasn't expired
    // 3. Returns decoded payload { id, email, username }
    //
    // What verifyJwt does NOT do:
    // - It doesn't check if user still exists
    // - It doesn't check if user is disabled
    const decoded = verifyJwt(token);

    // Step 4: Fetch user from database
    //
    // Why fetch user:
    // - Token is valid but user might be deleted
    // - Token is valid but user might be disabled
    // - We want the latest user data
    //
    // Why .select("-hash"):
    // - Excludes password hash from query result
    // - Prevents hash from being in request object
    // - Even if request is logged, hash is protected
    req.user = await User.findById(decoded.id).select("-hash");

    // Step 5: Handle user not found
    //
    // Why this check:
    // - User might have been deleted after token issued
    // - Database might be temporarily unavailable
    // - Token might be for a different database
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Step 6: Log successful authentication
    //
    // Why log:
    // - Audit trail for security monitoring
    // - Debugging authentication issues
    // - Track who accesses protected resources
    logger.info("✅ Authenticated user: " + req.user.username);

    // Step 7: Continue to route handler
    //
    // next() passes control to the next middleware or route handler
    // req.user is now available to all downstream handlers
    next();
  } catch (error) {
    // Token verification failed (invalid signature, expired, malformed)
    // Return 401 without revealing why (security best practice)
    res.status(401).json({ message: "Unauthorized" });
  }
}
