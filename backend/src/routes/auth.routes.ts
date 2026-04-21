import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/rbac.middleware";

export const authRouter = Router();

// Public routes: không yêu cầu đăng nhập.
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/oauth/google", authController.oauthGoogle);
authRouter.post("/oauth/facebook", authController.oauthFacebook);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/password/forgot", authController.forgotPassword);
authRouter.post("/password/reset", authController.resetPassword);

// Protected routes: bắt buộc có access token hợp lệ.
authRouter.get("/me", requireAuth, authController.me);
authRouter.get("/sessions", requireAuth, authController.sessions);
authRouter.post("/logout-all", requireAuth, authController.logoutAll);

// Admin route: cần vừa đăng nhập vừa có role ADMIN.
authRouter.get(
  "/admin/probe",
  requireAuth,
  requireRoles(UserRole.ADMIN),
  authController.adminProbe
);
