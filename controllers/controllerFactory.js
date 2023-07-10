const catchAsync = require('../utils/catchAsync');
const QueryBuilder = require('../utils/queryBuilder');

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    let query = new QueryBuilder(Model.find({}), req.query)
      .filter()
      .sort()
      .projectFields()
      .paginate();

    const docs = await query.constructedQuery;

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
    const doc = await Model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findById(req.params.id);

    res.status(200).json({
      status: 'succes',
      data: {
        doc,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'succes',
      data: {
        doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res) => {
    await Model.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
