const express = require("express");
const router = express.Router();
const { loginUser, registerUser } = require("../controllers/user.controller");
const { check } = require("express-validator");
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  loginUser
);

router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 8 or more characters"
    ).isLength({ min: 8 }),
  ],
  registerUser
);

module.exports = router;
