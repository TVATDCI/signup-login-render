import jsonwebtoken from "jsonwebtoken";

// Function to issue a JWT token for a user
export function issueJwt(user) {
  const { _id, username } = user; // Extract user id and username

  // Sign the token with the user's id and username, and set an expiration time
  return jsonwebtoken.sign({ id: _id, username }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Token expires in 1 hour
  });
}

// Function to verify a JWT token
export function verifyJwt(token) {
  // Verify the token using the secret key
  return jsonwebtoken.verify(token, process.env.JWT_SECRET);
}
