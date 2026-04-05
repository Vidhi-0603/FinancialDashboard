const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookiesConfig = require("../config/cookies.config");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !password || !email)
      return res
        .status(400)
        .json({ message: "Name, email, and password are required!" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format!" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long!" });

    const userExists = await userModel.findOne({ email });
    if (userExists)
      return res.status(409).json({ message: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: role || "VIEWER",
    });
    const userObj = user.toObject();
    delete userObj.password;
    res
      .status(201)
      .json({ message: "User registered successfully!", user: userObj });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!password || !email)
      return res
        .status(400)
        .json({ message: "Email and password are required!" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format!" });

    const userExists = await userModel.findOne({ email }, "+password");
    if (!userExists)
      return res.status(401).json({ message: "Invalid credentials!" });

    const isPassMatch = await bcrypt.compare(password, userExists.password);
    if (!isPassMatch)
      return res.status(401).json({ message: "Invalid credentials!" });

    const token = jwt.sign(
      { id: userExists._id, role: userExists.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, cookiesConfig);
    const userObj = userExists.toObject();
    delete userObj.password;
    res.status(200).json({
      message: "User logged in successfully!",
      user: userObj,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

module.exports = { registerUser, loginUser };
