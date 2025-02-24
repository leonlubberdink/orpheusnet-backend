const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const QueryBuilder = require('../utils/queryBuilder');

exports.getAll = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = new QueryBuilder(Model.find({}), req.query)
      .filter()
      .sort()
      .projectFields()
      .paginate();

    if (popOptions) {
      query = query.constructedQuery.populate(popOptions);
    } else {
      query = query.constructedQuery;
    }

    const docs = await query;

    res.status(200).json({
      status: 'succes',
      results: docs.length,
      data: {
        docs,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = Model.findById(req.params.id).populate(popOptions);

    const doc = await query;

    if (!doc)
      return next(
        new AppError(`No document found with ID '${req.params.id}'`, 404)
      );

    res.status(200).json({
      status: 'succes',
      data: {
        doc,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc)
      return next(
        new AppError(`No document found with ID '${req.params.id}'`, 404)
      );

    res.status(200).json({
      status: 'succes',
      data: {
        doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return next(
        new AppError(`No document found with ID '${req.params.id}'`, 404)
      );

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
