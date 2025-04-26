import bcrypt from "bcrypt";
import User from "../models/User.js";
import { issueJwt } from "../libs/jwt.js";

// Admin route
export const admin = async (req, res) => {
  res.send("You are authorized to view this content");
};

// Register route/new user - Registration logic checked!
export const register = async (req, res) => {
  try {
    const { username, firstname, lastname, email, password } = req.body;

    // Check if user already exists checked!
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // Hash password
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // Create and save the new user
    const newUser = new User({
      username,
      firstname,
      lastname,
      email,
      hash,
    });

    await newUser.save();
    res.send({ message: "User registered successfully" });
    console.log("User registered successfully"); // Good to know/practice to log!
  } catch (error) {
    res.status(500).send({ message: "Error failed to register user" });
    console.log("Error failed to register user"); // Check the error in the console
  }
};

//User login logic checked!
export const login = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    //NOTE: login logic with username is changed to email instead!
    // Check if user email exists in the database
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("User not found");
      return res.status(400).send("Invalid credentials");
    }

    // Compare the password with the stored hash
    const isMatch = await bcrypt.compare(password, user.hash);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(400).send("Invalid credentials");
    }

    // Generate JWT token - Issue JWT checked!
    const token = issueJwt(user);

    // Send the token as an httpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true, // security measure!
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
    });

    res.status(200).json({ message: "User logged in successfully" });
    console.log("User logged in successfully");
  } catch (error) {
    console.error("Error during login:", error.message); // Log the error with.message
    res.status(500).send({ message: "Error failed to login" });
  }
};

// User logout - Logout logic checked!
export const logout = async (req, res) => {
  try {
    res
      .clearCookie("jwt", {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: "lax",
      })
      .send("User logged out"); // Send response after clearing cookie
    console.log("User Logged out");
  } catch (error) {
    console.error("Error during logout", error.message); // Log any potential errors during the logout process
    res.status(500).send("Error during logout"); // Respond with an error message if something goes wrong
  }
};

// NOTE:

// 1. register Function:
// - Check if the user already exists in the database.
// - Hash the password.
// - Create and save the new user in the database.

// 2. login Function:
// - Check if the user exists in the database.
// - Verify the user credentials.
// - Generate a JWT token.

// 3. logout Function:
// - Clear the JWT cookie when the user logs out.

// 4. admin Function:
// - Send an authorized message to the user.
