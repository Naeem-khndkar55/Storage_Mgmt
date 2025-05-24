const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db.config");

require("dotenv").config();
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({}));
app.use(express.json());

module.exports = app;
