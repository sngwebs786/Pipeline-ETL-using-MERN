const mongoose = require("mongoose");
// Define a schema for your MongoDB collection
const summarisedSchema = new mongoose.Schema({
  Category: String,
  totalSales: String,
  totalProfit: String,
});

// Create a model based on the schema
const SumETL = mongoose.model("SumETL", summarisedSchema);
module.exports = SumETL;
