import { pinoHttp, Options as HttpOptions } from "pino-http";
import { pino, Logger } from "pino";
import config from "./config";
import os from "os";

const transportOptions = /(^dev|^test$)/.test(config.env)
  ? { transport: { target: "pino-pretty", options: { colorize: true } } }
  : {};

// https://github.com/pinojs/pino/blob/master/docs/redaction.md
const redact = {
  paths: [
    // Axios Errors
    'err.config.headers["api-key"]',
    'err.config.headers["apiKey"]',
    'err.config.headers["api_key"]',
    'err.config.headers["x-api-key"]',
    'err.config.headers["X-API-KEY"]',
    'err.config.headers["Authorization"]',
    "req.cookie",
    "req.headers.cookie",
  ],
  censor: "**REDACTED**",
};

export const logger: Logger = pino({
  level: config.logLevel,
  ...transportOptions,
  base: {
    env: config.env,
    pid: process.pid,
    hostname: os.hostname(),
  },
  redact,
  mixin(_context, level) {
    return { levelName: logger.levels.labels[level] };
  },
});
export default logger;

const httpOptions: HttpOptions = {
  level: config.env === "test" ? "error" : config.logLevel,
  // Disable request/response logging in test
  autoLogging: config.env !== "test",
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    }
    if (res.statusCode >= 500) {
      return "error";
    }
    return "info";
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: (req) => {
      req.headers["x-api-key"] = "redacted";
      if (config.env === "dev") {
        req.body = req.raw.body;
      }
      return req;
    },
  },
};
export const httpLogger = pinoHttp({
  ...httpOptions,
  ...transportOptions,
  logger,
});
