const express = require("express");
const shareController = require("../controllers/shareController");

const router = express.Router();

// Routes for creating a new share and requesting all shares with filter
router
  .route("/")
  .get(shareController.getAllShares)
  .post(shareController.createShare);

// Routes for finding, patching or deleting one share based on an id
router
  .route("/:id")
  .get(shareController.getOneShare)
  .patch(shareController.updateShare)
  .delete(shareController.deleteShare);

module.exports = router;
