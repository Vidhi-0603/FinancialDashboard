const mongoose = require("mongoose");

const recordsSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
      default: "INCOME",
    },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const recordsModel = mongoose.model("Record", recordsSchema);

module.exports = recordsModel;
