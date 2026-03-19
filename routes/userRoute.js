/**
 * =============================================================================
 * ROUTES/USERROUTE.JS - User API Route Definitions
 * =============================================================================
 * 
 * PURPOSE:
 * This file defines the API routes for user authentication operations and
 * connects them to their controller handlers. It also includes input
 * validation rules using express-validator.
 * 
 * =============================================================================
 * ARCHITECTURE:
 * =============================================================================
 * 
 * This router follows the "Smart routes, dumb controllers" pattern:
 * 
 * 1. ROUTES define WHAT endpoints exist and WHAT validations apply
 * 2. CONTROLLERS define HOW requests are processed
 * 3. MIDDLEWARE (like authorizeJwt) provides reusable auth logic
 * 
 * This separation makes the code:
 * - Testable: Each piece can be unit tested independently
 * - Maintainable: Changes to logic don't require route changes
 * - Reusable: Middleware like authorizeJwt can protect multiple routes
 * 
 * =============================================================================
 * VALIDATION APPROACH:
 * =============================================================================
 * 
 * We use "declarative validation" with express-validator:
 * 
 * 1. Validation rules are defined as arrays of validator functions
 * 2. These run BEFORE the controller, automatically validating input
 * 3. If validation fails, the request never reaches the controller
 * 4. Errors are collected and passed to the controller via req object
 * 
 * WHY DECLARATIVE:
 * - Validation rules are visible in one place (the route)
 * - Easy to see what inputs are expected
 * - Self-documenting code
 * 
 * =============================================================================
 * ROUTE ORDER:
 * =============================================================================
 * 
 * IMPORTANT: Route order matters in Express!
 * 
 * More specific routes should come before general ones:
 * - /api/user/admin (GET) - Must come before /:id type routes
 * - /api/user/login (POST)
 * - /api/user/logout (POST)
 * - /api/user/register (POST)
 * 
 * If /register came before /admin, a GET /admin request might
 * incorrectly match a /register pattern.
 * 
 * =============================================================================
 */

import express from "express";
import { body } from "express-validator";
import { admin, login, logout, register } from "../controllers/user.js";
import { authorizeJwt } from "../middleware/auth.js";

const router = express.Router();

/**
 * =============================================================================
 * VALIDATION RULES
 * =============================================================================
 * 
 * These validation rules use express-validator to define constraints on
 * user input. Each rule chain:
 * 1. Specifies the field to validate (body parameter name)
 * 2. Chains validation methods (.isLength, .isEmail, etc.)
 * 3. Chains error messages (.withMessage)
 * 
 * WHY CHAIN VALIDATIONS:
 * Multiple validations can be applied to one field. For example,
 * username first trims whitespace, then checks length, then checks format.
 */

/**
 * =============================================================================
 * REGISTER VALIDATION RULES
 * =============================================================================
 * 
 * PURPOSE: Validate all fields required for user registration
 * 
 * FIELD VALIDATIONS:
 * 
 * username:
 *   - .trim(): Remove leading/trailing whitespace before validation
 *   - .isLength({ min: 3, max: 20 }): 3-20 characters
 *   - .matches(/^[a-zA-Z0-9_]+$/): Only letters, numbers, underscores
 * 
 *   WHY THESE CONSTRAINTS:
 *   - Min 3 chars: Prevents single/double character usernames
 *   - Max 20 chars: Ensures database storage efficiency
 *   - No special chars: Prevents injection attacks, UI issues
 *   - Underscores allowed: Common naming convention (john_doe)
 * 
 * email:
 *   - .isEmail(): Validates email format (user@domain.com)
 *   - Express-validator uses validator.js internally
 * 
 * password:
 *   - .isLength({ min: 8 }): Minimum 8 characters
 *   - WHY 8: NIST recommends minimum 8 characters
 *   - Note: More complex validation (special chars, etc.) done on frontend
 * 
 * firstname/lastname:
 *   - .trim(): Remove whitespace
 *   - .notEmpty(): Required field
 */
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("firstname")
    .trim()
    .notEmpty()
    .withMessage("First name required"),

  body("lastname")
    .trim()
    .notEmpty()
    .withMessage("Last name required"),
];

/**
 * =============================================================================
 * LOGIN VALIDATION RULES
 * =============================================================================
 * 
 * PURPOSE: Validate login form inputs
 * 
 * WHY MINIMAL VALIDATION:
 * - Email only needs format validation (isEmail)
 * - Password only needs presence check (notEmpty)
 * - More detailed password validation would leak info to attackers
 *   (knowing "password must have 8 chars" helps brute force)
 */
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password required"),
];

/**
 * =============================================================================
 * ROUTE DEFINITIONS
 * =============================================================================
 */

/**
 * GET /api/user/admin
 * 
 * PURPOSE: Protected endpoint to verify user authorization
 * 
 * SECURITY: This route is protected by authorizeJwt middleware, which:
 * 1. Extracts JWT from cookie or Authorization header
 * 2. Verifies the token is valid and not expired
 * 3. Attaches the user object to req.user
 * 4. Rejects unauthorized requests with 401
 * 
 * WHY PROTECTED: Only logged-in users should access admin content
 */
router.get("/admin", authorizeJwt, admin);

/**
 * POST /api/user/login
 * 
 * PURPOSE: Authenticate user and create session
 * 
 * SECURITY: loginValidation ensures:
 * - Email is valid format
 * - Password is provided (not empty)
 * 
 * WHY NOT MORE VALIDATION:
 * - Specific password requirements would help attackers
 * - Email existence check happens in controller (prevents enumeration)
 * 
 * FLOW:
 * 1. express-validator runs loginValidation
 * 2. If invalid, returns 422 before controller runs
 * 3. If valid, login controller processes request
 */
router.post("/login", loginValidation, login);

/**
 * POST /api/user/logout
 * 
 * PURPOSE: End user session
 * 
 * SECURITY: No input validation needed
 * - This endpoint only clears the cookie
 * - Cookie clearing works regardless of input
 * 
 * AUTH: Not required
 * - User might not be logged in when calling logout
 * - Clearing an already-cleared cookie is harmless
 */
router.post("/logout", logout);

/**
 * POST /api/user/register
 * 
 * PURPOSE: Create new user account
 * 
 * SECURITY: registerValidation ensures:
 * - Username is 3-20 chars, alphanumeric + underscore only
 * - Email is valid format
 * - Password is at least 8 characters
 * - First and last name are provided
 * 
 * WHY VALIDATE ON SERVER:
 * Client-side validation can be bypassed with curl/postman.
 * Server validation is the real security gate.
 */
router.post("/register", registerValidation, register);

export default router;
