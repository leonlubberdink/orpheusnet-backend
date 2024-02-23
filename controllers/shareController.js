const Share = require('../models/shareModel');
const factory = require('./controllerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const checkUrlService = require('../services/checkUrlService');

const popOptions = {
  path: 'group user',
  select: 'groupName groupImage userName userImage',
};

exports.checkIfOwner = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    const share = await Share.findById(req.params.id).populate('user');
    if (share.user.id !== req.user.id) {
      return next(
        new AppError(
          'You are not allowed to remove a post from another user',
          403
        )
      );
    }
  }
  next();
});

exports.deleteShare = factory.deleteOne(Share);

exports.getAllSharesInGroup = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.groupId) filter = { group: req.params.groupId };

  const shares = await Share.find(filter).populate(popOptions);

  res.status(201).json({
    status: 'success',
    results: shares.length,
    data: {
      data: shares,
    },
  });
});

exports.createShare = catchAsync(async (req, res, next) => {
  let oEmbedUrl,
    platform,
    shareObject = {};

  const { url: shareUrl, group, format, user } = req.body;

  if (shareUrl.includes('soundcloud')) {
    oEmbedUrl = process.env.SOUNDCLOUD_OEMBED_URL;
    platform = 'SoundCloud';

    const urlInfo = await checkUrlService(oEmbedUrl, req.body.url, platform);

    if (urlInfo)
      shareObject = {
        shareUrl,
        group,
        user,
        platform,
        format: format.toLowerCase(),
        publisher: urlInfo.author_name,
        title: urlInfo.title,
      };
  }

  if (req.body.url.includes('spotify')) {
    oEmbedUrl = process.env.SPOTIFY_OEMBED_URL;
    platform = 'Spotify';
    const urlInfo = await checkUrlService(oEmbedUrl, req.body.url, platform);

    if (urlInfo)
      shareObject = {
        shareUrl: urlInfo.url,
        group,
        user,
        platform,
        format: format.toLowerCase(),
        publisher: urlInfo.author_name,
        title: urlInfo.title,
      };
  }

  console.log(shareObject);

  // if url is invalid, but format was provided, put format in object.
  shareObject = { ...shareObject, format };

  const newShare = await Share.create(shareObject);

  console.log(newShare);

  res.status(201).json({
    status: 'success',
    data: {
      data: newShare,
    },
  });
});

exports.setGroupUserIds = (req, res, next) => {
  // Get params from nested routes
  if (!req.body.group) req.body.group = req.params.groupId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
