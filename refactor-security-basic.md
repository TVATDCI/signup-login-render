# Refactoring Plan: Basic Security Hardening + Frontend UX

**Project:** Signup-Login-Render (MERN Learning Project)  
**Scope:** Backend security + Frontend UX improvements  
**Approach:** Phased implementation, test as you go  
**Target:** Production-ready auth system showcasing best practices

---

## 📦 Dependencies Added

### Backend (Root)

```json
{
  "express-validator": "^7.0.0",
  "express-rate-limit": "^6.7.0",
  "helmet": "^7.0.0",
  "winston": "^3.8.2"
}
```

**Installation:** `npm install express-validator express-rate-limit helmet winston`

### Frontend (Client)

```json
{
  "zxcvbn": "^4.4.2" // Password strength estimator (optional but recommended)
}
```

**Installation (in `/client` folder):** `cd client && npm install zxcvbn`

---

## 🎯 High-Level Plan

| Phase       | Focus                       | Scope                                                                       | Status         |
| ----------- | --------------------------- | --------------------------------------------------------------------------- | -------------- |
| **Phase 1** | Backend Security Foundation | Env validation, HTTPS, input validation, rate limiting, email normalization | ✅ Completed |
| **Phase 2** | Logging & Error Handling    | Winston logger, sensitive data sanitization, security headers               | ✅ Completed |
| **Phase 3** | Frontend Auth Context       | AuthContext, useAuth hook, global auth state                                | ✅ Completed |
| **Phase 4** | Frontend UX Improvements    | Client validation, NavBar updates, redirects, error parsing                  | ✅ Completed |

---

# 🔴 PHASE 1: Backend Security Foundation (Critical)

**Status:** ✅ Completed

## 1.1 Environment Variable Validation

**File:** `server.js`  
**Status:** ✅ Completed

### Why Was This Added?

Environment variable validation prevents the application from starting with missing or incomplete configuration. This "fail-fast" approach catches configuration issues early during deployment rather than failing at runtime with confusing errors.

### What Was Changed:

Added `validateEnvironment()` function at the **TOP** of `server.js`, **BEFORE** any other code:

```javascript
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
```

### Impact:

- If JWT_SECRET, MONGO_URI, or NODE_ENV are missing, the server exits immediately with a clear error message
- Prevents runtime crashes from configuration issues
- Clear feedback for deployment problems

---

## 1.2 HTTPS Enforcement in Production

**File:** `controllers/user.js`  
**Status:** ✅ Completed

### Why Was This Added?

The cookie `secure` flag ensures that JWT tokens are only transmitted over HTTPS connections in production. This prevents man-in-the-middle attacks where tokens could be intercepted over unencrypted HTTP connections.

### What Was Changed:

Cookie settings now use `NODE_ENV` to determine security:

```javascript
const isProduction = process.env.NODE_ENV === "production";

res.cookie("jwt", token, {
  httpOnly: true,
  secure: isProduction, // true in production, false in dev
  sameSite: "lax",
});
```

### Updated .env file:

```
NODE_ENV=development  # (for local dev)
```

### Impact:

- Production (NODE_ENV=production): Cookies require HTTPS, fully secure
- Development: Cookies work over HTTP for local testing
- For Render deployment: Set `NODE_ENV=production` in Render environment variables

---

## 1.3 Input Validation (Email, Password, Username)

**Files:** `controllers/user.js`, `routes/userRoute.js`  
**Status:** ✅ Completed

### Why Was This Added?

Server-side input validation is **critical** because client-side validation can be bypassed. Users can disable JavaScript, modify requests, or use tools like curl to send raw HTTP requests directly to the server.

### What Was Changed:

#### Step 1: Setup validators in `routes/userRoute.js`

Added express-validator import and validation rules:

```javascript
import { body } from "express-validator";

const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("firstname").trim().notEmpty().withMessage("First name required"),
  body("lastname").trim().notEmpty().withMessage("Last name required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password required"),
];

// Routes include validators
router.post("/login", loginValidation, login);
router.post("/register", registerValidation, register);
```

#### Step 2: Handle validation in `controllers/user.js`

Added `handleValidationErrors` helper function:

```javascript
import { validationResult } from "express-validator";

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
```

### Validation Rules Explained:

| Field | Validation | Why |
|-------|------------|-----|
| username | 3-20 chars, letters/numbers/underscores | Prevents injection attacks, UI issues |
| email | Valid email format | Ensures deliverability |
| password | Minimum 8 characters | NIST recommendation |
| firstname/lastname | Required, trimmed | Data quality |

### Impact:

- Returns 422 status with specific error messages for invalid input
- Prevents bad data from reaching the database
- Structured error response allows frontend to display specific field errors

---

## 1.4 Rate Limiting

**File:** `server.js`  
**Status:** ✅ Completed

### Why Was This Added?

Rate limiting protects against brute-force attacks on login and registration endpoints. Without rate limiting, attackers could use automated tools to try millions of password combinations.

### What Was Changed:

Added rate limiters after imports:

```javascript
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per IP
  message: {
    message: "Too many registration attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

Applied to routes:

```javascript
app.use("/api/user/login", loginLimiter);
app.use("/api/user/register", registerLimiter);
app.use("/api/user", userRoute);
```

### Rate Limit Configuration Explained:

| Endpoint | Window | Max Requests | Rationale |
|----------|--------|--------------|-----------|
| Login | 15 minutes | 5 attempts | Allows 1-2 typos, blocks automated tools |
| Register | 60 minutes | 3 attempts | Legitimate users rarely need more |

### Impact:

- Blocks automated password guessing tools
- Prevents account enumeration via rapid registration
- After exceeding limit, returns 429 "Too Many Requests"

---

## 1.5 Email Normalization in Model

**File:** `models/User.js`  
**Status:** ✅ Completed

### Why Was This Added?

Email normalization ensures that `USER@EXAMPLE.COM` and `user@example.com` are treated as the same user. Without normalization, attackers could potentially register variations of existing emails.

### What Was Changed:

Added schema options and pre-save hook:

```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Automatically lowercase
    trim: true, // Remove whitespace
  },
  // ... other fields
});

userSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});
```

### Impact:

- All emails stored in lowercase
- Whitespace automatically removed
- Defense in depth: Controller AND model normalization
- Prevents case-sensitivity exploits

---

### ✅ PHASE 1 Verification

**Test locally:**

```bash
# 1. Test environment validation
# Remove JWT_SECRET or MONGO_URI from .env temporarily
npm start
# Expected: Error message about missing variable, process exits

# 2. Test input validation
# Try registering with invalid email
POST to /api/user/register with: { "email": "notanemail", "password": "abc" }
# Expected: 422 response with validation errors

# 3. Test rate limiting
# Send 6 login attempts rapidly to same endpoint
# Expected: 6th attempt returns 429 (Too Many Requests)

# 4. Test email normalization
# Register with: USER@EXAMPLE.COM
# Login with: user@example.com
# Expected: Login succeeds

# 5. Verify in dev mode cookie is not secure
NODE_ENV=development npm start
curl -i http://localhost:5000/api/user/admin
# Check: Cookie should NOT have "secure" flag
```

---

# 🟡 PHASE 2: Logging & Error Handling (High Priority)

**Status:** ✅ Completed

## 2.1 Winston Logger Setup

**File:** `libs/logger.js` (NEW FILE)  
**Status:** ✅ Completed

### Why Was This Created?

Winston provides structured logging with timestamps, multiple output formats, and file rotation capabilities. Unlike console.log, Winston offers log levels, persistent file storage, and production-ready features.

### What Was Created:

```javascript
import winston from "winston";

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

export default logger;
```

### Log Levels Explained:

| Level | Use Case |
|-------|----------|
| error | Database failures, security issues |
| warn | Deprecations, unusual patterns |
| info | User registrations, logins |
| debug | Detailed debugging (disabled in prod) |

### Impact:

- Timestamped logs for debugging
- Persistent file logs for auditing
- Separate error log for monitoring
- Configurable via LOG_LEVEL environment variable

---

## 2.2 Replace console.log with Logger

**Files:** `controllers/user.js`, `middleware/auth.js`, `libs/jwt.js`  
**Status:** ✅ Completed

### Why Was This Changed?

console.log has several problems in production:
- No timestamps
- No log levels
- No file persistence
- Hard to search/filter
- Cannot disable in production

### What Was Changed:

**In `controllers/user.js`:**

```javascript
import logger from "../libs/logger.js";

// Before: console.log("User registered successfully");
// After: logger.info("✅ User registered: " + username);
```

**In `middleware/auth.js`:**

```javascript
import logger from "../libs/logger.js";

// Before: console.log("🔐Authenticated user:", req.user.username);
// After: logger.info("✅ Authenticated user: " + req.user.username);
```

**In `libs/jwt.js`:**

```javascript
import logger from "./logger.js";

// Before: console.error("JWT verification failed:", error.message);
// After: logger.error("JWT verification failed: " + error.message);
```

### SECURITY NOTE:

**NEVER log:**
- `req.body` (contains passwords!)
- Full JWT tokens
- Password hashes
- User credentials

### Impact:

- All logs have timestamps
- Errors persist to files
- Log levels can be filtered
- Production-ready logging

---

## 2.3 Add Helmet Security Headers

**File:** `server.js`  
**Status:** ✅ Completed

### Why Was This Added?

Helmet automatically adds HTTP security headers that protect against common web vulnerabilities. These headers are critical for production security.

### What Was Changed:

```javascript
import helmet from "helmet";

// Added after app creation, BEFORE routes
app.use(helmet());
```

### Headers Added by Helmet:

| Header | Protection |
|--------|------------|
| Content-Security-Policy | Prevents XSS attacks |
| Strict-Transport-Security | Forces HTTPS connections |
| X-Frame-Options | Prevents clickjacking |
| X-Content-Type-Options | Prevents MIME sniffing |
| X-XSS-Protection | Legacy XSS filter |
| Referrer-Policy | Controls referrer info |

### Impact:

- All HTTP responses include security headers
- Automatic protection without manual configuration
- Defense against common web attacks

---

## 2.4 Remove Dead Code

**File:** `libs/jwt.js`  
**Status:** ✅ Completed

### Why Was This Changed?

Dead code (unreachable statements) indicates poor code quality and can cause confusion during debugging. The `return null` after `throw new Error()` could never execute.

### What Was Changed:

```javascript
// BEFORE (dead code):
export function verifyJwt(token) {
  try {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error("JWT verification failed: " + error.message);
    throw new Error("Invalid token");
    return null; // ← NEVER EXECUTES
  }
}

// AFTER (clean):
export function verifyJwt(token) {
  try {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error("JWT verification failed: " + error.message);
    throw new Error("Invalid token");
  }
}
```

### Impact:

- Cleaner, more maintainable code
- No confusion during debugging
- Follows best practices

---

### ✅ PHASE 2 Verification

```bash
# 1. Check logs are created
ls -la logs/
# Expected: error.log and combined.log files exist

# 2. Register a new user
# Expected: Log entries appear in logs/combined.log

# 3. Check security headers
curl -i http://localhost:5000/api/user/admin
# Expected: Look for headers like:
#   X-Content-Type-Options: nosniff
#   X-Frame-Options: DENY
#   Strict-Transport-Security: ...
```

---

# 🟢 PHASE 3: Frontend Auth Context (Foundation for UX)

**Status:** ✅ Completed

## 3.1 Create AuthContext

**File:** `client/src/context/AuthContext.jsx` (NEW FILE)  
**Status:** ✅ Completed

### Why Was This Created?

AuthContext provides a global state management solution for authentication. It allows any component in the application to access the current user's authentication status without prop drilling.

### What Was Created:

```javascript
import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/admin`,
        { withCredentials: true },
      );
      setIsLoggedIn(true);
      setUser({ authenticated: true });
    } catch (error) {
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loading,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### Why This Architecture:

| Without Context | With Context |
|-----------------|--------------|
| Pass props through every component | Access from anywhere |
| Prop drilling | Single source of truth |
| Hard to maintain | Clean, scalable |

### Authentication Flow:

1. **App Mounts** → AuthProvider renders → checkAuth() called
2. **Auth Check** → Makes request to /api/user/admin
3. **If Valid JWT** → Returns 200 → isLoggedIn = true
4. **If Invalid JWT** → Returns 401 → isLoggedIn = false

### Impact:

- Global auth state accessible from any component
- Automatic auth checking on app load
- Consistent state across entire app

---

## 3.2 Create useAuth Hook

**File:** `client/src/hooks/useAuth.js` (NEW FILE)  
**Status:** ✅ Completed

### Why Was This Created?

useAuth is a custom React hook that provides easy access to the authentication context. It abstracts away the Context API complexity and provides a clean, self-documenting interface.

### What Was Created:

```javascript
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

### Benefits Over Direct Context Usage:

```javascript
// WITHOUT useAuth:
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function MyComponent() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('...');
  const { isLoggedIn, loading } = context;
  // ...
}

// WITH useAuth:
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { isLoggedIn, loading } = useAuth();
  // ...
}
```

### Error Handling:

The hook throws an error if used outside AuthProvider. This fails fast and tells developers exactly what's wrong.

### Impact:

- Cleaner component code
- Error handling in one place
- Self-documenting hook name

---

## 3.3 Wrap App with AuthProvider

**File:** `client/src/main.jsx`  
**Status:** ✅ Completed

### Why Was This Changed?

AuthProvider must wrap the entire application so that all components have access to auth state. Wrapping in main.jsx (entry point) ensures proper initialization order.

### What Was Changed:

```javascript
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

### Why main.jsx and Not App.jsx:

| main.jsx | App.jsx |
|----------|---------|
| Application bootstrap | Main component |
| Initializes before anything | Renders children |
| Cleaner separation | Could become cluttered |

### Impact:

- All components automatically have access to auth state
- Auth check runs immediately on app load
- No need to wrap individual components

---

### ✅ PHASE 3 Verification

```bash
cd client

# 1. Check context and hook are created
ls -la src/context/
ls -la src/hooks/

# 2. Start dev server and open browser console
npm run dev
# Check: No errors about AuthContext or useAuth
```

---

# 🔵 PHASE 4: Frontend UX Improvements (Using Phase 3 + Validation)

**Status:** ✅ Completed

## 4.1 Create Validators Utility

**File:** `client/src/utils/validators.js` (NEW FILE)  
**Status:** ✅ Completed

### Why Was This Created?

Client-side validation provides immediate feedback to users before form submission. This improves UX by showing errors instantly without waiting for server round-trips.

### What Was Created:

```javascript
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return {
    isValid: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    length: password.length,
  };
};

export const validateUsername = (username) => {
  return {
    isValid:
      username.length >= 3 &&
      username.length <= 20 &&
      /^[a-zA-Z0-9_]+$/.test(username),
    message:
      "Username must be 3-20 characters, letters/numbers/underscores only",
  };
};

export const getPasswordStrength = (password) => {
  let strength = 0;
  const validation = validatePassword(password);

  if (validation.length >= 8) strength++;
  if (validation.length >= 12) strength++;
  if (validation.hasUpperCase) strength++;
  if (validation.hasNumbers) strength++;
  if (validation.hasSpecialChar) strength++;

  return strength; // 0-5
};
```

### IMPORTANT: Client vs Server Validation

| Client Validation | Server Validation |
|--------------------|-------------------|
| Better UX, instant feedback | Security, cannot be bypassed |
| Can be disabled/modified | Always runs |
| Reduces server load | Source of truth |

**Both are required for proper security AND good UX.**

### Impact:

- Instant error feedback while typing
- Password strength indicator
- Consistent validation rules

---

## 4.2 Update Register Component

**File:** `client/src/components/Register/Register.jsx`  
**Status:** ✅ Completed

### Why Was This Updated?

The Register component needed real-time validation, password strength feedback, automatic redirects on success, and integration with the new AuthContext.

### What Was Added:

1. **Real-time validation** - Validates as user types
2. **Password strength indicator** - Visual feedback with LinearProgress
3. **Success redirects** - Navigates to /admin after registration
4. **useAuth integration** - Refreshes auth context after registration
5. **Controlled inputs** - Uses state instead of FormData

### Key Features:

```javascript
// Real-time validation in handleInputChange
if (name === "password" && value) {
  setPasswordStrength(getPasswordStrength(value));
  if (!pValidation.isValid) {
    newErrors[name] = "Password must be at least 8 characters";
  }
}

// Success handling with redirect
setTimeout(() => {
  checkAuth();
  navigate("/admin");
}, 1500);
```

### Impact:

- Instant feedback on form errors
- Visual password strength meter
- Automatic redirect after success
- Better UX than before

---

## 4.3 Update Login Component

**File:** `client/src/components/Login/Login.jsx`  
**Status:** ✅ Completed

### Why Was This Updated?

The Login component needed real-time validation, automatic redirects on success, and integration with AuthContext.

### What Was Added:

1. **Real-time email validation** - Validates format as user types
2. **Success redirects** - Navigates to /admin after login
3. **useAuth integration** - Refreshes auth context after login
4. **Controlled inputs** - Uses state for better control

### Key Features:

```javascript
// Real-time email validation
if (name === "email" && value && !validateEmail(value)) {
  newErrors[name] = "Invalid email format";
}

// Success with redirect
setTimeout(() => {
  checkAuth();
  navigate("/admin");
}, 1500);
```

### Impact:

- Instant email format validation
- Automatic redirect after login
- Consistent with Register UX

---

## 4.4 Update NavBar Component

**File:** `client/src/components/NavBar/NavBar.jsx`  
**Status:** ✅ Completed

### Why Was This Updated?

The NavBar needed conditional rendering based on authentication state. Instead of always showing all buttons, it now shows different options for logged-in vs logged-out users.

### What Was Added:

1. **useAuth integration** - Access auth state from context
2. **Conditional rendering** - Different buttons for logged-in/out users
3. **Loading state** - Shows spinner during auth check
4. **React Router navigation** - onClick handlers instead of href

### Navigation Flow:

| State | Shows | Routes To |
|-------|-------|-----------|
| Logged In | Admin, Logout | /admin, /logout |
| Logged Out | Login, Register | /login, /register |
| Loading | Spinner | - |

### Impact:

- Dynamic buttons based on auth state
- Loading spinner prevents button flash
- Smooth navigation without page reloads

---

## 4.5 Update Logout Component

**File:** `client/src/components/Logout/Logout.jsx`  
**Status:** ✅ Completed

### Why Was This Updated?

The Logout component needed useAuth integration to properly clear auth state and ensure the NavBar updates correctly.

### What Was Added:

1. **useAuth integration** - Calls logout() to clear state
2. **Error handling** - Clears state even if server fails
3. **Proper cleanup** - useEffect for lifecycle management

### Logout Flow:

1. Component mounts → useEffect runs
2. POST to /api/user/logout (server clears cookie)
3. logout() from context (clears local state)
4. navigate("/") (redirects to home)
5. NavBar updates to show Login/Register

### Impact:

- Proper auth state cleanup
- Server + local state both cleared
- Smooth redirect after logout

---

## 4.6 Update Admin Component

**File:** `client/src/components/Admin/Admin.jsx`  
**Status:** ✅ Completed

### Why Was This Updated?

The Admin component needed proper access control with two-layer protection (client + server) and integration with AuthContext.

### What Was Added:

1. **Two-layer protection** - Client check + server verification
2. **useAuth integration** - Access auth state
3. **Loading states** - Spinners for auth check
4. **Proper redirects** - Navigate to /login if unauthorized

### Two-Layer Protection:

| Layer | What It Checks | Purpose |
|-------|----------------|---------|
| Client | isLoggedIn from context | Better UX, instant redirect |
| Server | /api/user/admin returns 200 | Security, cannot be bypassed |

### Why Double-Check:

- Token might have expired since last check
- User might have been deleted
- Session might have been invalidated

### Impact:

- Protected content only visible to authorized users
- Server-side authorization is authoritative
- Smooth UX with loading states

---

### ✅ PHASE 4 Verification

```bash
cd client

# 1. Test client validation
# Register page: Try password < 8 chars → error shown instantly
# Login page: Try invalid email → error shown
# Expected: Instant feedback, no API call

# 2. Test auth context
# Refresh page on /admin → should stay authenticated
# Expected: User remains logged in

# 3. Test NavBar conditional rendering
# Not logged in: See Login/Register buttons
# Logged in: See Admin/Logout buttons
# Expected: Buttons change based on auth state

# 4. Full flow test
# Register → Success → Redirect to /admin (after 1.5s)
# Change email, Login → Success → Redirect to /admin
# Click Logout → Redirect to home, NavBar shows Login/Register
# Expected: All flows work smoothly
```

---

# 📝 Implementation Checklist

## Backend Implementation

- [x] **1.1** Add env validation to `server.js`
- [x] **1.2** Update cookie secure flag in `controllers/user.js` and add to `.env`
- [x] **1.3** Install express-validator and add validators to `routes/userRoute.js` and `controllers/user.js`
- [x] **1.4** Install express-rate-limit and apply to `server.js`
- [x] **1.5** Add email normalization pre-save hook in `models/User.js`
- [x] **Phase 1 Test:** Register/Login locally, verify validation & rate limits
- [x] **2.1** Create `libs/logger.js` with Winston and create `logs/` folder
- [x] **2.2** Replace console.log with logger in `controllers/user.js`, `middleware/auth.js`, `libs/jwt.js`
- [x] **2.3** Install helmet and add to `server.js`
- [x] **2.4** Remove dead code in `libs/jwt.js`
- [x] **Phase 2 Test:** Check logs folder, verify security headers

## Frontend Implementation

- [x] **3.1** Create `client/src/context/AuthContext.jsx`
- [x] **3.2** Create `client/src/hooks/useAuth.js`
- [x] **3.3** Update `client/src/main.jsx` to wrap App with AuthProvider
- [x] **Phase 3 Test:** Verify context and hook are accessible
- [x] **4.1** Create `client/src/utils/validators.js`
- [x] **4.2** Update `client/src/components/Register/Register.jsx`
- [x] **4.3** Update `client/src/components/Login/Login.jsx`
- [x] **4.4** Update `client/src/components/NavBar/NavBar.jsx`
- [x] **4.5** Update `client/src/components/Logout/Logout.jsx`
- [x] **4.6** Update `client/src/components/Admin/Admin.jsx`
- [x] **Phase 4 Test:** Full registration/login/logout flow

---

# 🚀 Deployment Checklist

Before deploying to Render.com:

- [x] Add to Render environment variables:

  ```
  NODE_ENV=production
  JWT_SECRET=<generate-strong-random-string>
  MONGO_URI=<your-mongodb-uri>
  FRONTEND_URL=https://signup-login-render.onrender.com
  VITE_API_BASE_URL=https://signup-login-render.onrender.com
  LOG_LEVEL=warn
  ```

- [x] Create `.env.example` in root:

  ```
  NODE_ENV=development
  JWT_SECRET=your_secret_here_min_32_chars
  MONGO_URI=mongodb+srv://...
  FRONTEND_URL=http://localhost:5173
  LOG_LEVEL=info
  ```

- [ ] Test in production mode locally:
  ```bash
  NODE_ENV=production npm start
  cd client && npm run build
  ```

---

# 📚 Files Summary

## New Files Created

| File | Purpose | Why Created |
|------|---------|-------------|
| `libs/logger.js` | Winston logger configuration | Structured logging with timestamps and file output |
| `client/src/context/AuthContext.jsx` | Auth context provider | Global auth state management without prop drilling |
| `client/src/hooks/useAuth.js` | useAuth hook | Clean API for accessing auth context |
| `client/src/utils/validators.js` | Validation utilities | Client-side form validation for better UX |
| `.env.example` | Environment template | Documents required env vars for new developers |
| `logs/` folder | Log file storage | Created automatically by Winston |

## Files Modified

| File | Changes | Why Modified |
|------|---------|--------------|
| `server.js` | Env validation, Helmet, rate limiting | Security foundation |
| `controllers/user.js` | Input validation, email normalization, logging, HTTPS | Core security improvements |
| `models/User.js` | Email lowercase pre-save hook | Data consistency and security |
| `middleware/auth.js` | Logging updates | Better audit trail |
| `routes/userRoute.js` | Add validators & rate limiters | Declarative validation |
| `libs/jwt.js` | Remove dead code, update logging | Code quality |
| `.env` | Add `NODE_ENV=development` | Environment configuration |
| `client/src/main.jsx` | Wrap with AuthProvider | Global auth state |
| `client/src/components/Login/Login.jsx` | Validation, redirect, useAuth | Better UX |
| `client/src/components/Register/Register.jsx` | Validation, strength, redirect, useAuth | Better UX |
| `client/src/components/NavBar/NavBar.jsx` | Conditional rendering based on auth state | Dynamic navigation |
| `client/src/components/Admin/Admin.jsx` | useAuth hook, proper redirects | Protected routes |
| `client/src/components/Logout/Logout.jsx` | useAuth hook integration | Proper cleanup |

---

# 🎓 Learning Outcomes

After completing this refactor you'll understand:

✅ **Backend security best practices** (input validation, rate limiting, HTTPS, logging)  
✅ **Frontend-backend security patterns** (client validation vs server-side validation)  
✅ **React Context API** for state management  
✅ **HTTP-only cookies and JWT authentication** flow  
✅ **Input sanitization** and comprehensive error handling  
✅ **Production deployment** considerations (environment variables, HTTPS, logging levels)  
✅ **Full-stack security principles** for MERN applications

---

# 🛡️ Security Features Implemented

| Feature | Location | Protection Against |
|---------|----------|-------------------|
| Environment Validation | server.js | Missing config crashes |
| Helmet Headers | server.js | XSS, clickjacking, MIME sniffing |
| Rate Limiting | server.js | Brute force attacks |
| Input Validation | routes/userRoute.js | Malformed data, injection |
| Email Normalization | models/User.js | Case-sensitivity exploits |
| HTTP-only Cookies | controllers/user.js | XSS token theft |
| Secure Cookies | controllers/user.js | MITM attacks (prod) |
| Password Hashing | controllers/user.js | Database compromise |
| Generic Errors | controllers/user.js | Email enumeration |
| Winston Logging | libs/logger.js | Audit trail, debugging |

---

# 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  main.jsx                                                       │
│    └── AuthProvider                                             │
│          └── App.jsx                                            │
│                ├── NavBar.jsx (conditional buttons)             │
│                ├── Login.jsx (form + validation)                │
│                ├── Register.jsx (form + validation)              │
│                ├── Logout.jsx (cleanup)                         │
│                └── Admin.jsx (protected, server verify)         │
│                                                                  │
│  AuthContext.jsx (global state)                                 │
│    └── useAuth.js (hook)                                        │
│                                                                  │
│  utils/validators.js (client validation)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP + JWT Cookie
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express)                        │
├─────────────────────────────────────────────────────────────────┤
│  server.js                                                      │
│    ├── helmet() → Security headers                              │
│    ├── Rate limiters → Brute force protection                   │
│    ├── validateEnvironment() → Fail-fast config                 │
│    └── Routes                                                    │
│          └── /api/user/                                         │
│                ├── POST /login (rate limited)                   │
│                ├── POST /register (rate limited)                │
│                ├── POST /logout                                 │
│                └── GET /admin (JWT required)                    │
│                                                                  │
│  middleware/auth.js                                             │
│    └── authorizeJwt → Extract & verify JWT                      │
│                                                                  │
│  controllers/user.js                                            │
│    ├── register → Validate, hash, save                          │
│    ├── login → Validate, compare, issue JWT                      │
│    └── logout → Clear cookie                                    │
│                                                                  │
│  libs/                                                          │
│    ├── logger.js → Winston logging                              │
│    └── jwt.js → Issue & verify tokens                           │
│                                                                  │
│  models/User.js                                                 │
│    └── Pre-save hook → Email normalization                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MongoDB
                              ▼
                    ┌─────────────────────┐
                    │      MongoDB        │
                    │  (users collection) │
                    └─────────────────────┘
```

---

**Last Updated:** 2026-03-19  
**Status:** ✅ All Phases Completed
