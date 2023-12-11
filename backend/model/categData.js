const mongoose = require("mongoose");
// Define a schema for your MongoDB collection
const categorisedSchema = new mongoose.Schema({
  OrderID: String,
  Order: String,
  Date: String,
  ShipDate: String,
  ShipMode: String,
  CustomerID: String,
  CustomerName: String,
  Segment: String,
  Country: String,
  City: String,
  State: String,
  PostalCode: String,
  Region: String,
  ProductID: String,
  Category: String,
  SubCategory: String,
  ProductName: String,
  Sales: String,
  Quantity: String,
  Discount: String,
  Profit: String,
  SalesCategory: String,
});

// Create a model based on the schema
const CatETL = mongoose.model("CatETL", categorisedSchema);
module.exports = CatETL;
