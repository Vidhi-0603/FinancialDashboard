const mongoose = require("mongoose");
const recordsModel = require("../models/records.model");

const createRecord = async (req, res) => {
  try {
    const { amount, category, type, description, date } = req.body;
    if (!amount || !type || !category)
      return res
        .status(400)
        .json({ message: "Amount, type, and category are required!" });

    if (typeof amount !== "number" || amount <= 0)
      return res
        .status(400)
        .json({ message: "Amount must be a positive number!" });

    const validTypes = ["INCOME", "EXPENSE"];
    if (!validTypes.includes(type.toUpperCase()))
      return res
        .status(400)
        .json({ message: "Type must be either 'INCOME' or 'EXPENSE'!" });

    if (!category.trim())
      return res.status(400).json({ message: "Category cannot be empty!" });

    if (date && isNaN(new Date(date))) {
      return res.status(400).json({ message: "Invalid date format!" });
    }

    const record = await recordsModel.create({
      amount,
      category: category.trim(),
      type: type.toUpperCase(),
      description,
      date: date ? new Date(date) : Date.now(),
    });

    res.status(201).json({ message: "Record created successfully!", record });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Record creation failed!", error: error.message });
  }
};

const getAllRecords = async (req, res) => {
  try {
    const records = await recordsModel.find({ is_deleted: false });
    res
      .status(200)
      .json({
        message: "Records fetched successfully!",
        records,
        count: records.length,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch records!", error: error.message });
  }
};

const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid record ID!" });
    }
    const record = await recordsModel.findOne({ _id: id, is_deleted: false });
    if (!record) {
      return res.status(404).json({ message: "Record not found!" });
    }
    res.status(200).json({ message: "Record fetched successfully!", record });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch record!", error: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid record ID!" });
    }

    const record = await recordsModel.findOne({
      _id: id,
      is_deleted: false,
    });
    if (!record) return res.status(404).json({ message: "Record not found!" });

    const { amount, category, type, description, date } = req.body;

    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0)
        return res
          .status(400)
          .json({ message: "Amount must be a positive number!" });
      record.amount = amount;
    }
    if (category !== undefined) {
      if (!category.trim())
        return res.status(400).json({ message: "Category cannot be empty!" });
      record.category = category.trim();
    }
    if (type !== undefined) {
      const validTypes = ["INCOME", "EXPENSE"];
      if (!validTypes.includes(type.toUpperCase()))
        return res
          .status(400)
          .json({ message: "Type must be either 'INCOME' or 'EXPENSE'!" });
      record.type = type.toUpperCase();
    }
    if (description !== undefined) record.description = description;
    if (date !== undefined) {
      if (isNaN(new Date(date)))
        return res.status(400).json({ message: "Invalid date format!" });
      record.date = new Date(date);
    }

    await record.save();

    res.status(200).json({ message: "Record updated successfully!", record });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update record!", error: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid record ID!" });
    }

    const record = await recordsModel.findOne({ _id: id, is_deleted: false });
    if (!record) {
      return res.status(404).json({ message: "Record not found!" });
    }

    record.is_deleted = true;
    await record.save();

    res.status(200).json({ message: "Record deleted successfully!", record });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to delete record!", error: error.message });
  }
};

const filterRecords = async (req, res) => {
  try {
    const { type, category, startDate, endDate, minAmount, maxAmount } =
      req.query;

    const filter = { is_deleted: false };

    if (type) {
      const validTypes = ["INCOME", "EXPENSE"];
      if (!validTypes.includes(type.toUpperCase()))
        return res
          .status(400)
          .json({ message: "Type must be either 'INCOME' or 'EXPENSE'!" });
      filter.type = type.toUpperCase();
    }
    if (category) filter.category = { $regex: category, $options: "i" };

    //date in range
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start))
          return res.status(400).json({ message: "Invalid startDate format!" });
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end))
          return res.status(400).json({ message: "Invalid endDate format!" });
        filter.date.$lte = end;
      }
    }
    //amount in range
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) {
        const min = parseFloat(minAmount);
        if (isNaN(min) || min < 0)
          return res
            .status(400)
            .json({ message: "minAmount must be a non-negative number!" });
        filter.amount.$gte = min;
      }
      if (maxAmount) {
        const max = parseFloat(maxAmount);
        if (isNaN(max) || max < 0)
          return res
            .status(400)
            .json({ message: "maxAmount must be a non-negative number!" });
        filter.amount.$lte = max;
      }
    }
    const records = (await recordsModel.find(filter)).sort({ date: -1 });
    res.status(200).json({ message: "Records fetched successfully!", records });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch records!", error: error.message });
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  filterRecords,
};
