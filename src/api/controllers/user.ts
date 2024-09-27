import {
  Hidden,
  Tags,
  Controller,
  Get,
  NoSecurity,
  Route,
  SuccessResponse,
  Post,
  Body,
  Security,
  Request,
} from "tsoa";
import logger from "../../logger";
import { CreateUserRequest, LoginRequest, LoginResponse } from "../types";
import config from "../../config";
import {
  createUser,
  generateTotpSecret,
  getUserFromJwt,
  loginUser,
  verifyTotpToken,
} from "../../services/user";
import { User } from "@prisma/client";

@Tags("V1")
@Route("v1/user")
export class UserController extends Controller {
  @NoSecurity()
  @Post("login")
  public async login(
    @Body() requestBody: LoginRequest
  ): Promise<LoginResponse | undefined> {
    const { email, password, twofatoken } = requestBody;
    const loginResponse = await loginUser(email, password, twofatoken);
    if (!loginResponse) {
      this.setStatus(401);
      return;
    }
    return loginResponse;
  }

  @NoSecurity()
  @Post()
  @SuccessResponse("200")
  public async create(
    @Body() requestBody: CreateUserRequest
  ): Promise<User | void> {
    if (requestBody.masterSecret !== config.masterSecret) {
      this.setStatus(401);
      return;
    }
    try {
      const { email, password, name } = requestBody;
      const user = await createUser(email, password, name);
      this.setStatus(200);
      return user;
    } catch (e) {
      logger.error(e);
      this.setStatus(500);
      return;
    }
  }

  @Security("jwt")
  @Hidden()
  @Get("/me")
  @SuccessResponse("200")
  public async me(@Request() request: any): Promise<any> {
    const user = await getUserFromJwt(request.headers["authorization"]);
    if (!user) {
      this.setStatus(401);
      return;
    }

    const { password, twoFactorAuthSecret, ...sanitizedUser } = user;

    return { user: sanitizedUser };
  }

  @Security("jwt")
  @Hidden()
  @Get("/get-two-factor-auth-secret")
  @SuccessResponse("200")
  public async getTwoFactorAuthSecret(@Request() request: any): Promise<any> {
    const user = await getUserFromJwt(request.headers["authorization"]);
    if (!user || user.twoFactorAuthEnabled) {
      this.setStatus(401);
      return;
    }

    const twoFactorAuthSecret = await generateTotpSecret(user);

    return { twoFactorAuthSecret };
  }

  @Security("jwt")
  @Hidden()
  @Post("/enable-two-factor-auth")
  @SuccessResponse("200")
  public async enableTwoFactorAuth(
    @Request() request: any,
    @Body()
    body: {
      token: string;
    }
  ): Promise<any> {
    const user = await getUserFromJwt(request.headers["authorization"]);
    if (!user || user.twoFactorAuthEnabled) {
      this.setStatus(401);
      return;
    }

    const enabled = await verifyTotpToken(user, body.token);

    if (!enabled) {
      this.setStatus(401);
      return;
    }

    return { enabled };
  }
}
