const _ = require("lodash");

const QueryBuilder = function (constructedQuery, requestedQuery) {
  this.constructedQuery = constructedQuery;
  this.requestedQuery = requestedQuery;
};

// 1) FILTER
// Filter function that returns the modified query object and requested querystring
QueryBuilder.prototype.filter = function () {
  const excludedFields = ["page", "sort", "limit", "fields"];

  // Create query clone without excluded fields
  const queryObj = _.cloneDeep(_.omit(this.requestedQuery, excludedFields));

  // Add $ to Query operators
  let queryString = JSON.stringify(queryObj);
  queryString = queryString.replace(
    /\b(gte|gt|lte|lt)\b/g,
    (match) => `$${match}`
  );

  // Return both the filtered query and the requested query for further processing
  this.constructedQuery = this.constructedQuery.find(JSON.parse(queryString));
  return this;
};

// 2) SORT
// Filter function that returns the modified query object and requested querystring
QueryBuilder.prototype.sort = function () {
  if (this.requestedQuery.sort) {
    const sortCriteria = this.requestedQuery.sort.split(",").join(" ");
    this.constructedQuery = this.constructedQuery.sort(sortCriteria);
  } else {
    this.constructedQuery = this.constructedQuery.sort("-createdAt");
  }

  // Return both the filtered query and the requested query for further processing
  return this;
};

QueryBuilder.prototype.projectFields = function () {
  this.constructedQuery.select("-__v");

  if (this.requestedQuery.fields) {
    const fields = this.requestedQuery.fields.split(",").join(" ");
    this.constructedQuery = this.constructedQuery.select(fields);
  }

  return this;
};

QueryBuilder.prototype.paginate = function () {
  const page = +this.requestedQuery.page || 1;
  const limit = +this.requestedQuery.limit || 9;
  const skip = (page - 1) * limit;

  this.constructedQuery = this.constructedQuery.skip(skip).limit(limit);

  return this;
};

module.exports = QueryBuilder;
