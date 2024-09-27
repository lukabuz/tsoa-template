import { User } from "@prisma/client";
import { LoginResponse } from "../api/types";
import speakeasy from "speakeasy";
import bcrypt from "bcrypt";
import prisma from "../db";
import jwt from "jsonwebtoken";
import config from "../config";
import logger from "../logger";

export const createUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  const encryptedPassword = await encryptPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: encryptedPassword,
    },
  });
  return user;
};

export const loginUser = async (
  email: string,
  password: string,
  twofatoken?: string
): Promise<LoginResponse | null> => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    logger.warn(`User with email ${email} not found`);
    return null;
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    logger.warn(`User with email ${email} provided incorrect password`);
    return null;
  }

  if (user.twoFactorAuthEnabled) {
    if (!twofatoken) {
      logger.warn(
        `User with email ${email} has 2FA enabled but no token provided`
      );
      return null;
    }
    const isTokenValid = await verifyTotpToken(user, twofatoken);
    if (!isTokenValid) {
      logger.warn(`User with email ${email} provided incorrect 2FA token`);
      return null;
    }
  }

  const jwt = await createJwt(user);
  return { jwt, user };
};

const createJwt = async (user: User): Promise<string> => {
  return jwt.sign(
    {
      sub: user.id,
      data: user,
      iat: Date.now(),
      exp: Date.now() + 60 * 60 * 1000,
    },
    config.jwtSecretKey
  );
};

export const getUserFromJwt = async (
  tokenHeader: string
): Promise<User | null> => {
  const token = tokenHeader.split(" ")[1];
  const data = jwt.verify(token, config.jwtSecretKey);
  if (!data) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(data.sub as string),
    },
  });
  return user;
};

const encryptPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const generateTotpSecret = async (user: User): Promise<string> => {
  // generate random secret of 32 characters
  const secret = speakeasy.generateSecret().base32;
  // save encrypted secret to user
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorAuthSecret: secret,
    },
  });

  return secret;
};

export const verifyTotpToken = async (
  user: User,
  token: string
): Promise<boolean> => {
  if (!user.twoFactorAuthSecret) {
    return false;
  }

  const isTokenValid =
    speakeasy.totp({
      secret: user.twoFactorAuthSecret,
      encoding: "base32",
    }) === token;

  if (isTokenValid) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        twoFactorAuthEnabled: true,
      },
    });
  }

  return isTokenValid;
};
