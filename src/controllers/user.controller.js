const userModel = require("../models/user.model");

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
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

    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res
        .status(409)
        .json({ message: "User with this email already exists!" });

    const user = await userModel.create({ name, email, password, role });
    const userObj = user.toObject();
    delete userObj.password;

    res
      .status(201)
      .json({ message: "User created successfully!", user: userObj });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !require("mongoose").Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user ID!" });

    const updates = req.body;

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ message: "No update fields provided!" });

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    const allowedUpdates = ["name", "email", "role"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const field of Object.keys(updates)) {
      if (!allowedUpdates.includes(field))
        return res
          .status(400)
          .json({ message: `Field '${field}' is not allowed to update!` });

      if (field === "email") {
        if (!emailRegex.test(updates.email))
          return res.status(400).json({ message: "Invalid email format!" });
        const existingUser = await userModel.findOne({ email: updates.email });
        if (existingUser && existingUser._id.toString() !== id)
          return res.status(409).json({ message: "Email already in use!" });
      }

      user[field] = updates[field];
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;

    res
      .status(200)
      .json({ message: "User updated successfully!", user: userObj });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !require("mongoose").Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user ID!" });

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    if (user._id.toString() === req.user._id.toString())
      return res
        .status(400)
        .json({ message: "You cannot change your own status!" });

    user.status = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await user.save();

    res.status(200).json({
      message: `User ${user.status === "ACTIVE" ? "activated" : "deactivated"} successfully!`,
      id: user._id,
      status: user.status,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to toggle status", error: error.message });
  }
};

module.exports = { getAllUsers, createUser, updateUser, toggleStatus };
