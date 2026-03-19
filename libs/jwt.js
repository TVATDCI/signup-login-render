/**
 * =============================================================================
 * LIBS/JWT.JS - JWT Token Utilities
 * =============================================================================
 * 
 * PURPOSE:
 * This file contains utilities for issuing and verifying JSON Web Tokens (JWT).
 * JWTs are used for stateless authentication in this application.
 * 
 * =============================================================================
 * HOW JWT AUTHENTICATION WORKS:
 * =============================================================================
 * 
 * 1. USER LOGS IN
 *    - Server validates credentials
 *    - Server issues JWT with user info (id, email, username)
 *    - Server sends JWT to client via HTTP-only cookie
 * 
 * 2. CLIENT MAKES REQUEST
 *    - Browser automatically sends cookie with JWT
 *    - Server extracts JWT from cookie
 *    - Server verifies JWT signature with secret
 *    - If valid, server knows the user's identity
 * 
 * 3. SESSION ENDS
 *    - JWT expires after 1 hour (or user logs out)
 *    - Client deletes cookie
 *    - Subsequent requests fail authentication
 * 
 * =============================================================================
 * JWT STRUCTURE (HEADER.PAYLOAD.SIGNATURE):
 * =============================================================================
 * 
 * HEADER:
 * {
 *   "alg": "HS256",    // Algorithm used to sign
 *   "typ": "JWT"       // Token type
 * }
 * 
 * PAYLOAD (what we store):
 * {
 *   "id": "user_id",           // MongoDB user ID
 *   "email": "user@example.com", // User's email
 *   "username": "john_doe",     // User's username
 *   "iat": 1704067200,         // Issued at (Unix timestamp)
 *   "exp": 1704070800          // Expires at (1 hour from iat)
 * }
 * 
 * SIGNATURE:
 * HMACSHA256(
 *   base64UrlEncode(header) + "." + base64UrlEncode(payload),
 *   JWT_SECRET
 * )
 * 
 * =============================================================================
 * SECURITY CONSIDERATIONS:
 * =============================================================================
 * 
 * 1. TOKEN STORAGE (HTTP-ONLY COOKIES)
 *    WHY: Prevents XSS from stealing tokens
 *    HOW: JavaScript cannot read HTTP-only cookies
 * 
 * 2. SHORT EXPIRATION (1 HOUR)
 *    WHY: Limits damage if token is compromised
 *    TRADE-OFF: User must re-authenticate more often
 * 
 * 3. SECRET STORAGE (JWT_SECRET env var)
 *    WHY: Signature verification requires secret
 *    NEVER: Commit secrets to version control!
 * 
 * 4. PAYLOAD LIMITATION
 *    WHY: JWT is signed, not encrypted
 *    NEVER: Store sensitive data (passwords) in payload
 * 
 * =============================================================================
 * WHY NOT STORE MORE IN JWT:
 * =============================================================================
 * 
 * JWT payload is VISIBLE to anyone who has the token (base64 decode).
 * We only store public/non-sensitive information:
 * - User ID: Not secret (it's in URLs already)
 * - Email: User already knows their email
 * - Username: User already knows their username
 * 
 * We do NOT store:
 * - Password hash: Would be visible in token!
 * - User roles: Could be manipulated if visible
 * - Sensitive data: Never in token
 * 
 * =============================================================================
 */

import jsonwebtoken from "jsonwebtoken";
import logger from "./logger.js";

/**
 * =============================================================================
 * ISSUE JWT FUNCTION
 * =============================================================================
 * 
 * PURPOSE: Create a new JWT token for a user
 * 
 * WHEN USED: After successful login or registration
 * 
 * WHAT IT DOES:
 * 1. Creates payload with user info (id, email, username)
 * 2. Signs payload with JWT_SECRET
 * 3. Sets expiration to 1 hour
 * 4. Returns signed token string
 * 
 * @param {Object} user - Mongoose User document
 * @returns {string} Signed JWT token
 */
export function issueJwt(user) {
  const payload = {
    id: user._id,      // MongoDB ObjectId
    email: user.email, // User's email
    username: user.username, // User's username
  };

  // Sign token with secret and set expiration
  return jsonwebtoken.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h", // Token expires in 1 hour
  });
}

/**
 * =============================================================================
 * VERIFY JWT FUNCTION
 * =============================================================================
 * 
 * PURPOSE: Verify and decode a JWT token
 * 
 * WHEN USED: In auth middleware before protected routes
 * 
 * WHAT IT DOES:
 * 1. Attempts to verify token signature with JWT_SECRET
 * 2. If valid, returns decoded payload
 * 3. If invalid/expired, throws error (caught by middleware)
 * 
 * SECURITY FLOW:
 * 1. Middleware extracts token from cookie
 * 2. Middleware calls verifyJwt(token)
 * 3. If valid, gets user ID from decoded payload
 * 4. Middleware fetches user from database
 * 5. Middleware attaches user to request object
 * 
 * ERROR HANDLING:
 * - Expired token: "jwt expired"
 * - Invalid signature: "invalid signature"
 * - Malformed token: "jwt malformed"
 * 
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload if valid
 * @throws {Error} If token is invalid or expired
 */
export function verifyJwt(token) {
  try {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Log the error for debugging (without sensitive data)
    logger.error("JWT verification failed: " + error.message);
    
    // Throw error to be caught by middleware
    // WHY THROW: Middleware decides how to respond
    throw new Error("Invalid token");
  }
}
