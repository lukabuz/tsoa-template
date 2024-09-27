import db from "../db";
import logger from "../logger";
import { app } from "./app";
import { Server } from "socket.io";
import { createServer } from "http";
import config from "../config";

async function ready(): Promise<void> {
  await db.$queryRaw`SELECT 1`;
}

if (require.main === module) {
  (async () => {
    await ready();

    const port = config.port;

    const server = createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    server.listen(port);

    const gracefulShutdown = (): void => {
      server.close(() => {
        logger.info("Server exiting");
      });
    };

    process.on("SIGTERM", gracefulShutdown);
  })().catch((error) => {
    console.error(error);
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  });
}
