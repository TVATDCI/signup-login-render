import jsonwebtoken from "jsonwebtoken";

//NOTE: improving the JWT token by adding email to the payload
export function issueJwt(user) {
  const payload = {
    id: user._id,
    email: user.email,
    username: user.username,
  };

  return jsonwebtoken.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h", // Token expiry time of 1 hour
  });
}

// Function to verify and decode token safely
export function verifyJwt(token) {
  try {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    throw new Error("Invalid token");
    return null; // Return null if verification fails
  }
}
// Next stop extracting token from cookies in middleware/auth.js

// Function to issue a JWT token for a user is changed from username to email
//export function issueJwt(user) {
//  const { _id, email } = user; // Extract user id email from payload!
//
//  // Sign the token with the user's id and username, and set an expiration time
//  return jsonwebtoken.sign({ id: _id, email }, process.env.JWT_SECRET, {
//    expiresIn: "1h", // Token expires in 1 hour
//  });
//}

// future plan = adding optional issueJwt payload with both email, username
// const decoded = verifyJwt(token);
// console.log(decoded.email); //  email
// console.log(decoded.username); // username

// Function to verify a JWT token
//export function verifyJwt(token) {
// Verify the token using the secret key
//  return jsonwebtoken.verify(token, process.env.JWT_SECRET);
//}
