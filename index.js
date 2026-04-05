require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/mongodb.config");
const app = express();
connectDB();

const authRoutes = require("./src/routes/auth.routes");
const recordsRoutes = require("./src/routes/records.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const userRoutes = require("./src/routes/user.routes");

const cookieParser = require("cookie-parser");
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/records", recordsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/user", userRoutes);


app.listen(5000, () => {
    console.log("Server running on port 5000");
})