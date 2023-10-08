const express = require("express");
const widgetController = require("../controllers/widgetController");

const router = express.Router();

router.route("/").get(widgetController.getSCWidget);

module.exports = router;
