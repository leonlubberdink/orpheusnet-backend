const Group = require("../models/groupModel");
const factory = require("./controllerFactory");

exports.createUser = factory.createOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getOneUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
