const Share = require("../models/shareModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./controllerFactory");

exports.createShare = factory.createOne(Share);
exports.getAllShares = factory.getAll(Share);
exports.getOneShare = factory.getOne(Share);
exports.updateShare = factory.updateOne(Share);

exports.deleteShare = catchAsync(async (req, res) => {
  await Share.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
