class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function ensure(condition, status, message) {
  if (!condition) throw new ApiError(status, message);
}

module.exports = { ApiError, ensure };
