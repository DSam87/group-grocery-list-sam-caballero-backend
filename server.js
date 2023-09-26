require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3500;
const path = require("path");
const { errorHandler } = require("./middleware/errorHandler");
const { logger, logEvents } = require("./middleware/logger");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const familyGroupRoutes = require("./routes/familyGroupRoutes");
const itemRoutes = require("./routes/itemRoutes");

// Connecting to mongodb database through mongoose config function
connectDB();

// Custom middleware
app.use(logger);

// for cross origin requests
app.use(cors(corsOptions));

// middleware for parsing json reqs
app.use(express.json());

// middleware to pars cookies
app.use(cookieParser());

// middleware for static files
app.use("/", express.static(path.join(__dirname, "public")));

// Routes
app.use("/", require("./routes/root"));
app.use("/users", require("./routes/userRoutes"));
app.use("/family-group", familyGroupRoutes);
app.use("/items", itemRoutes);
app.use("/auth", require("./routes/authRoutes"));

app.all("*", require("./routes/404"));

app.use(errorHandler);

mongoose.connection.once("open", () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
