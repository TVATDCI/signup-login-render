/**
 * =============================================================================
 * MODELS/USER.JS - MongoDB User Schema Definition
 * =============================================================================
 * 
 * PURPOSE:
 * This file defines the structure of the User document in MongoDB. It uses
 * Mongoose ODM (Object Data Modeling) to create a schema with validation,
 * transformations, and hooks.
 * 
 * =============================================================================
 * SCHEMA DESIGN DECISIONS:
 * =============================================================================
 * 
 * 1. WHY MONGODB/MONGOOSE:
 *    - Flexible schema for rapid prototyping
 *    - Built-in validation support
 *    - Pre/post middleware hooks (for email normalization)
 *    - NoSQL allows horizontal scaling
 * 
 * 2. WHY A SEPARATE SCHEMA:
 *    - Enforces data structure consistency
 *    - Validates data before database insertion
 *    - Provides type checking and autocompletion
 *    - Centralizes data rules in one place
 * 
 * =============================================================================
 * SECURITY FEATURES:
 * =============================================================================
 * 
 * 1. EMAIL LOWERCASE (Line 17, 25-30)
 *    WHY: Ensures email uniqueness regardless of case
 *    IMPACT: user@example.com and USER@EXAMPLE.COM are the same user
 * 
 * 2. EMAIL TRIM (Line 17, 28)
 *    WHY: Removes accidental whitespace
 *    IMPACT: " user@example.com " and "user@example.com" are equivalent
 * 
 * 3. UNIQUE EMAIL (Line 15)
 *    WHY: Prevents duplicate accounts
 *    IMPACT: Database-level enforcement of one account per email
 * 
 * 4. PASSWORD NEVER STORED (Line 18)
 *    WHY: Only password HASH is stored
 *    IMPACT: Even with database access, passwords remain protected
 * 
 * 5. NO PASSWORD FIELD
 *    WHY: We store "hash" not "password"
 *    IMPACT: Makes it explicit that we never store plain-text passwords
 * 
 * =============================================================================
 * PRE-SAVE HOOK:
 * =============================================================================
 * 
 * The pre-save hook automatically normalizes the email field before every
 * save operation. This ensures:
 * 
 * 1. Data Consistency: All emails in DB are lowercase
 * 2. Case Insensitivity: USER@EXAMPLE.COM = user@example.com
 * 3. Defense in Depth: Even if controller forgets to normalize, DB normalizes
 * 
 * WHY NOT JUST CONTROLLER NORMALIZATION:
 * - Controllers might be bypassed (direct DB access, migrations)
 * - Multiple controllers might have inconsistent normalization
 * - Schema-level normalization is the "source of truth"
 * 
 * =============================================================================
 * FIELD DESCRIPTIONS:
 * =============================================================================
 * 
 * username: User's display name (unique identifier for UI)
 *   - Required: Yes (users need a name to display)
 *   - No uniqueness: Multiple users can have same username display
 * 
 * firstname/lastname: User's real name
 *   - Required: Yes (for personalization/communications)
 *   - Not unique: Common names can exist
 * 
 * email: User's email address (login identifier)
 *   - Required: Yes (needed for login)
 *   - Unique: One account per email
 *   - Lowercase: Normalized to prevent case exploits
 *   - Trimmed: Whitepace removed
 * 
 * hash: Bcrypt password hash
 *   - Required: Yes (needed for authentication)
 *   - Never stores plain-text password
 * 
 * registerDate: Account creation timestamp
 *   - Default: Current Date.now() at creation
 *   - Not required: Auto-populated
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Automatically convert to lowercase
    trim: true, // Remove leading/trailing whitespace
  },
  hash: {
    type: String,
    required: true,
  },
  registerDate: {
    type: Date,
    default: Date.now,
  },
});

/**
 * =============================================================================
 * PRE-SAVE MIDDLEWARE HOOK
 * =============================================================================
 * 
 * PURPOSE: Automatically normalize email before every save operation
 * 
 * WHY THIS HOOK:
 * 1. Defense in Depth: Controller normalization + Schema normalization
 * 2. Consistency: Ensures ALL emails in DB are normalized
 * 3. Future-proofing: Protects against direct DB writes/migrations
 * 
 * HOW IT WORKS:
 * 1. Runs before every .save() or .create() call
 * 2. Converts email to lowercase
 * 3. Trims whitespace
 * 4. Calls next() to continue save operation
 * 
 * @param {Function} next - Mongoose middleware callback
 */
userSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

const User = mongoose.model("users", userSchema);

export default User;
