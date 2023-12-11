const express = require("express");
const { etlData } = require("../controllers/etlControllers");

const router = express.Router();

router.route("/etlData").post(etlData);
// router.route("/loadData").post(createProduct);

module.exports = router;
