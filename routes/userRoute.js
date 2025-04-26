import express from "express";
import { admin, login, logout, register } from "../controllers/user.js";
import { authorizeJwt } from "../middleware/auth.js";

const router = express.Router();

router.get("/admin", authorizeJwt, admin);

router.post("/login", login);

router.post("/logout", logout);

router.post("/register", register);

export default router;

// Path: controllers/user.js
// It going to be exported to the userRoute.js
// as the mount of the userRoute into the app/routes stack in server.js!
