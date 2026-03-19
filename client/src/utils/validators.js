/**
 * =============================================================================
 * UTILS/VALIDATORS.JS - Client-Side Form Validation Utilities
 * =============================================================================
 * 
 * PURPOSE:
 * This file contains reusable validation functions for client-side form
 * validation. These provide immediate feedback to users before form submission.
 * 
 * =============================================================================
 * WHY CLIENT-SIDE VALIDATION:
 * =============================================================================
 * 
 * 1. BETTER USER EXPERIENCE
 *    - Instant feedback without server round-trip
 *    - Shows errors as user types
 *    - Reduces form submission errors
 * 
 * 2. REDUCES SERVER LOAD
 *    - Invalid forms don't reach server
 *    - Less bandwidth usage
 *    - Fewer database queries
 * 
 * 3. BETTER PERFORMANCE
 *    - No waiting for error response
 *    - Smoother interactions
 * 
 * =============================================================================
 * IMPORTANT: SERVER VALIDATION IS REQUIRED
 * =============================================================================
 * 
 * Client-side validation can ALWAYS be bypassed:
 * - Users can disable JavaScript
 * - Users can modify JavaScript
 * - Users can send raw HTTP requests
 * 
 * This is why we ALSO validate on the server (express-validator).
 * 
 * DEFENSE IN DEPTH:
 * - Client validation: Better UX, first line of defense
 * - Server validation: Security, the real gatekeeper
 * 
 * =============================================================================
 * VALIDATION STRATEGY:
 * =============================================================================
 * 
 * 1. REAL-TIME VALIDATION
 *    - Validate as user types (onChange)
 *    - Show errors immediately
 *    - Clear errors when input is valid
 * 
 * 2. SUBMISSION VALIDATION
 *    - Validate all fields before submit
 *    - Block submission if invalid
 *    - Focus first error field
 * 
 * =============================================================================
 */

import { useState } from "react";

/**
 * Validate Email Format
 * 
 * Checks if email matches basic email pattern:
 * - Has characters before @
 * - Has @ symbol
 * - Has characters after @
 * - Has dot and domain after @
 * 
 * WHY THIS REGEX:
 * - Simple but covers most cases
 * - Doesn't allow spaces
 * - Requires @ and domain
 * 
 * NOTE: This is for FORMAT validation only.
 * Server should verify email actually exists.
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 * 
 * @example
 * validateEmail("user@example.com") // true
 * validateEmail("invalid") // false
 * validateEmail("user@") // false
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate Password
 * 
 * Checks password against multiple criteria.
 * Returns object with detailed validation results.
 * 
 * CRITERIA:
 * - Minimum 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 * 
 * WHY RETURN OBJECT:
 * - Allows showing which criteria are met
 * - Can display password strength indicator
 * - More informative than boolean
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with individual checks
 * 
 * @example
 * validatePassword("Pass123!") 
 * // { isValid: true, hasUpperCase: true, hasLowerCase: true, ... }
 */
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

/**
 * Validate Username
 * 
 * Checks username against security rules:
 * - 3-20 characters long
 * - Letters, numbers, and underscores only
 * 
 * WHY THESE RULES:
 * - Min 3 chars: Prevents single/double character names
 * - Max 20 chars: Prevents abuse, ensures UI compatibility
 * - No special chars: Prevents injection attacks, UI issues
 * - Underscores: Common naming convention (john_doe)
 * 
 * @param {string} username - Username to validate
 * @returns {Object} - { isValid: boolean, message: string }
 * 
 * @example
 * validateUsername("john_doe") 
 * // { isValid: true, message: "Username must be 3-20 characters..." }
 */
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

/**
 * Calculate Password Strength
 * 
 * Computes a password strength score from 0-5.
 * Higher score = stronger password.
 * 
 * STRENGTH FACTORS:
 * 1. Base: Password is at least 8 characters (+1)
 * 2. Length bonus: Password is 12+ characters (+1)
 * 3. Uppercase: Has uppercase letter (+1)
 * 4. Numbers: Has numbers (+1)
 * 5. Special chars: Has special characters (+1)
 * 
 * STRENGTH LEVELS:
 * 0: Very Weak (just too short)
 * 1: Weak (only length)
 * 2: Fair (length + 1 other)
 * 3: Good (length + 2 others)
 * 4: Strong (length + 3 others)
 * 5: Very Strong (all criteria met)
 * 
 * @param {string} password - Password to check
 * @returns {number} - Strength score (0-5)
 * 
 * @example
 * getPasswordStrength("Pass") // 1 (only length)
 * getPasswordStrength("Password123!") // 5 (all criteria)
 */
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
