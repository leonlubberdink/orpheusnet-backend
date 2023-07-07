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

exports.getAllShares = async (req, res) => {
  let filter = {};

  const shares = await Share.find(filter);

  res.status(200).json({
    status: "succes",
    results: shares.length,
    data: {
      shares,
    },
  });
};

exports.getShare = async (req, res) => {
  const shares = await Share.find(filter);

  res.status(200).json({
    status: "succes",
    results: shares.length,
    data: {
      shares,
    },
  });
};
