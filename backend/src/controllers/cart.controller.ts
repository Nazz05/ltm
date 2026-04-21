import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service";
import { HttpError } from "../utils/http-error";

// Controller quản lý giỏ hàng
// Xử lý các request/response liên quan đến giỏ hàng người dùng

export const cartController = {
  // Lấy giỏ hàng của người dùng hiện tại
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Không thể xác định người dùng");
      }

      // Gọi service để lấy thông tin giỏ hàng
      const cart = await cartService.getCartByUserId(userId);

      res.json({
        message: "Lấy giỏ hàng thành công",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  },

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Điều kiện xác định người dùng không thành công");
      }

      // Lấy productId và quantity từ request body
      const { productId, quantity } = req.body;

      // Validate dữ liệu
      if (!productId || isNaN(parseInt(productId))) {
        throw new HttpError(400, "ID sản phẩm không hợp lệ");
      }

      if (!quantity || quantity <= 0) {
        throw new HttpError(400, "Số lượng phải lớn hơn 0");
      }

      // Gọi service để thêm sản phẩm vào giỏ
      const cart = await cartService.addToCart(userId, parseInt(productId), quantity);

      res.json({
        message: "Thêm sản phẩm vào giỏ hàng thành công",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật số lượng sản phẩm trong giỏ
  async updateCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Điều kiện xác định người dùng không thành công");
      }

      const cartItemId = req.params.cartItemId as string;
      const { quantity } = req.body;

      // Validate dữ liệu
      if (!cartItemId || isNaN(parseInt(cartItemId))) {
        throw new HttpError(400, "ID mục giỏ không hợp lệ");
      }

      if (!quantity || quantity <= 0) {
        throw new HttpError(400, "Số lượng phải lớn hơn 0");
      }

      // Gọi service để cập nhật sản phẩm
      const cart = await cartService.updateCartItem(
        userId,
        parseInt(cartItemId),
        quantity
      );

      res.json({
        message: "Cập nhật sản phẩm trong giỏ hàng thành công",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  async removeFromCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Điều kiện xác định người dùng không thành công");
      }

      const cartItemId = req.params.cartItemId as string;

      // Validate dữ liệu
      if (!cartItemId || isNaN(parseInt(cartItemId))) {
        throw new HttpError(400, "ID mục giỏ không hợp lệ");
      }

      // Gọi service để xóa sản phẩm
      const cart = await cartService.removeFromCart(userId, parseInt(cartItemId));

      res.json({
        message: "Xóa sản phẩm khỏi giỏ hàng thành công",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  },

  // Xóa tất cả sản phẩm trong giỏ hàng
  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Điều kiện xác định người dùng không thành công");
      }

      const cart = await cartService.clearCart(userId);

      res.json({
        message: "Xóa tất cả sản phẩm trong giỏ hàng thành công",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  },
};
