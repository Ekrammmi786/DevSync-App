export const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (trimmed.startsWith("$") || trimmed.startsWith("{")) {
      return "";
    }
    return trimmed;
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$")) continue;
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};
