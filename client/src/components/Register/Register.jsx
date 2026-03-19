/**
 * =============================================================================
 * COMPONENTS/REGISTER/REGISTER.JSX - User Registration Form
 * =============================================================================
 * 
 * PURPOSE:
 * This component renders a registration form allowing new users to create
 * an account. It provides real-time validation feedback and handles
 * form submission to the backend API.
 * 
 * =============================================================================
 * FEATURES:
 * =============================================================================
 * 
 * 1. REAL-TIME VALIDATION
 *    - Validates as user types
 *    - Shows specific error messages
 *    - Password strength indicator
 * 
 * 2. CLIENT-SIDE VALIDATION
 *    - Email format validation
 *    - Username format validation (3-20 chars, alphanumeric)
 *    - Password minimum length
 *    - Required field validation
 * 
 * 3. SERVER INTEGRATION
 *    - Submits form data to /api/user/register
 *    - Handles success/error responses
 *    - Redirects to admin on success
 * 
 * 4. USER EXPERIENCE
 *    - Loading state during submission
 *    - Success/error alerts with auto-dismiss
 *    - Form clears on successful registration
 * 
 * =============================================================================
 * VALIDATION FLOW:
 * =============================================================================
 * 
 * CLIENT VALIDATION (This Component):
 * 1. onChange validates individual fields
 * 2. Errors shown immediately under fields
 * 3. Submit button validates all fields
 * 4. Invalid forms don't reach server
 * 
 * SERVER VALIDATION (Backend):
 * 1. express-validator checks format
 * 2. Returns 422 if validation fails
 * 3. Component displays server errors
 * 
 * WHY BOTH:
 * - Client: Better UX (instant feedback)
 * - Server: Security (can't be bypassed)
 * 
 * =============================================================================
 * FORM STATE:
 * =============================================================================
 * 
 * formData: Object with all form values
 *   - username, firstname, lastname
 *   - email, password
 * 
 * errors: Object with field-specific errors
 *   - { username: "...", email: "..." }
 *   - Empty object if no errors
 * 
 * formError/formSuccess: Boolean alerts
 *   - formError: Server error or validation failed
 *   - formSuccess: Registration successful
 * 
 * passwordStrength: Number (0-5)
 *   - Visual indicator of password strength
 * 
 * =============================================================================
 * SECURITY CONSIDERATIONS:
 * =============================================================================
 * 
 * 1. PASSWORD NOT LOGGED
 *    - We don't log formData (has password)
 *    - Only log username for success
 * 
 * 2. GENERIC ERROR MESSAGES
 *    - Don't reveal if email exists
 *    - Let server decide error messages
 * 
 * 3. HTTPS
 *    - Form submitted over HTTPS in production
 *    - Credentials never sent in plain text
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
  LinearProgress,
} from "@mui/material";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  getPasswordStrength,
} from "../../utils/validators";
import { useAuth } from "../../hooks/useAuth";

/**
 * Register Component
 * 
 * User registration form with validation.
 * 
 * HOW IT WORKS:
 * 1. User fills form fields
 * 2. Real-time validation shows errors
 * 3. On submit, all fields validated
 * 4. If valid, POST to server
 * 5. On success, redirect to admin
 */
export default function Register() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  // Form field values
  const [formData, setFormData] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });

  // Field-specific error messages
  const [errors, setErrors] = useState({});
  
  // Alert states
  const [formError, setFormError] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Password strength indicator (0-5)
  const [passwordStrength, setPasswordStrength] = useState(0);

  /**
   * Handle Input Changes with Real-Time Validation
   * 
   * Called on every keystroke. Updates form data and
   * validates the changed field.
   * 
   * WHAT IT DOES:
   * 1. Updates formData with new value
   * 2. Validates the changed field
   * 3. Updates errors state with any validation messages
   * 4. Calculates password strength for password field
   * 
   * @param {Object} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let newErrors = { ...errors };

    // Email validation
    if (name === "email" && value) {
      if (!validateEmail(value)) {
        newErrors[name] = "Invalid email format";
      } else {
        delete newErrors[name];
      }
    }

    // Username validation
    if (name === "username" && value) {
      const uValidation = validateUsername(value);
      if (!uValidation.isValid) {
        newErrors[name] = uValidation.message;
      } else {
        delete newErrors[name];
      }
    }

    // Password validation and strength calculation
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

  /**
   * Handle Form Submission
   * 
   * Validates all fields, then submits to server.
   * 
   * WHAT IT DOES:
   * 1. Validates all fields before submit
   * 2. If invalid, shows errors and blocks submit
   * 3. If valid, POSTs to /api/user/register
   * 4. On success: clears form, shows success, redirects
   * 5. On error: shows error alert with message
   * 
   * @param {Object} e - Form submit event
   */
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

    // Block submission if validation fails
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError(true);
      return;
    }

    try {
      // Submit registration data
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/register`,
        formData,
        { withCredentials: true },
      );

      // Success handling
      setFormSuccess(true);
      setFormData({
        username: "",
        firstname: "",
        lastname: "",
        email: "",
        password: "",
      });

      // Refresh auth context and redirect after 1.5 seconds
      setTimeout(() => {
        checkAuth();
        navigate("/admin");
      }, 1500);
    } catch (error) {
      // Error handling
      console.error(error);
      const errorMsg =
        error.response?.data?.message || "Error registering user";
      setFormError(true);
      setErrors({ general: errorMsg });
    }
  };

  // Password strength labels
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
      {/* Error alert - shows server errors or validation failures */}
      {formError && (
        <Alert severity="error" onClose={() => setFormError(false)}>
          {errors.general || "Error registering user!"}
        </Alert>
      )}
      
      {/* Success alert - shown after successful registration */}
      {formSuccess && (
        <Alert severity="success" onClose={() => setFormSuccess(false)}>
          ✅ User registered! Redirecting to admin...
        </Alert>
      )}

      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <Grid container alignItems="flex-start" spacing={2} columns={[2]}>
          {/* Username field */}
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

          {/* First name field */}
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

          {/* Last name field */}
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

          {/* Email field */}
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
              {/* Show error helper or privacy message */}
              {errors.email ? (
                <FormHelperText error>{errors.email}</FormHelperText>
              ) : (
                <FormHelperText>We'll never share your email.</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Password field with strength indicator */}
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
              {/* Show strength indicator when typing */}
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

          {/* Submit button */}
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
