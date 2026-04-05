const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  createUser,
  updateUser,
  toggleStatus,
} = require("../controllers/user.controller");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, authorizeRoles("ADMIN"), getAllUsers);
router.post("/", authMiddleware, authorizeRoles("ADMIN"), createUser);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), updateUser);
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("ADMIN"),
  toggleStatus,
);

module.exports = router;
