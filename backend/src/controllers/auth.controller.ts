import { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";
import { HttpError } from "../utils/http-error";

// Controller chỉ làm 3 việc: validate input tối thiểu, gọi service, trả HTTP response.
export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        throw new HttpError(400, "email, password and fullName are required", "VALIDATION_ERROR");
      }

      const result = await authService.register({ email, password, fullName });
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, identifier, password } = req.body;
      const loginIdentifier = identifier || email;

      if (!loginIdentifier || !password) {
        throw new HttpError(400, "identifier (or email) and password are required", "VALIDATION_ERROR");
      }

      const result = await authService.login({ identifier: loginIdentifier, password });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new HttpError(400, "refreshToken is required", "VALIDATION_ERROR");
      }

      const result = await authService.refreshToken(refreshToken);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new HttpError(400, "refreshToken is required", "VALIDATION_ERROR");
      }

      const result = authService.logout(refreshToken);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) {
        throw new HttpError(400, "email is required", "VALIDATION_ERROR");
      }

      const result = await authService.forgotPassword(email);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new HttpError(400, "token and newPassword are required", "VALIDATION_ERROR");
      }

      const result = await authService.resetPassword(token, newPassword);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },

  me: (req: Request, res: Response) => {
    // req.user được gắn từ middleware requireAuth.
    return res.status(200).json({ user: req.user });
  },

  sessions: (req: Request, res: Response) => {
    const result = authService.listSessions(req.user!.id);
    return res.status(200).json({ sessions: result });
  },

  logoutAll: (req: Request, res: Response) => {
    const result = authService.logoutAllSessions(req.user!.id);
    return res.status(200).json(result);
  },

  adminProbe: (req: Request, res: Response) => {
    return res.status(200).json({ message: `Hello admin ${req.user?.email}` });
  },
};
