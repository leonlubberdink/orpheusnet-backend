const Share = require('../models/shareModel');
const factory = require('./controllerFactory');

exports.createShare = factory.createOne(Share);
exports.getAllShares = factory.getAll(Share);
exports.getOneShare = factory.getOne(Share);
exports.updateShare = factory.updateOne(Share);
exports.deleteShare = factory.deleteOne(Share);
