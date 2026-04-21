import { NextFunction, Request, Response } from "express";
import { AccessTokenPayload, verifyToken } from "../utils/jwt";
import { HttpError } from "../utils/http-error";

// Xác thực Bearer token và gắn thông tin user vào req để dùng ở các bước sau.
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Thiếu Authorization header là lỗi 401 rõ ràng.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "Unauthorized", "UNAUTHORIZED"));
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    // Giải mã access token và kiểm tra đúng loại token.
    const payload = verifyToken<AccessTokenPayload>(token);

    if (payload.type !== "access") {
      return next(new HttpError(401, "Invalid access token", "TOKEN_INVALID"));
    }

    // Gắn user vào request để các route phía sau sử dụng.
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token", "TOKEN_EXPIRED"));
  }
};
