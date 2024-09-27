import {
  Hidden,
  Tags,
  Controller,
  Get,
  NoSecurity,
  Route,
  SuccessResponse,
} from "tsoa";
import db from "../../db";
import logger from "../../logger";

@Tags("V1")
@Route("v1")
export class HealthController extends Controller {
  @NoSecurity()
  @Get("health")
  public async getHealth(): Promise<{ ok: true }> {
    return { ok: true };
  }

  @NoSecurity()
  @Hidden()
  @Get("ready")
  @SuccessResponse("200")
  public async getReady(): Promise<void> {
    try {
      await db.$queryRaw`SELECT 1`;
    } catch (err) {
      logger.error(err);
      this.setStatus(503);
      return;
    }
    this.setStatus(200);
  }
}
