function responseFormatter(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === "object" && "success" in body) {
      const { errorCode, ...rest } = body;
      body = {
        statusCode: res.statusCode,
        success: rest.success,
        errorCode: errorCode ?? null,
        ...rest,
      };
    }
    return originalJson(body);
  };
  next();
}

module.exports = responseFormatter;
