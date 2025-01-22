import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import connectToDB from "./libs/db.js";
import userRoute from "./routes/userRoute.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

await connectToDB();

const port = process.env.PORT || 10000; // In this case, You will need to change this port after successful deployment from render.com
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientUrl = process.env.FRONTEND_URL;

// Middleware stack
app.use(
  cors({
    origin: clientUrl, // Allow requests from the frontend URL
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);
app.use(cookieParser());
app.use(express.json());

// Middleware routes
app.use("/api/user", userRoute); // Corrected the route

// !! Your middleware should not go below this line !!
// Serve frontend client/dist folder
app.use(express.static(path.join(__dirname, "client", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "client", "dist", "index.html"));
});

app.get("/health", (req, res) => {
  // Health check endpoint: https://your-app-name.onrender.com/health
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`The server 🙈 is listening on port ${port}`);
  console.log(`Visit ${clientUrl} in your browser`);
});
