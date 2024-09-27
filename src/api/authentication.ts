import { Request } from "express";
import config from "../config";
import jwt from "jsonwebtoken";

// TODO: Implement auth here
// https://tsoa-community.github.io/docs/authentication.html
export async function expressAuthentication(
  req: Request,
  _securityName: string,
  _scopes?: string[]
): Promise<void> {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }
  const data = jwt.verify(token, config.jwtSecretKey);
  if (!data) {
    throw new Error("Invalid token");
  }
}
