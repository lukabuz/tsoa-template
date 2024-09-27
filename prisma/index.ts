// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import logger from "../src/logger";

export const prisma = new PrismaClient({
  log: [
    { level: "info", emit: "event" },
    { level: "query", emit: "event" },
    { level: "error", emit: "event" },
    { level: "warn", emit: "event" },
  ],
});

prisma.$on("query", (e) => {
  logger.debug(e);
});

prisma.$on("error", (e) => {
  logger.error(e);
});

prisma.$on("warn", (e) => {
  logger.warn(e);
});

prisma.$on("info", (e) => {
  logger.info(e);
});
