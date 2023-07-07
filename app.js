//Require node modules
const path = require("path");

//Require custom modules
const userRouter = require("./routes/userRoutes");
const shareRouter = require("./routes/shareRoutes");

//Require installed packages
const express = require("express");
const morgan = require("morgan");

//Start express app
const app = express();

// 1 GLOBAL MIDDLEWARES

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Morgan Middleware for development. Logging request info to console.
if (process.env.NODE_ENV === "development") {
  console.log("DEVELOPMENT ENVIRONMENT");
  app.use(morgan("dev"));
}

// 2 ROUTES

app.use("/api/v1/users", userRouter);
app.use("/api/v1/shares", shareRouter);

// Parse incoming requests with JSON payloads (body-parser)
app.use(express.json({ limit: "10kb" }));

module.exports = app;
