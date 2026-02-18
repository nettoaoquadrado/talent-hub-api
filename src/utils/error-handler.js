const config = require("../config/config");

function isAppException(err) {
  return !!(
    err &&
    typeof err === "object" &&
    "isAppException" in err &&
    err.isAppException === true &&
    "statusCode" in err &&
    typeof err.statusCode === "number"
  );
}

function normalizeJoiDetails(details) {
  if (Array.isArray(details)) {
    return details.map((d) => ({
      path: Array.isArray(d.path) ? d.path.join(".") : d.path,
      message: d.message ?? String(d),
    }));
  }
  if (details && typeof details === "object" && "details" in details) {
    return normalizeJoiDetails(details.details);
  }
  return [];
}

function toDetailsArray(details) {
  if (details == null) return [];
  if (Array.isArray(details)) {
    return details.map((d) =>
      typeof d === "object" && d !== null && "message" in d
        ? { path: d.path, message: String(d.message) }
        : String(d)
    );
  }
  return [{ message: String(details) }];
}

function buildErrorPayload(statusCode, code, message, rawDetails) {
  const details = toDetailsArray(rawDetails);
  return { code, message, details };
}

function fromBoom(boom) {
  const statusCode = boom.statusCode ?? (boom.output?.statusCode ?? 500);
  const payload = boom.output?.payload ?? {};
  const message = boom.message ?? payload.message ?? "Erro na requisição";
  const code = (boom.code ?? payload.code ?? (statusCode === 400 ? "VALIDATION_ERROR" : "ERROR")).toUpperCase().replace(/\s+/g, "_");

  const rawDetails = boom.data?.details ?? payload.details ?? boom.data;
  const details = Array.isArray(rawDetails)
    ? normalizeJoiDetails(rawDetails)
    : toDetailsArray(rawDetails);

  return { statusCode, code, message, details };
}

function fromAppException(err) {
  const details = toDetailsArray(err.details);
  return {
    statusCode: err.statusCode,
    code: err.code ?? "ERROR",
    message: err.message ?? "Erro",
    details,
  };
}

function onPreResponse(request, h) {
  const response = request.response;

  if (!response || (!response.isBoom && !(response instanceof Error))) {
    return h.continue;
  }

  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Erro interno do servidor. Tente novamente mais tarde.";
  let details = [];

  if (response.isBoom) {
    const boom = response;
    const data = boom.data;
    if (data && isAppException(data)) {
      const out = fromAppException(data);
      statusCode = out.statusCode;
      code = out.code;
      message = out.message;
      details = out.details;
    } else {
      const out = fromBoom(boom);
      statusCode = out.statusCode;
      code = out.code;
      message = out.message;
      details = out.details;
    }
  } else if (response instanceof Error && isAppException(response)) {
    const out = fromAppException(response);
    statusCode = out.statusCode;
    code = out.code;
    message = out.message;
    details = out.details;
  } else if (response instanceof Error) {
    const isDev = config.app.env !== "production";
    console.error("[ERROR]", response.message ?? response);
    if (isDev && response.stack) console.error(response.stack);
    message = isDev && response.message ? response.message : message;
    details = isDev ? [response.message] : [];
  }

  return h
    .response({ code, message, details: Array.isArray(details) ? details : [] })
    .code(statusCode)
    .takeover();
}

function registerErrorHandler(server) {
  server.ext("onPreResponse", onPreResponse);
}

module.exports = {
  isAppException,
  buildErrorPayload,
  toDetailsArray,
  normalizeJoiDetails,
  fromBoom,
  fromAppException,
  registerErrorHandler,
};
