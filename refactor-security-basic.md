# Refactoring Plan: Basic Security Hardening + Frontend UX

**Project:** Signup-Login-Render (MERN Learning Project)  
**Scope:** Backend security + Frontend UX improvements  
**Approach:** Phased implementation, test as you go  
**Target:** Production-ready auth system showcasing best practices

---

## 📦 Dependencies to Add

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
| **Phase 1** | Backend Security Foundation | Env validation, HTTPS, input validation, rate limiting, email normalization | ⬜ Not Started |
| **Phase 2** | Logging & Error Handling    | Winston logger, sensitive data sanitization, security headers               | ⬜ Not Started |
| **Phase 3** | Frontend Auth Context       | AuthContext, useAuth hook, global auth state                                | ⬜ Not Started |
| **Phase 4** | Frontend UX Improvements    | Client validation, NavBar updates, redirects, error parsing                 | ⬜ Not Started |

---

# 🔴 PHASE 1: Backend Security Foundation (Critical)

**Status:** ⬜ Not Started

## 1.1 Environment Variable Validation

**File:** `server.js`  
**Status:** ⬜ Not Started

**What:** Validate required env vars at startup before app initializes

**Changes:**
Add this function at the **TOP** of `server.js`, **BEFORE** any other code:

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

// CALL this immediately after dotenv.config()
validateEnvironment();
```

**Why:** Fails fast with clear error if .env incomplete. Prevents runtime crashes.

---

## 1.2 HTTPS Enforcement in Production

**File:** `controllers/user.js`  
**Status:** ⬜ Not Started

**What:** Update cookie `secure` flag based on NODE_ENV

**Changes in login controller:**

```javascript
const isProduction = process.env.NODE_ENV === "production";

res.cookie("jwt", token, {
  httpOnly: true,
  secure: isProduction, // true in production, false in dev
  sameSite: "lax",
});
```

**Changes in logout controller:**
Same cookie update as above.

**Update .env file:**

```
NODE_ENV=development  # (for local dev)
```

**For Render deployment:** Set `NODE_ENV=production` in Render environment variables

**Why:** Forces HTTPS-only cookies in production; allows dev testing over HTTP locally.

---

## 1.3 Input Validation (Email, Password, Username)

**Files:**

- `controllers/user.js` (new validators + apply to controllers)
- `routes/userRoute.js` (import validators + apply to routes)

**Status:** ⬜ Not Started

**What:** Validate input before processing queries

### Step 1: Install express-validator

```bash
npm install express-validator
```

### Step 2: Setup validators in `routes/userRoute.js`

Add validators at the **top** of file:

```javascript
import express from "express";
import { body } from "express-validator"; // ADD THIS IMPORT
import { admin, login, logout, register } from "../controllers/user.js";
import { authorizeJwt } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
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

// UPDATE routes to include validators
router.get("/admin", authorizeJwt, admin);
router.post("/login", loginValidation, login); // ADD validators
router.post("/logout", logout);
router.post("/register", registerValidation, register); // ADD validators

export default router;
```

### Step 3: Handle validation in `controllers/user.js`

Add at **top** of file:

```javascript
import { validationResult } from "express-validator";

// Helper function to check validation errors
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

**Update register controller:**

```javascript
export const register = async (req, res) => {
  try {
    // ADD: Check for validation errors
    const validationErr = handleValidationErrors(req, res);
    if (validationErr) return validationErr;

    const { username, firstname, lastname, email, password } = req.body;

    // ADD: Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists (use normalized email)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // Create and save the new user
    const newUser = new User({
      username: username.trim(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail, // Use normalized email
      hash,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
    console.log("✅ User registered:", username);
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Error during registration" });
  }
};
```

**Update login controller:**

```javascript
export const login = async (req, res) => {
  try {
    // ADD: Check for validation errors
    const validationErr = handleValidationErrors(req, res);
    if (validationErr) return validationErr;

    const { email, password } = req.body;

    // ADD: Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (use normalized email)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the password with the stored hash
    const isMatch = await bcrypt.compare(password, user.hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = issueJwt(user);

    // UPDATE: Use NODE_ENV to set secure flag
    const isProduction = process.env.NODE_ENV === "production";

    // Send the token as an httpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: isProduction, // true in production, false in dev
      sameSite: "lax",
    });

    res.status(200).json({ message: "User logged in successfully" });
    console.log("✅ User logged in successfully");
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Error during login" });
  }
};
```

**Why:** Prevents bad data from reaching database. Returns specific errors so frontend knows what's wrong.

---

## 1.4 Rate Limiting

**File:** `server.js`  
**Status:** ⬜ Not Started

**What:** Add rate limiting middleware to prevent brute force attacks

### Step 1: Install express-rate-limit

```bash
npm install express-rate-limit
```

### Step 2: Add to `server.js`

Add after imports, before creating app:

```javascript
import rateLimit from "express-rate-limit";

// Rate limiting configurations
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

### Step 3: Update route mounting in `server.js`

**Find this line:**

```javascript
app.use("/api/user", userRoute);
```

**Replace with:**

```javascript
// Apply rate limiters to specific endpoints
app.use("/api/user/login", loginLimiter);
app.use("/api/user/register", registerLimiter);
app.use("/api/user", userRoute);
```

**Why:** Blocks attackers from rapid-fire login/registration attempts.

---

## 1.5 Email Normalization in Model

**File:** `models/User.js`  
**Status:** ⬜ Not Started

**What:** Add pre-save hook to lowercase email automatically

**Replace entire User.js file with:**

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // ADD: Automatically lowercase
    trim: true, // ADD: Remove whitespace
  },
  hash: { type: String, required: true },
  registerDate: { type: Date, default: Date.now },
});

// ADD: Pre-save hook to ensure email is always lowercase
userSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

const User = mongoose.model("users", userSchema);

export default User;
```

**Why:** Ensures `USER@EXAMPLE.COM` and `user@example.com` are treated as same user.

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

**Status:** ⬜ Not Started

## 2.1 Winston Logger Setup

**File:** Create new file `libs/logger.js`  
**Status:** ⬜ Not Started

### Step 1: Install winston

```bash
npm install winston
```

### Step 2: Create logs directory

```bash
mkdir logs
```

### Step 3: Create `libs/logger.js`

```javascript
import winston from "winston";
import path from "path";

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
    // Console output (all levels in development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    // File output (only errors)
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // File output (all logs)
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

export default logger;
```

---

## 2.2 Replace console.log with Logger

**Files:** `controllers/user.js`, `middleware/auth.js`, `libs/jwt.js`  
**Status:** ⬜ Not Started

**What:** Import logger and replace all console.log/console.error calls

### In `controllers/user.js`:

Add import at **top**:

```javascript
import logger from "../libs/logger.js";
```

**Replace all console.log calls:**

**OLD:**

```javascript
console.log("User registered successfully");
console.log("User Logged out");
console.log("req.body"); // NEVER log this, has passwords!
```

**NEW:**

```javascript
logger.info("✅ User registered: " + username);
logger.info("User logged out");
// REMOVE console.log(req.body) completely
```

### In `middleware/auth.js`:

Add import at **top**:

```javascript
import logger from "../libs/logger.js";
```

**Replace:**

**OLD:**

```javascript
console.log("🔐Authenticated user:", req.user.username);
```

**NEW:**

```javascript
logger.info("✅ Authenticated user: " + req.user.username);
```

### In `libs/jwt.js`:

Add import at **top**:

```javascript
import logger from "./logger.js";
```

**Replace:**

**OLD:**

```javascript
console.error("JWT verification failed:", error.message);
```

**NEW:**

```javascript
logger.error("JWT verification failed: " + error.message);
```

---

## 2.3 Add Helmet Security Headers

**File:** `server.js`  
**Status:** ⬜ Not Started

### Step 1: Install helmet

```bash
npm install helmet
```

### Step 2: Add to `server.js`

Add import with other imports:

```javascript
import helmet from "helmet";
```

Add after app creation, **BEFORE all routes and middleware**:

```javascript
const app = express();

// ADD THIS - MUST come before routes
app.use(helmet());

// Then add cors, cookieParser, etc...
app.use(
  cors({
    // ... existing cors config
  }),
);
```

**Why:** Adds critical HTTP security headers automatically (CSP, HSTS, X-Frame-Options, etc).

---

## 2.4 Remove Dead Code

**File:** `libs/jwt.js`  
**Status:** ⬜ Not Started

**What:** Remove unreachable `return null` statement

**Find this function:**

```javascript
export function verifyJwt(token) {
  try {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error("JWT verification failed: " + error.message);
    throw new Error("Invalid token");
    return null; // ← REMOVE THIS LINE
  }
}
```

**Replace with:**

```javascript
export function verifyJwt(token) {
  try {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error("JWT verification failed: " + error.message);
    throw new Error("Invalid token");
  }
}
```

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

**Status:** ⬜ Not Started

## 3.1 Create AuthContext

**File:** Create new file `client/src/context/AuthContext.jsx`  
**Status:** ⬜ Not Started

```javascript
import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/admin`,
        { withCredentials: true },
      );
      // If '/admin' endpoint returns 200, user is authenticated
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

---

## 3.2 Create useAuth Hook

**File:** Create new file `client/src/hooks/useAuth.js`  
**Status:** ⬜ Not Started

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

---

## 3.3 Wrap App with AuthProvider

**File:** `client/src/main.jsx`  
**Status:** ⬜ Not Started

**Replace entire file with:**

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

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

# 3. Try to use useAuth in a component (you'll do this in Phase 4)
```

---

# 🔵 PHASE 4: Frontend UX Improvements (Using Phase 3 + Validation)

**Status:** ⬜ Not Started

## 4.1 Create Validators Utility

**File:** Create new file `client/src/utils/validators.js`  
**Status:** ⬜ Not Started

```javascript
// Simple email validation regex
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Password validation rules
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

// Username validation rules
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

// Password strength (0-5 scale)
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

---

## 4.2 Update Register Component

**File:** `client/src/components/Register/Register.jsx`  
**Status:** ⬜ Not Started

**Replace entire file with:**

```javascript
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  Input,
  InputLabel,
  LinearProgress,
} from "@mui/material";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  getPasswordStrength,
} from "../../utils/validators";
import { useAuth } from "../../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Real-time validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate individual fields
    let newErrors = { ...errors };

    if (name === "email" && value) {
      if (!validateEmail(value)) {
        newErrors[name] = "Invalid email format";
      } else {
        delete newErrors[name];
      }
    }

    if (name === "username" && value) {
      const uValidation = validateUsername(value);
      if (!uValidation.isValid) {
        newErrors[name] = uValidation.message;
      } else {
        delete newErrors[name];
      }
    }

    if (name === "password" && value) {
      const pValidation = validatePassword(value);
      setPasswordStrength(getPasswordStrength(value));
      if (!pValidation.isValid) {
        newErrors[name] = "Password must be at least 8 characters";
      } else {
        delete newErrors[name];
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate all fields before submission
    const newErrors = {};
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email";
    if (!validateUsername(formData.username).isValid)
      newErrors.username = "Invalid username";
    if (!validatePassword(formData.password).isValid)
      newErrors.password = "Password too weak";
    if (!formData.firstname.trim()) newErrors.firstname = "First name required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError(true);
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/register`,
        formData,
        { withCredentials: true },
      );

      setFormSuccess(true);
      setFormData({
        username: "",
        firstname: "",
        lastname: "",
        email: "",
        password: "",
      });

      // Refresh auth context
      setTimeout(() => {
        checkAuth();
        navigate("/admin");
      }, 1500);
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.message || "Error registering user";
      setFormError(true);
      setErrors({ general: errorMsg });
    }
  };

  const strengthColors = ["red", "orange", "yellow", "lightgreen", "green"];
  const strengthLabels = [
    "Very Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very Strong",
  ];

  return (
    <div style={{ padding: 16, margin: "auto", maxWidth: 600 }}>
      {formError && (
        <Alert severity="error" onClose={() => setFormError(false)}>
          {errors.general || "Error registering user!"}
        </Alert>
      )}
      {formSuccess && (
        <Alert severity="success" onClose={() => setFormSuccess(false)}>
          ✅ User registered! Redirecting to admin...
        </Alert>
      )}

      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <Grid container alignItems="flex-start" spacing={2} columns={[2]}>
          <Grid item xs={2}>
            <FormControl fullWidth error={!!errors.username}>
              <InputLabel htmlFor="username">Username</InputLabel>
              <Input
                name="username"
                id="username"
                required
                value={formData.username}
                onChange={handleInputChange}
              />
              {errors.username && (
                <FormHelperText>{errors.username}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={1}>
            <FormControl fullWidth>
              <InputLabel htmlFor="firstname">First Name</InputLabel>
              <Input
                name="firstname"
                id="firstname"
                required
                value={formData.firstname}
                onChange={handleInputChange}
              />
            </FormControl>
          </Grid>

          <Grid item xs={1}>
            <FormControl fullWidth>
              <InputLabel htmlFor="lastname">Last Name</InputLabel>
              <Input
                name="lastname"
                id="lastname"
                required
                value={formData.lastname}
                onChange={handleInputChange}
              />
            </FormControl>
          </Grid>

          <Grid item xs={2}>
            <FormControl fullWidth error={!!errors.email}>
              <InputLabel htmlFor="email">Email address</InputLabel>
              <Input
                name="email"
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email ? (
                <FormHelperText error>{errors.email}</FormHelperText>
              ) : (
                <FormHelperText>We'll never share your email.</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={2}>
            <FormControl fullWidth error={!!errors.password}>
              <InputLabel htmlFor="password">Password</InputLabel>
              <Input
                name="password"
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={handleInputChange}
              />
              {formData.password && (
                <>
                  <FormHelperText>
                    Strength: {strengthLabels[passwordStrength]}
                  </FormHelperText>
                  <LinearProgress
                    variant="determinate"
                    value={(passwordStrength + 1) * 20}
                    sx={{ mt: 1 }}
                  />
                </>
              )}
              {errors.password && (
                <FormHelperText error>{errors.password}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={2}>
            <Button type="submit" variant="contained" fullWidth>
              Register
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
```

---

## 4.3 Update Login Component

**File:** `client/src/components/Login/Login.jsx`  
**Status:** ⬜ Not Started

**Replace entire file with:**

```javascript
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  Input,
  InputLabel,
} from "@mui/material";
import { validateEmail } from "../../utils/validators";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let newErrors = { ...errors };
    if (name === "email" && value && !validateEmail(value)) {
      newErrors[name] = "Invalid email format";
    } else {
      delete newErrors[name];
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate before submission
    if (!validateEmail(formData.email)) {
      setErrors({ email: "Invalid email" });
      return;
    }
    if (!formData.password) {
      setErrors({ password: "Password required" });
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/login`,
        formData,
        { withCredentials: true },
      );

      setFormSuccess(true);
      setFormData({ email: "", password: "" });

      // Refresh auth context and redirect
      setTimeout(() => {
        checkAuth();
        navigate("/admin");
      }, 1500);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Error logging in!";
      setFormError(true);
      setErrors({ general: errorMsg });
    }
  };

  return (
    <div style={{ padding: 16, margin: "auto", maxWidth: 600 }}>
      {formError && (
        <Alert severity="error" onClose={() => setFormError(false)}>
          {errors.general || "Error logging in!"}
        </Alert>
      )}
      {formSuccess && (
        <Alert severity="success" onClose={() => setFormSuccess(false)}>
          ✅ Logged in! Redirecting to admin...
        </Alert>
      )}

      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <Grid container alignItems="flex-start" spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.email}>
              <InputLabel htmlFor="email">User Email</InputLabel>
              <Input
                name="email"
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <FormHelperText error>{errors.email}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.password}>
              <InputLabel htmlFor="password">Password</InputLabel>
              <Input
                name="password"
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={handleInputChange}
              />
              {errors.password && (
                <FormHelperText error>{errors.password}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth>
              Login
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
```

---

## 4.4 Update NavBar Component

**File:** `client/src/components/NavBar/NavBar.jsx`  
**Status:** ⬜ Not Started

**Replace entire file with:**

```javascript
import { useNavigate } from "react-router-dom";
import { AppBar, Box, Button, Toolbar, CircularProgress } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";

export default function NavBar() {
  const navigate = useNavigate();
  const { isLoggedIn, loading } = useAuth();

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
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push buttons to right */}
          {isLoggedIn ? (
            <>
              <Button variant="contained" onClick={() => navigate("/admin")}>
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
            <>
              <Button variant="contained" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button variant="contained" onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
```

---

## 4.5 Update Logout Component

**File:** `client/src/components/Logout/Logout.jsx`  
**Status:** ⬜ Not Started

**Replace entire file with:**

```javascript
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/user/logout`,
          {},
          { withCredentials: true },
        );
        logout(); // Clear auth context
        navigate("/"); // Redirect to home
      } catch (error) {
        console.error("Logout failed", error);
        logout(); // Clear auth anyway
        navigate("/");
      }
    };

    handleLogout();
  }, [navigate, logout]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Logging out...</h1>
    </div>
  );
}
```

---

## 4.6 Update Admin Component

**File:** `client/src/components/Admin/Admin.jsx`  
**Status:** ⬜ Not Started

**Replace entire file with:**

```javascript
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Container, Box, Typography } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";

export default function Admin() {
  const navigate = useNavigate();
  const { isLoggedIn, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // Double-check with server
    const checkAdmin = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user/admin`, {
          withCredentials: true,
        });
        setAuthorized(true);
      } catch (error) {
        setAuthorized(false);
        navigate("/login");
      }
    };

    checkAdmin();
  }, [isLoggedIn, loading, navigate]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 10 }}>
        {authorized ? (
          <Typography variant="h4" component="h1" sx={{ color: "green" }}>
            ✅ You are authorized to view this content
          </Typography>
        ) : (
          <Typography variant="h4" component="h1" sx={{ color: "red" }}>
            ❌ Access Denied - You are unauthorized!
          </Typography>
        )}
      </Box>
    </Container>
  );
}
```

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

- [ ] **1.1** Add env validation to `server.js`
- [ ] **1.2** Update cookie secure flag in `controllers/user.js` and add to `.env`
- [ ] **1.3** Install express-validator and add validators to `routes/userRoute.js` and `controllers/user.js`
- [ ] **1.4** Install express-rate-limit and apply to `server.js`
- [ ] **1.5** Add email normalization pre-save hook in `models/User.js`
- [ ] **Phase 1 Test:** Register/Login locally, verify validation & rate limits
- [ ] **2.1** Create `libs/logger.js` with Winston and create `logs/` folder
- [ ] **2.2** Replace console.log with logger in `controllers/user.js`, `middleware/auth.js`, `libs/jwt.js`
- [ ] **2.3** Install helmet and add to `server.js`
- [ ] **2.4** Remove dead code in `libs/jwt.js`
- [ ] **Phase 2 Test:** Check logs folder, verify security headers

## Frontend Implementation

- [ ] **3.1** Create `client/src/context/AuthContext.jsx`
- [ ] **3.2** Create `client/src/hooks/useAuth.js`
- [ ] **3.3** Update `client/src/main.jsx` to wrap App with AuthProvider
- [ ] **Phase 3 Test:** Verify context and hook are accessible
- [ ] **4.1** Create `client/src/utils/validators.js`
- [ ] **4.2** Update `client/src/components/Register/Register.jsx`
- [ ] **4.3** Update `client/src/components/Login/Login.jsx`
- [ ] **4.4** Update `client/src/components/NavBar/NavBar.jsx`
- [ ] **4.5** Update `client/src/components/Logout/Logout.jsx`
- [ ] **4.6** Update `client/src/components/Admin/Admin.jsx`
- [ ] **Phase 4 Test:** Full registration/login/logout flow

---

# 🚀 Deployment Checklist

Before deploying to Render.com:

- [ ] Add to Render environment variables:

  ```
  NODE_ENV=production
  JWT_SECRET=<generate-strong-random-string>
  MONGO_URI=<your-mongodb-uri>
  FRONTEND_URL=https://signup-login-render.onrender.com
  VITE_API_BASE_URL=https://signup-login-render.onrender.com
  LOG_LEVEL=warn
  ```

- [ ] Create `.env.example` in root:

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

## New Files to Create

- ✅ `libs/logger.js` — Winston logger configuration
- ✅ `client/src/context/AuthContext.jsx` — Auth context provider
- ✅ `client/src/hooks/useAuth.js` — useAuth hook
- ✅ `client/src/utils/validators.js` — Validation utilities
- ✅ `.env.example` (root) — Document required environment variables
- ✅ `logs/` folder — Created automatically by Winston

## Files to Modify

- ✅ `server.js` — Env validation, Helmet, rate limiting setup
- ✅ `package.json` — Add dependencies
- ✅ `controllers/user.js` — Input validation, email normalization, logging updates, HTTPS enforcement
- ✅ `models/User.js` — Email lowercase pre-save hook
- ✅ `middleware/auth.js` — Logging updates
- ✅ `routes/userRoute.js` — Add validators & rate limiters
- ✅ `libs/jwt.js` — Remove dead code, update logging
- ✅ `.env` — Add `NODE_ENV=development`
- ✅ `client/src/main.jsx` — Wrap with AuthProvider
- ✅ `client/src/components/Login/Login.jsx` — Validation, redirect, useAuth
- ✅ `client/src/components/Register/Register.jsx` — Validation, strength, redirect, useAuth
- ✅ `client/src/components/NavBar/NavBar.jsx` — Conditional rendering based on auth state
- ✅ `client/src/components/Admin/Admin.jsx` — useAuth hook, proper redirects
- ✅ `client/src/components/Logout/Logout.jsx` — useAuth hook integration

---

# 🎓 Learning Outcomes

After completing this refactor you'll understand:

✅ Backend security best practices (input validation, rate limiting, HTTPS, logging)  
✅ Frontend-backend security patterns (client validation vs server-side validation)  
✅ React Context API for state management  
✅ HTTP-only cookies and JWT authentication flow  
✅ Input sanitization and comprehensive error handling  
✅ Production deployment considerations (environment variables, HTTPS, logging levels)  
✅ Full-stack security principles for MERN applications

## Files to Modify

- ✅ `server.js` — Env validation, Helmet, rate limiting setup
- ✅ `package.json` — Add dependencies
- ✅ `controllers/user.js` — Input validation, email normalization, logging updates, HTTPS enforcement
- ✅ `models/User.js` — Email lowercase pre-save hook
- ✅ `middleware/auth.js` — Logging updates
- ✅ `routes/userRoute.js` — Add validators & rate limiters
- ✅ `libs/jwt.js` — Remove dead code, update logging
- ✅ `.env` — Add `NODE_ENV=development`
- ✅ `client/src/main.jsx` — Wrap with AuthProvider
- ✅ `client/src/components/Login/Login.jsx` — Validation, redirect, useAuth
- ✅ `client/src/components/Register/Register.jsx` — Validation, strength, redirect, useAuth
- ✅ `client/src/components/NavBar/NavBar.jsx` — Conditional rendering based on auth state
- ✅ `client/src/components/Admin/Admin.jsx` — useAuth hook, proper redirects
- ✅ `client/src/components/Logout/Logout.jsx` — useAuth hook integration

---

# 🎓 Learning Outcomes

After completing this refactor you'll understand:

✅ Backend security best practices (input validation, rate limiting, HTTPS, logging)  
✅ Frontend-backend security patterns (client validation vs server-side validation)  
✅ React Context API for state management  
✅ HTTP-only cookies and JWT authentication flow  
✅ Input sanitization and comprehensive error handling  
✅ Production deployment considerations (environment variables, HTTPS, logging levels)  
✅ Full-stack security principles for MERN applications

Perfect for a **MERN learning project recap** to showcase to employers! 🚀

---

**Last Updated:** 2026-03-19  
**Status:** Ready for Implementation
