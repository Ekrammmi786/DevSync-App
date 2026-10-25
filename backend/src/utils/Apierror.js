class ApiError extends Error {
  constructor(statusCode, message, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;  // matches err.statusCode in server error handler
    this.code = code;
    this.success = false;
    this.name = "ApiError";
  }
}

export default ApiError;
