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
    req.user = await User.findById(decoded.id).select("-password"); // Attach decoded user to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
}
