const app = require("./app");
const dotenv = require("dotenv");
const connectDatabase = require("./config/database");

//Handling uncaught exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});

dotenv.config({ path: "config/config.env" });

//Connecting Database
connectDatabase();
const server = app.listen(process.env.PORT, () => {
  console.log(`App is working on http://localhost:${process.env.PORT}`);
});

// Unhandled Promise Rejection

process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to unhandled promise rejection`);
  server.close(() => {
    process.exit();
  });
});
