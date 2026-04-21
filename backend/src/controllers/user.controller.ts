import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { HttpError } from "../utils/http-error";

// Controller cho quản lý người dùng
// Xử lý các request/response liên quan đến thông tin người dùng

export const userController = {
  // Lấy thông tin hồ sơ người dùng hiện tại
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // Lấy user ID từ JWT token (được gắn vào req.user bởi auth middleware)
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(
          401,
          "Không thể xác định người dùng",
          "UNAUTHORIZED"
        );
      }

      // Gọi service để lấy thông tin user
      const user = await userService.getUserById(userId);

      // Trả về dữ liệu user mà không có password
      res.json({
        message: "Lấy thông tin hồ sơ thành công",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật thông tin hồ sơ người dùng
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(
          401,
          "Không thể xác định người dùng",
          "UNAUTHORIZED"
        );
      }

      //Lấy dữ liệu cần cập nhật từ request body
      const { fullName, phone } = req.body;

      // Validate dữ liệu đầu vào
      if (!fullName && !phone) {
        throw new HttpError(
          400,
          "Phải cung cấp ít nhất một trường để cập nhật",
          "VALIDATION_ERROR"
        );
      }

      // Gọi service để cập nhật thông tin
      const updatedUser = await userService.updateUserProfile(userId, {
        fullName,
        phone,
      });

      res.json({
        message: "Cập nhật thông tin thành công",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Lấy danh sách tất cả người dùng
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // Lấy pagination từ query string (mặc định page=1, limit=10)
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;

      // Lấy role filter từ query (nếu có)
      const role = req.query.role as string | undefined;

      // Gọi service để lấy danh sách user
      const result = await userService.listUsers(skip, limit, role);

      res.json({
        message: "Lấy danh sách người dùng thành công",
        data: result.users,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Xóa người dùng (soft delete)
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;

      // Validate format userId
      if (!userId || isNaN(parseInt(userId))) {
        throw new HttpError(400, "ID người dùng không hợp lệ", "VALIDATION_ERROR");
      }

      // Không cho xóa admin hoặc chính bản thân người dùng
      if (req.user?.id === parseInt(userId)) {
        throw new HttpError(400, "Không thể xóa tài khoản của chính mình", "VALIDATION_ERROR");
      }

      await userService.deleteUser(parseInt(userId));

      res.json({
        message: "Xóa người dùng thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Cấp quyền admin cho người dùng
  async grantAdminRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;

      if (!userId || isNaN(parseInt(userId))) {
        throw new HttpError(400, "ID người dùng không hợp lệ", "VALIDATION_ERROR");
      }

      // Không cho cấp quyền cho chính bản thân
      if (req.user?.id === parseInt(userId)) {
        throw new HttpError(400, "Không thể cấp quyền cho chính mình", "VALIDATION_ERROR");
      }

      const updatedUser = await userService.updateUserRole(
        parseInt(userId),
        "ADMIN"
      );

      res.json({
        message: "Cấp quyền admin thành công",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Thu hồi quyền admin từ người dùng
  async revokeAdminRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;

      if (!userId || isNaN(parseInt(userId))) {
        throw new HttpError(400, "ID người dùng không hợp lệ", "VALIDATION_ERROR");
      }

      const updatedUser = await userService.updateUserRole(
        parseInt(userId),
        "USER"
      );

      res.json({
        message: "Thu hồi quyền admin thành công",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },
};
