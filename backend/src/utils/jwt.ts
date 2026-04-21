import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";

// Payload access token: dùng cho authorize request chính.
export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  type: "access";
};

// Payload refresh token: gắn sid để quản lý session/token rotation.
export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  type: "refresh";
};

// Payload reset token: gắn jti để đối chiếu một lần khi reset password.
export type ResetTokenPayload = {
  sub: string;
  jti: string;
  type: "reset-password";
};

// Hàm ký JWT dùng chung cho mọi loại token.
const signToken = (payload: object, expiresIn: string) => {
  const ttl = expiresIn as NonNullable<SignOptions["expiresIn"]>;
  const options: SignOptions = { expiresIn: ttl };
  return jwt.sign(payload, env.jwtSecret, options);
};

// Tạo access token.
export const signAccessToken = (payload: Omit<AccessTokenPayload, "type">) => {
  return signToken({ ...payload, type: "access" }, env.accessTokenTtl);
};

// Tạo refresh token.
export const signRefreshToken = (payload: Omit<RefreshTokenPayload, "type">) => {
  return signToken({ ...payload, type: "refresh" }, env.refreshTokenTtl);
};

// Tạo token cho luồng reset password.
export const signResetPasswordToken = (payload: Omit<ResetTokenPayload, "type">) => {
  return signToken({ ...payload, type: "reset-password" }, env.resetTokenTtl);
};

// Verify token bằng secret thống nhất từ env.
export const verifyToken = <T>(token: string) => {
  return jwt.verify(token, env.jwtSecret) as T;
};
