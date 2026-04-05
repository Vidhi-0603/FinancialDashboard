const express = require("express");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { getSummary, getCategoryTotals, getRecent, getTrends } = require("../controllers/dashboard.controller");
const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
  getSummary,
);

router.get(
  "/recent",
  authMiddleware,
  authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
  getRecent,
);

router.get(
  "/by-category",
  authMiddleware,
  authorizeRoles("ANALYST", "ADMIN"),
  getCategoryTotals,
);

router.get(
  "/get-trends",
  authMiddleware,
  authorizeRoles("ANALYST", "ADMIN"),
  getTrends,
);
module.exports = router;
