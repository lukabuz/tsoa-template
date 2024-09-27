import { ErrorRequestHandler } from "express";
import { ValidateError } from "tsoa";
import { isEmpty } from "lodash";
import logger from "../../logger";
import { isAxiosError } from "axios";

const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof ValidateError) {
    err.message = isEmpty(err.message) ? "Validation Error" : err.message;
    logger.error(err);
    const json = {
      status: "error",
      message: "Validation Failed",
      details: err.fields,
    };
    return res.status(400).json(json);
  }

  if (isAxiosError(err)) {
    const { config, message, code, response } = err;
    logger.error(
      {
        baseUrl: config?.baseURL,
        method: config?.method,
        path: config?.url,
        response: response?.data,
      },
      `Axios Request Error: message=${message} code=${String(code)}`
    );
    return res.status(500).json({
      message: "Server Error",
      error: "UnknownError",
    });
  }

  if (err instanceof Error) {
    logger.error(err);
    return res.status(500).json({
      message: "Server Error",
      error: "UnknownError",
    });
  }
};

export default errorHandler;
