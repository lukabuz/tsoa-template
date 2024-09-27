import { User } from "@prisma/client";

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  masterSecret: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twofatoken?: string;
}

export interface LoginResponse {
  jwt: string;
  user: User;
}