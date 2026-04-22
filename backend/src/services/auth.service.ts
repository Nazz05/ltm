import crypto from "crypto";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";
import { auditRepository } from "../repositories/audit.repository";
import { userRepository } from "../repositories/user.repository";
import { comparePassword, hashPassword } from "../utils/password";
import {
  RefreshTokenPayload,
  ResetTokenPayload,
  signAccessToken,
  signRefreshToken,
  signResetPasswordToken,
  verifyToken,
} from "../utils/jwt";
import { HttpError } from "../utils/http-error";
import { sessionService } from "./session.service";

type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
};

type LoginInput = {
  identifier: string;
  password: string;
};

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};

type PasswordResetRecord = {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
};

// Lưu token reset tạm thời trong RAM (phù hợp môi trường dev/demo).
const resetTokens = new Map<string, PasswordResetRecord>();

// Chuẩn hóa email để tránh trùng do khác hoa/thường hoặc khoảng trắng.
const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Rule mật khẩu cơ bản: >=8 ký tự, có hoa, thường và số.
const validatePasswordStrength = (password: string) => {
  const strongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
  if (!strongPassword.test(password)) {
    throw new HttpError(
      400,
      "Password must be at least 8 characters, include uppercase, lowercase and number"
      ,
      "VALIDATION_ERROR"
    );
  }
};

// Cấp cặp token mới và tạo session refresh token tương ứng.
const issueTokenPair = (user: { id: number; email: string; role: UserRole }): TokenResponse => {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: String(user.id), sid: sessionId });
  sessionService.createSession(user.id, refreshToken, env.refreshTokenTtl);

  const accessToken = signAccessToken({
    sub: String(user.id),
    email: user.email,
    role: user.role,
  });

  return { accessToken, refreshToken, sessionId };
};

export const authService = {
  // Đăng ký: kiểm tra trùng email, hash mật khẩu, tạo user, ghi audit, trả token.
  register: async (input: RegisterInput) => {
    const email = normalizeEmail(input.email);
    validatePasswordStrength(input.password);

    const existingUser = await userRepository.findByEmailIncludingDeleted(email);
    if (existingUser) {
      throw new HttpError(409, "Email already exists", "CONFLICT");
    }

    const password = await hashPassword(input.password);
    const user = await userRepository.create({
      email,
      password,
      fullName: input.fullName.trim(),
    });

    await auditRepository.create({
      userId: user.id,
      action: "register",
      entity: "user",
      entityId: user.id,
      newValues: JSON.stringify({ email: user.email, role: user.role }),
    });

    const tokens = issueTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  },

  // Đăng nhập: xác thực bằng email/số điện thoại/tên tài khoản và password.
  login: async (input: LoginInput) => {
    const identifier = input.identifier.trim();
    console.log(`[Auth] Login attempt with identifier: ${identifier}`);
    
    const user = await userRepository.findByLoginIdentifier(identifier);

    if (!user) {
      console.log(`[Auth] User not found: ${identifier}`);
      throw new HttpError(401, "Đăng nhập không thành công - Tài khoản hoặc mật khẩu không đúng", "UNAUTHORIZED");
    }

    console.log(`[Auth] User found: ${user.email}, checking password...`);
    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      console.log(`[Auth] Invalid password for user: ${identifier}`);
      throw new HttpError(401, "Đăng nhập không thành công - Tài khoản hoặc mật khẩu không đúng", "UNAUTHORIZED");
    }
    
    console.log(`[Auth] Login successful for user: ${user.email}`);

    await auditRepository.create({
      userId: user.id,
      action: "login",
      entity: "user",
      entityId: user.id,
    });

    const tokens = issueTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  },

  // Refresh: kiểm tra refresh token + session hiện hữu, xoay vòng token, cấp access token mới.
  refreshToken: async (refreshToken: string) => {
    let payload: RefreshTokenPayload;

    try {
      payload = verifyToken<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new HttpError(401, "Invalid refresh token", "TOKEN_INVALID");
    }

    if (payload.type !== "refresh") {
      throw new HttpError(401, "Invalid refresh token type", "TOKEN_INVALID");
    }

    const valid = sessionService.validateRefreshToken(payload.sid, refreshToken);
    if (!valid) {
      throw new HttpError(401, "Refresh token revoked or expired", "TOKEN_EXPIRED");
    }

    const user = await userRepository.findById(Number(payload.sub));
    if (!user) {
      throw new HttpError(404, "User not found", "NOT_FOUND");
    }

    const newRefreshToken = signRefreshToken({ sub: String(user.id), sid: payload.sid });
    sessionService.rotateRefreshToken(payload.sid, newRefreshToken, env.refreshTokenTtl);

    const accessToken = signAccessToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: payload.sid,
    };
  },

  // Logout một phiên: revoke session theo sid trong refresh token.
  logout: (refreshToken: string) => {
    try {
      const payload = verifyToken<RefreshTokenPayload>(refreshToken);
      if (payload.type === "refresh") {
        sessionService.revokeSession(payload.sid);
      }
    } catch {
      // Always return success for logout to avoid token probing.
    }

    return { message: "Logged out successfully" };
  },

  // Liệt kê các session còn hiệu lực của user hiện tại.
  listSessions: (userId: number) => {
    return sessionService.listActiveByUserId(userId);
  },

  // Logout tất cả thiết bị của user.
  logoutAllSessions: (userId: number) => {
    sessionService.revokeAllByUserId(userId);
    return { message: "All sessions revoked" };
  },

  // Quên mật khẩu: tạo reset token và lưu hash token để đối chiếu khi reset.
  forgotPassword: async (emailInput: string) => {
    const email = normalizeEmail(emailInput);
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return {
        message: "If the email exists, a reset token has been generated",
      };
    }

    const jti = crypto.randomUUID();
    const token = signResetPasswordToken({ sub: String(user.id), jti });
    resetTokens.set(jti, {
      userId: user.id,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await auditRepository.create({
      userId: user.id,
      action: "request_password_reset",
      entity: "user",
      entityId: user.id,
    });

    return {
      message: "If the email exists, a reset token has been generated",
      resetToken: env.nodeEnv === "production" ? undefined : token,
    };
  },

  // Đặt lại mật khẩu: verify token, kiểm tra hạn, đổi mật khẩu và revoke toàn bộ session cũ.
  resetPassword: async (token: string, newPassword: string) => {
    validatePasswordStrength(newPassword);

    let payload: ResetTokenPayload;

    try {
      payload = verifyToken<ResetTokenPayload>(token);
    } catch {
      throw new HttpError(401, "Invalid reset token", "TOKEN_INVALID");
    }

    if (payload.type !== "reset-password") {
      throw new HttpError(401, "Invalid reset token type", "TOKEN_INVALID");
    }

    const record = resetTokens.get(payload.jti);
    const incomingHash = crypto.createHash("sha256").update(token).digest("hex");

    if (!record || record.tokenHash !== incomingHash || record.expiresAt.getTime() < Date.now()) {
      throw new HttpError(401, "Reset token expired or invalid", "TOKEN_EXPIRED");
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.updatePassword(record.userId, hashedPassword);
    sessionService.revokeAllByUserId(record.userId);
    resetTokens.delete(payload.jti);

    await auditRepository.create({
      userId: record.userId,
      action: "reset_password",
      entity: "user",
      entityId: record.userId,
    });

    return { message: "Password reset successful" };
  },
};
