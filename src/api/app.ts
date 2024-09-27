import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import config from "../config";
import { RegisterRoutes } from "./routes";
import errorHandler from "./middleware/error";
import { httpLogger } from "../logger";
import { crossOriginResourcePolicy, hidePoweredBy, hsts } from "helmet";
import cors from "cors";

export function makeApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(httpLogger);
  app.use(crossOriginResourcePolicy({ policy: "cross-origin" }));
  app.use(hsts());
  app.use(hidePoweredBy());
  app.use(cors());

  app.get("/", (_, res) => {
    res.json({ ok: true });
  });

  if (config.env !== "production") {
    // eslint-disable-next-line
    app.use("/docs", swaggerUi.serve, async (_: Request, res: Response) => {
      return res.send(
        swaggerUi.generateHTML(await import("../../tsoa/swagger.json"))
      );
    });
  }

  RegisterRoutes(app);

  app.use(errorHandler);

  app.use((_, res) => {
    res.status(404).json({
      message: "Not Found",
    });
  });
  return app;
}

export const app = makeApp();
