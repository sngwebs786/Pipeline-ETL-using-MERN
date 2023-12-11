const express = require("express");
const cors = require("cors");
const app = express();
const errorMiddleware = require("./middleware/error");

//Config
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors()); // Use this after the variable declaration

app.use(express.json());

//Route Imports
const etl = require("./routes/etlRoutes");

app.use("/api/v1", etl);

//Middleware for Erros
app.use(errorMiddleware);
module.exports = app;
