const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Token = require("../models/Token");
const sendEmail = require("../config/email");
const { generateToken } = require("../utils/helpers");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        storageUsed: user.storageUsed,
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete existing token
    await Token.deleteMany({ userId: user._id });

    // Create reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET + user.password,
      { expiresIn: "1h" }
    );

    await Token.create({
      userId: user._id,
      token: resetToken,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    const emailSent = await sendEmail(
      user.email,
      "Password Reset Token",
      message
    );

    if (emailSent) {
      res.json({ message: "Email sent" });
    } else {
      res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { password } = req.body;
  const { resettoken } = req.params;

  try {
    const tokenDoc = await Token.findOne({ token: resettoken });

    if (!tokenDoc) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Verify token
    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const decoded = jwt.verify(
      resettoken,
      process.env.JWT_SECRET + user.password
    );

    // Update password
    user.password = password;
    await user.save();

    await Token.deleteOne({ token: resettoken });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
