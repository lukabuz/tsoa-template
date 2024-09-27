import { z } from "zod";
import { pino } from "pino";
import dotenv from "dotenv";

dotenv.config();

const nodeEnvSchema = z
  .union([z.literal("dev"), z.literal("test"), z.literal("production")])
  .default("dev");

const logLevelSchema: z.ZodType<pino.Level> = z.union([
  z.literal("fatal"),
  z.literal("debug"),
  z.literal("warn"),
  z.literal("info"),
  z.literal("error"),
]);

// Exported for testing
export const envConfigSchema = z.object({
  // DATABASE_URL: databaseUrlSchema,
  NODE_ENV: nodeEnvSchema,
  LOG_LEVEL: logLevelSchema.default("info"),
  PORT: z.string().default("9000"),
  MASTER_SECRET: z.string().max(32).default("foobar"),
  JWT_SECRET_KEY: z.string().max(32).default("foobar"),
});

const envConfig = envConfigSchema.parse(process.env);

const config = {
  env: envConfig.NODE_ENV,
  logLevel: envConfig.LOG_LEVEL,
  port: envConfig.PORT,
  masterSecret: envConfig.MASTER_SECRET,
  jwtSecretKey: envConfig.JWT_SECRET_KEY,
};

export type IConfig = typeof config;

export default config;
