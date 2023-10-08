const express = require("express");
const cors = require("cors");

///USE CORS
express.use(cors());

const widgetController = require("../controllers/widgetController");

const router = express.Router();

router.route("/").get(widgetController.getSCWidget);

module.exports = router;
