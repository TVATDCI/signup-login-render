import { verifyJwt } from "../libs/jwt.js";
import User from "../models/User.js";

export async function authorizeJwt(req, res, next) {
  let token;

  // Check for token in headers
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    // Check for token in cookies
    token = req.cookies.jwt;
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized to access this resource" });
  }

  try {
    // Verify the token using the verifyJwt function
    const decoded = verifyJwt(token);

    // Learning Debugging Block – Uncomment if needed:
    // const user = await User.findById(decoded.id);
    // console.log("User with hash:", user); // Includes hash
    // const userSafe = await User.findById(decoded.id).select("-hash");
    // console.log("User without hash:", userSafe); // Excludes hash

    // NOTE: -password is changed to -hash as password is not in the model but hash!
    req.user = await User.findById(decoded.id).select("-hash"); // Exclude the hash field

    // If no matched user is found!
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // If the token is valid, attach the user to the request object
    req.user = user; // << implemented for learning purpose

    // Proceed to the next middleware or route handler (routes/userRoute.js)
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
}
