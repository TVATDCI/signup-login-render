/**
 * =============================================================================
 * SERVER.JS - Main Application Entry Point
 * =============================================================================
 * 
 * PURPOSE:
 * This is the main entry point for the Express.js backend server. It configures
 * middleware, security headers, rate limiting, and routes for the authentication
 * system.
 * 
 * =============================================================================
 * SECURITY FEATURES IMPLEMENTED:
 * =============================================================================
 * 
 * 1. ENVIRONMENT VARIABLE VALIDATION (Line 15-31)
 *    WHY: Prevents the application from starting with missing or incomplete 
 *         environment configuration. This "fail-fast" approach catches config 
 *         issues early during deployment rather than failing at runtime.
 *    IMPACT: If JWT_SECRET, MONGO_URI, or NODE_ENV are missing, the server
 *            exits immediately with a clear error message.
 * 
 * 2. HELMET SECURITY HEADERS (Line 64)
 *    WHY: Helmet automatically adds HTTP security headers (CSP, HSTS, 
 *         X-Frame-Options, X-Content-Type-Options, etc.) to protect against
 *         common web vulnerabilities like XSS, clickjacking, and MIME sniffing.
 *    IMPACT: Every HTTP response includes security headers automatically.
 * 
 * 3. RATE LIMITING (Lines 46-62, 82-83)
 *    WHY: Prevents brute-force attacks and API abuse by limiting how many
 *         requests a single IP can make within a time window.
 *    IMPACT: 
 *         - Login: 5 attempts per 15 minutes per IP
 *         - Register: 3 attempts per 60 minutes per IP
 *    USAGE: If exceeded, returns 429 "Too Many Requests" status.
 * 
 * 4. CORS CONFIGURATION (Lines 66-77)
 *    WHY: Controls which origins can access the API, preventing unauthorized
 *         cross-origin requests while allowing our frontend to communicate.
 *    IMPACT: Only requests from allowed origins (localhost:5173 in dev,
 *            signup-login-render.onrender.com in prod) are accepted.
 * 
 * =============================================================================
 * MIDDLEWARE ORDER:
 * =============================================================================
 * The order of middleware is critical for security:
 * 
 * 1. helmet()        → Security headers FIRST (before any routes)
 * 2. cors()          → Cross-origin requests (after security headers)
 * 3. cookieParser()  → Parse JWT from cookies
 * 4. express.json()  → Parse JSON request bodies
 * 5. Rate limiters   → Applied to specific routes
 * 6. Routes          → API endpoints
 * 7. Static files    → Serve frontend build
 * 
 * =============================================================================
 * ENVIRONMENT CONFIGURATION:
 * =============================================================================
 * Required Environment Variables:
 * - JWT_SECRET: Secret key for signing JWT tokens (min 32 chars recommended)
 * - MONGO_URI: MongoDB connection string
 * - NODE_ENV: "development" or "production"
 * 
 * Optional Environment Variables:
 * - PORT: Server port (default: 5000)
 * - FRONTEND_URL: Frontend URL for CORS (default: http://localhost:5173)
 * - FRONTEND_URL_PROD: Production frontend URL
 * - LOG_LEVEL: Winston log level (default: "info")
 * 
 * =============================================================================
 */

import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoute from "./routes/userRoute.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

import connectToDB from "./libs/db.js";

/**
 * =============================================================================
 * 1. ENVIRONMENT VARIABLE VALIDATION
 * =============================================================================
 * 
 * This function validates that critical environment variables are set before
 * the application starts. It's called immediately after dotenv.config() loads
 * the .env file.
 * 
 * WHY: Prevents runtime crashes and provides clear error messages if configuration
 * is missing. This is especially important in production where logs may not be
 * monitored in real-time.
 * 
 * @returns {void} - Exits process if validation fails
 */
function validateEnvironment() {
  const required = ["JWT_SECRET", "MONGO_URI", "NODE_ENV"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  console.log(
    `✅ Environment validation passed. Running in ${process.env.NODE_ENV} mode.`,
  );
}

validateEnvironment();

await connectToDB();

const port = process.env.PORT || 5000;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientUrl = process.env.FRONTEND_URL;

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  process.env.FRONTEND_URL_PROD || "https://signup-login-render.onrender.com",
];

/**
 * =============================================================================
 * 2. RATE LIMITING CONFIGURATION
 * =============================================================================
 * 
 * Rate limiting protects against:
 * - Brute-force attacks on login/registration endpoints
 * - API abuse and DDoS attempts
 * - Credential stuffing attacks
 * 
 * loginLimiter: Limits failed login attempts to prevent password guessing
 * registerLimiter: Limits registration attempts to prevent spam accounts
 */

/**
 * Login rate limiter: 5 attempts per 15 minutes per IP
 * 
 * WHY 5 ATTEMPTS:
 * - Allows for 1-2 legitimate typos
 * - Prevents automated password guessing tools
 * - 15 minutes is enough for user to recover account or wait
 * 
 * @config {windowMs} - Time window in milliseconds (15 minutes)
 * @config {max} - Maximum requests per window
 * @config {standardHeaders} - Return rate limit info in headers
 * @config {legacyHeaders} - Disable deprecated X-RateLimit headers
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Registration rate limiter: 3 attempts per 60 minutes per IP
 * 
 * WHY 3 ATTEMPTS:
 * - Legitimate users rarely need more than 1-2 attempts
 * - Prevents automated account creation
 * - 1 hour is sufficient for testing/development
 * 
 * @config {windowMs} - Time window in milliseconds (60 minutes)
 * @config {max} - Maximum requests per window
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per IP
  message: {
    message: "Too many registration attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * =============================================================================
 * 3. HELMET SECURITY HEADERS
 * =============================================================================
 * 
 * Helmet is applied FIRST before any routes to ensure all responses are
 * protected. It adds the following security headers:
 * 
 * - Content-Security-Policy (CSP): Prevents XSS attacks
 * - Strict-Transport-Security (HSTS): Forces HTTPS connections
 * - X-Frame-Options: PREVENTS clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-XSS-Protection: Legacy XSS filter for older browsers
 * - Referrer-Policy: Controls referrer information
 * 
 * WHY FIRST: Ensures ALL routes and responses are protected
 */
app.use(helmet());

/**
 * =============================================================================
 * 4. CORS CONFIGURATION
 * =============================================================================
 * 
 * Cross-Origin Resource Sharing (CORS) controls which domains can access
 * our API. This is critical because:
 * - Prevents malicious websites from making API requests on behalf of users
 * - Allows our frontend to communicate with our backend
 * - Supports both development (localhost) and production origins
 * 
 * The origin function allows us to dynamically check origins against our
 * allowed list, including the request's own origin in the check.
 */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies to be sent cross-origin
  }),
);

app.use(cookieParser());
app.use(express.json());

/**
 * =============================================================================
 * 5. ROUTE MOUNTING WITH RATE LIMITING
 * =============================================================================
 * 
 * Rate limiters are applied BEFORE the routes they protect. This ensures
 * malicious requests are blocked before reaching the route handlers.
 * 
 * Order matters: More specific routes (login, register) come before
 * the general /api/user route.
 */
app.use("/api/user/login", loginLimiter);
app.use("/api/user/register", registerLimiter);
app.use("/api/user", userRoute);

// Serve frontend client/dist folder
app.use(express.static(path.join(__dirname, "client", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// Health check endpoint for monitoring/deployment
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`The server 🙈 is listening on port ${port}`);
  console.log(`Visit ${clientUrl} in your browser`);
});
