import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/rbac.middleware";

// Routes quản lý người dùng
const userRouter = Router();

// Protected routes - cần xác thực
userRouter.get("/profile", requireAuth, userController.getProfile);
userRouter.put("/profile", requireAuth, userController.updateProfile);

// Admin routes - chỉ admin mới được phép
userRouter.get("/", requireAuth, requireRoles("ADMIN"), userController.listUsers);
userRouter.delete(
  "/:userId",
  requireAuth,
  requireRoles("ADMIN"),
  userController.deleteUser
);

// Admin: cấp/thu hồi quyền admin
userRouter.post(
  "/:userId/grant-admin",
  requireAuth,
  requireRoles("ADMIN"),
  userController.grantAdminRole
);
userRouter.post(
  "/:userId/revoke-admin",
  requireAuth,
  requireRoles("ADMIN"),
  userController.revokeAdminRole
);

export default userRouter;
