const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized!" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Unauthorized!" });
    if (user.status === "INACTIVE")
      return res.status(403).json({ message: "Account is deactivated!" });
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Unauthorized!", error: err.message });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden!" });
    }
    next();
  };
};

module.exports = { authMiddleware, authorizeRoles };
