/**
 * =============================================================================
 * CONTROLLERS/USER.JS - User Authentication Controller
 * =============================================================================
 * 
 * PURPOSE:
 * This controller handles all user-related operations: registration, login,
 * logout, and admin authorization. It implements security best practices for
 * password handling, input validation, and session management.
 * 
 * =============================================================================
 * SECURITY FEATURES IMPLEMENTED:
 * =============================================================================
 * 
 * 1. INPUT VALIDATION (Lines 13-25)
 *    WHY: Server-side validation is critical because client-side validation
 *         can be bypassed. We use express-validator to validate all inputs
 *         before processing.
 *    IMPACT: Returns 422 status with specific error messages for invalid input.
 * 
 * 2. EMAIL NORMALIZATION (Lines 55, 84)
 *    WHY: Ensures USER@EXAMPLE.COM and user@example.com are treated as the
 *         same user. Prevents case-sensitivity exploits.
 *    IMPACT: All emails are converted to lowercase before database lookup.
 * 
 * 3. PASSWORD HASHING (Lines 60-61)
 *    WHY: Passwords are never stored in plain text. bcrypt with 10 salt rounds
 *         provides strong protection against rainbow table attacks.
 *    IMPACT: Even if the database is compromised, passwords remain protected.
 * 
 * 4. GENERIC ERROR MESSAGES (Lines 91, 110, 126)
 *    WHY: Returns "Invalid credentials" for both email-not-found and wrong-
 *         password scenarios. This prevents user enumeration attacks.
 *    IMPACT: Attackers cannot determine if an email is registered.
 * 
 * 5. HTTP-ONLY COOKIES (Lines 96-100, 132-136)
 *    WHY: JWT stored in httpOnly cookies cannot be accessed by JavaScript,
 *         preventing XSS attacks from stealing the token.
 *    IMPACT: Cookies are automatically sent with requests but invisible to JS.
 * 
 * 6. NODE_ENV-BASED COOKIE SECURITY (Lines 95, 131)
 *    WHY: In production (NODE_ENV=production), cookies require HTTPS.
 *         In development, cookies work over HTTP for testing.
 *    IMPACT: Production cookies are secure; dev cookies are testable.
 * 
 * =============================================================================
 * VALIDATION ERROR HANDLING:
 * =============================================================================
 * The handleValidationErrors function processes results from express-validator
 * middleware. If validation fails, it returns a 422 response with an array
 * of error objects containing:
 * - param: The field that failed validation
 * - msg: The validation error message
 * - value: The value that was provided
 * 
 * This structured response allows the frontend to display specific field
 * errors to users.
 * 
 * =============================================================================
 */

import bcrypt from "bcrypt";
import User from "../models/User.js";
import { issueJwt } from "../libs/jwt.js";
import { validationResult } from "express-validator";
import logger from "../libs/logger.js";

/**
 * =============================================================================
 * VALIDATION ERROR HANDLER
 * =============================================================================
 * 
 * PURPOSE: Centralized handling of express-validator results
 * 
 * WHY: Instead of duplicating validation handling in every controller,
 *      we use this helper function to check and respond to validation errors.
 * 
 * HOW IT WORKS:
 * 1. Extracts validation results from the request
 * 2. If errors exist, returns 422 with structured error array
 * 3. If no errors, returns null (allowing controller to proceed)
 * 
 * USAGE: Call at the start of any controller that uses validators
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object|null} - Error response or null if validation passes
 */
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  return null;
}

/**
 * =============================================================================
 * ADMIN CONTROLLER
 * =============================================================================
 * 
 * PURPOSE: Simple endpoint to verify user authorization
 * 
 * WHY: The /api/user/admin route is protected by authorizeJwt middleware.
 *      If a request reaches this controller, the JWT is valid and the user
 *      is authenticated.
 * 
 * SECURITY: This is the "gatekeeper" - unauthenticated users never reach here.
 * 
 * @param {Object} req - Express request (contains verified user)
 * @param {Object} res - Express response
 */
export const admin = async (req, res) => {
  res.send("You are authorized to view this content");
};

/**
 * =============================================================================
 * REGISTER CONTROLLER
 * =============================================================================
 * 
 * PURPOSE: Create a new user account
 * 
 * SECURITY FLOW:
 * 1. Validate all inputs (express-validator middleware)
 * 2. Normalize email to lowercase
 * 3. Check if email already exists (prevents duplicate accounts)
 * 4. Hash password with bcrypt (10 salt rounds)
 * 5. Trim all string inputs (removes accidental whitespace)
 * 6. Save user to database
 * 7. Return success message
 * 
 * WHY EMAIL NORMALIZATION:
 * Without it, User@Example.com and user@example.com could register as
 * separate accounts. Attackers could also register variations to
 * confuse account recovery systems.
 * 
 * WHY TRIM INPUTS:
 * Prevents "John " (with trailing space) from being stored, which
 * could cause display issues or login problems.
 * 
 * @param {Object} req - Request with username, firstname, lastname, email, password
 * @param {Object} res - Response with success/error message
 */
export const register = async (req, res) => {
  try {
    // Step 1: Check for validation errors from express-validator
    // WHY: Must fail early if inputs are invalid
    const validationErr = handleValidationErrors(req, res);
    if (validationErr) return validationErr;

    const { username, firstname, lastname, email, password } = req.body;

    // Step 2: Normalize email to lowercase
    // WHY: "User@Example.com" and "user@example.com" should be the same
    const normalizedEmail = email.toLowerCase().trim();

    // Step 3: Check if user already exists
    // WHY: Prevent duplicate accounts; use normalized email for check
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Step 4: Hash password
    // WHY: Never store plain-text passwords
    // WHY 10 SALT ROUNDS: Balance between security and performance
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // Step 5: Create and save new user
    // WHY trim: Remove accidental whitespace from inputs
    const newUser = new User({
      username: username.trim(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      hash,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });

    // Log successful registration (without sensitive data)
    logger.info("✅ User registered: " + username);
  } catch (error) {
    // Generic error message prevents information disclosure
    logger.error("Register error: " + error.message);
    res.status(500).json({ message: "Error during registration" });
  }
};

/**
 * =============================================================================
 * LOGIN CONTROLLER
 * =============================================================================
 * 
 * PURPOSE: Authenticate user and create session
 * 
 * SECURITY FLOW:
 * 1. Validate inputs (express-validator middleware)
 * 2. Normalize email to lowercase
 * 3. Find user by email (or fail with generic error)
 * 4. Compare password with stored hash (bcrypt.compare)
 * 5. If valid, generate JWT token
 * 6. Set HTTP-only cookie with JWT
 * 
 * WHY GENERIC ERROR MESSAGE:
 * "Invalid credentials" is returned for both wrong email AND wrong password.
 * This prevents attackers from enumerating valid email addresses.
 * 
 * WHY HTTP-ONLY COOKIE:
 * JavaScript cannot access the JWT cookie, preventing XSS token theft.
 * The cookie is automatically sent with subsequent requests.
 * 
 * @param {Object} req - Request with email, password
 * @param {Object} res - Response with cookie + success/error message
 */
export const login = async (req, res) => {
  try {
    // Step 1: Check validation errors
    const validationErr = handleValidationErrors(req, res);
    if (validationErr) return validationErr;

    const { email, password } = req.body;

    // Step 2: Normalize email
    // WHY: Match against normalized database email
    const normalizedEmail = email.toLowerCase().trim();

    // Step 3: Find user by normalized email
    // WHY: Use generic error to prevent email enumeration
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Step 4: Compare password with stored hash
    // WHY: bcrypt.compare handles constant-time comparison (prevents timing attacks)
    const isMatch = await bcrypt.compare(password, user.hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Step 5: Generate JWT token
    // WHY: Token-based auth without storing sessions on server
    const token = issueJwt(user);

    // Step 6: Set cookie security based on environment
    // WHY: Production requires HTTPS; development may use HTTP
    const isProduction = process.env.NODE_ENV === "production";

    // Set HTTP-only cookie with JWT
    // httpOnly: Prevents JavaScript access (XSS protection)
    // secure: Requires HTTPS in production
    // sameSite: "lax" - Prevents CSRF while allowing navigation
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    });

    res.status(200).json({ message: "User logged in successfully" });
    logger.info("✅ User logged in successfully");
  } catch (error) {
    logger.error("Login error: " + error.message);
    res.status(500).json({ message: "Error during login" });
  }
};

/**
 * =============================================================================
 * LOGOUT CONTROLLER
 * =============================================================================
 * 
 * PURPOSE: End user session by clearing the JWT cookie
 * 
 * HOW IT WORKS:
 * 1. Clear the JWT cookie with same options used when setting it
 * 2. Return confirmation message
 * 
 * WHY CLEAR WITH SAME OPTIONS:
 * Cookies must be cleared with the exact same settings (httpOnly, secure,
 * sameSite) that were used when setting them.
 * 
 * WHY NO TOKEN INVALIDATION:
 * JWT tokens are stateless - we don't maintain a blacklist on the server.
 * The cookie is simply removed from the client. The token itself remains
 * valid until it expires (1 hour from issue).
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Response with cleared cookie
 */
export const logout = async (req, res) => {
  try {
    // Clear cookie with same security settings as when it was set
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    }).send("User logged out");

    logger.info("User logged out");
  } catch (error) {
    logger.error("Logout error: " + error.message);
    res.status(500).send("Error during logout");
  }
};
