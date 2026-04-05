const express = require("express");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  filterRecords,
} = require("../controllers/records.controller");
const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("ADMIN"), createRecord);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
  getAllRecords,
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
  getRecordById,
);

router.get(
  "/filter",
  authMiddleware,
  authorizeRoles("VIEWER", "ANALYST", "ADMIN"),
  filterRecords,
);

router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), deleteRecord);

router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), updateRecord);

module.exports = router;
