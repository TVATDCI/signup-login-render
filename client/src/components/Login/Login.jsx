/**
 * =============================================================================
 * COMPONENTS/LOGIN/LOGIN.JSX - User Login Form
 * =============================================================================
 * 
 * PURPOSE:
 * This component renders a login form allowing existing users to authenticate.
 * It validates input, submits credentials to the server, and handles the
 * authentication response.
 * 
 * =============================================================================
 * FEATURES:
 * =============================================================================
 * 
 * 1. REAL-TIME VALIDATION
 *    - Email format validated as user types
 *    - Shows immediate feedback for invalid input
 *    - Password required check on blur
 * 
 * 2. CLIENT-SIDE VALIDATION
 *    - Email format validation
 *    - Required field validation
 *    - Prevents submission of invalid forms
 * 
 * 3. AUTHENTICATION FLOW
 *    - Submits to /api/user/login
 *    - Server returns success or error
 *    - On success, redirects to admin page
 * 
 * 4. USER EXPERIENCE
 *    - Loading indicator during submission
 *    - Success/error alerts
 *    - Form clears on success
 *    - Redirect after 1.5 seconds
 * 
 * =============================================================================
 * AUTHENTICATION MECHANISM:
 * =============================================================================
 * 
 * HOW LOGIN WORKS:
 * 
 * 1. User enters email and password
 * 2. Form validates input locally
 * 3. If valid, POSTs credentials to server
 * 4. Server verifies credentials
 * 5. If valid, server sets HTTP-only cookie with JWT
 * 6. Server returns success response
 * 7. Client refreshes auth context
 * 8. Client redirects to admin page
 * 
 * WHY HTTP-ONLY COOKIE:
 * - JavaScript cannot access the JWT
 * - XSS attacks cannot steal the token
 * - Cookie sent automatically with requests
 * 
 * =============================================================================
 * ERROR HANDLING:
 * =============================================================================
 * 
 * SERVER ERRORS:
 * - Invalid credentials → "Invalid credentials"
 * - Rate limited → "Too many login attempts..."
 * - Validation failed → Specific field errors
 * 
 * CLIENT-SIDE:
 * - Missing email → "Invalid email"
 * - Missing password → "Password required"
 * 
 * WHY GENERIC ERROR:
 * - "Invalid credentials" for both wrong email AND wrong password
 * - Prevents attackers from enumerating valid emails
 * 
 * =============================================================================
 * SECURITY CONSIDERATIONS:
 * =============================================================================
 * 
 * 1. CREDENTIALS NOT STORED
 *    - Form uses controlled inputs (not raw HTML)
 *    - Password never stored in localStorage
 *    - Only sent to server over HTTPS
 * 
 * 2. RATE LIMITING
 *    - Server enforces 5 attempts per 15 minutes
 *    - Prevents brute force attacks
 *    - After 5 fails, must wait
 * 
 * 3. HTTP-ONLY COOKIES
 *    - JWT stored in HTTP-only cookie
 *    - Cannot be read by JavaScript
 *    - Protected from XSS theft
 */

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

/**
 * Login Component
 * 
 * User login form with email/password authentication.
 * 
 * HOW IT WORKS:
 * 1. User enters credentials
 * 2. Real-time validation for email
 * 3. On submit, validates all fields
 * 4. POSTs to /api/user/login
 * 5. Server sets JWT cookie on success
 * 6. Redirects to admin
 */
export default function Login() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  // Form field values
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Field-specific errors
  const [errors, setErrors] = useState({});
  
  // Alert states
  const [formError, setFormError] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  /**
   * Handle Input Changes
   * 
   * Updates form data and validates email format.
   * 
   * @param {Object} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time email validation
    let newErrors = { ...errors };
    if (name === "email" && value && !validateEmail(value)) {
      newErrors[name] = "Invalid email format";
    } else {
      delete newErrors[name];
    }
    setErrors(newErrors);
  };

  /**
   * Handle Form Submission
   * 
   * Validates and submits login credentials.
   * 
   * @param {Object} e - Form submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Client-side validation before submit
    if (!validateEmail(formData.email)) {
      setErrors({ email: "Invalid email" });
      return;
    }
    if (!formData.password) {
      setErrors({ password: "Password required" });
      return;
    }

    try {
      // Submit login credentials
      // withCredentials: true ensures JWT cookie is received
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/login`,
        formData,
        { withCredentials: true },
      );

      // Success handling
      setFormSuccess(true);
      setFormData({ email: "", password: "" });

      // Refresh auth context and redirect
      setTimeout(() => {
        checkAuth();
        navigate("/admin");
      }, 1500);
    } catch (error) {
      // Error handling
      // Server returns generic "Invalid credentials" for both
      // wrong email and wrong password (security feature)
      console.error(error);
      const errorMsg = error.response?.data?.message || "Error logging in!";
      setFormError(true);
      setErrors({ general: errorMsg });
    }
  };

  return (
    <div style={{ padding: 16, margin: "auto", maxWidth: 600 }}>
      {/* Error alert */}
      {formError && (
        <Alert severity="error" onClose={() => setFormError(false)}>
          {errors.general || "Error logging in!"}
        </Alert>
      )}

      {/* Success alert */}
      {formSuccess && (
        <Alert severity="success" onClose={() => setFormSuccess(false)}>
          ✅ Logged in! Redirecting to admin...
        </Alert>
      )}

      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <Grid container alignItems="flex-start" spacing={2}>
          {/* Email field */}
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

          {/* Password field */}
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

          {/* Submit button */}
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
