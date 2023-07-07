const Share = require("../models/shareModel");
const catchAsync = require("../utils/catchAsync");

exports.createShare = catchAsync(async (req, res) => {
  const share = await Share.create(req.body);

  res.status(200).json({
    status: "succes",
    data: {
      share,
    },
  });
});

exports.getAllShares = catchAsync(async (req, res) => {
  let filter = {};

  const shares = await Share.find(filter);

  res.status(200).json({
    status: "succes",
    results: shares.length,
    data: {
      shares,
    },
  });
});

exports.getOneShare = catchAsync(async (req, res) => {
  const share = await Share.findById(req.params.id);

  res.status(200).json({
    status: "succes",
    data: {
      share,
    },
  });
});

exports.updateShare = catchAsync(async (req, res) => {
  const share = await Share.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "succes",
    data: {
      share,
    },
  });
});

exports.deleteShare = catchAsync(async (req, res) => {
  await Share.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
