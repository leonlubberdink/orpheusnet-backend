const catchAsync = require("../utils/catchAsync");

// PATCH One user based on Id, on user request
exports.getSCWidget = catchAsync(async (req, res, next) => {
  const scUrl = req.query.url;

  const scRes = await fetch(`${process.env.SOUNDCLOUD_OEMBED_URL}${scUrl}`);
  const data = await scRes.json();

  res.status(200).json({
    status: "success",
    html: data.html,
  });
});
