const ApiFeatures = class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let objQuery = { ...this.queryString };
    let excludeFields = ['page', 'limit', 'sort', 'fields'];
    excludeFields.forEach(ele => delete objQuery[ele]);

    objQuery = JSON.stringify(objQuery);
    objQuery = objQuery.replace(/\b(gte|lte|lt|gt)\b/g, match => `$${match}`);
    this.query.find(JSON.parse(objQuery));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const SORT_BY = this.queryString.sort.split(',').join(' ');
      this.query.sort(SORT_BY);
    } else {
      this.query.sort('createdAt');
    }
    return this;
  }

  limiting() {
    if (this.queryString.fields) {
      const FIELDS = this.queryString.fields.split(',').join(' ');
      this.query.select(FIELDS);
    } else {
      this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    let limit = +this.queryString.limit || 100;
    let page = +this.queryString.page || 1;
    const skipped = (page - 1) * limit;

    this.query.skip(skipped).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
