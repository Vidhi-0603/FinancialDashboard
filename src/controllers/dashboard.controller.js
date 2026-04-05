const recordsModel = require("../models/records.model");

const getSummary = async (req, res) => {
  try {
    const result = await recordsModel.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: null,
          total_income: {
            $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] },
          },
          total_expense: {
            $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] },
          },
        },
      },
      {
        $project: {
          _id: 0, //not include in output
          total_expense: 1, //include in output
          total_income: 1,
          net_balance: { $subtract: ["$total_income", "$total_expense"] },
        },
      },
    ]);

    //if DB is empty
    const summary = result[0] || {
      total_income: 0,
      total_expense: 0,
      net_balance: 0,
    };

    res.status(200).json({
      message: "Summary Report fetched!",
      total_expense: summary.total_expense,
      total_income: summary.total_income,
      net_balance: summary.net_balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch summary!", error });
  }
};

const getCategoryTotals = async (req, res) => {
  try {
    const result = await recordsModel.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          count: 1,
          category: "$_id.category",
          type: "$_id.type",
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      message: result.length
        ? "Category Wise Totals fetched!"
        : "No records found",
      count: result.length,
      data: result.length ? result : [],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch category wise totals!", error });
  }
};

const getRecent = async (req, res) => {
  try {
    const { limit } = req.query;
    const parsedLimit = limit ? parseInt(limit) : 5;
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100)
      return res
        .status(400)
        .json({ message: "Limit must be a number between 1 and 100!" });

    const recentRecords = await recordsModel
      .find({ is_deleted: false })
      .sort({ date: -1 })
      .limit(parsedLimit)
      .select("amount category type description date");

    res.status(200).json({
      message: "Recent activity fetched successfully!",
      recentRecords,
      count: recentRecords.length,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Failed to fetch recent activity!",
        error: error.message,
      });
  }
};

const getTrends = async (req, res) => {
  try {
    const { period } = req.query || "monthly"; // monthly/weekly

    if (period && !["monthly", "weekly"].includes(period))
      return res
        .status(400)
        .json({ message: "Period must be 'monthly' or 'weekly'!" });

    //make groups by (Week of Year) or (Month of Year)
    const groupId =
      period === "weekly"
        ? {
            year: { $isoWeekYear: "$date" },
            week: { $isoWeek: "$date" },
          }
        : {
            year: { $year: "$date" },
            month: { $month: "$date" },
          };

    const trends = await recordsModel.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: groupId,
          income: {
            $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] },
          },
          transactions: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id",
          income: 1,
          expense: 1,
          net: { $subtract: ["$income", "$expense"] },
          transactions: 1,
        },
      },
      { $sort: { "period.year": 1, "period.month": 1, "period.week": 1 } },
    ]);

    res.status(200).json({
      message: trends.length
        ? "Trends fetched successfully!"
        : "No records found!",
      period,
      count: trends.length,
      trends: trends.length ? trends : [],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch trends!", error: error.message });
  }
};

module.exports = { getSummary, getCategoryTotals, getRecent, getTrends };
