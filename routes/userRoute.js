import express from "express";
import { admin, login, logout, register } from "../controllers/user.js";
import { authorizeJwt } from "../middleware/auth.js";

const router = express.Router();

router.get("/admin", authorizeJwt, admin);

router.post("/login", login);

router.get("/logout", logout);

router.post("/register", register);

export default router;
