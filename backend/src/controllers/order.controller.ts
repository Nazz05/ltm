import { OrderStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { orderService } from "../services/order.service";
import { HttpError } from "../utils/http-error";

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const orderController = {
  // Checkout giỏ hàng để tạo đơn mới cho người dùng hiện tại.
  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Không thể xác định người dùng", "UNAUTHORIZED");
      }

      const { shippingAddr, phoneNumber, shippingFee, note } = req.body;

      if (!shippingAddr || typeof shippingAddr !== "string") {
        throw new HttpError(400, "Địa chỉ giao hàng không hợp lệ", "VALIDATION_ERROR");
      }

      if (!phoneNumber || typeof phoneNumber !== "string") {
        throw new HttpError(400, "Số điện thoại không hợp lệ", "VALIDATION_ERROR");
      }

      // Mặc định phí vận chuyển = 0 nếu không gửi
      const finalShippingFee = typeof shippingFee === "number" ? shippingFee : 0;
      
      if (finalShippingFee < 0) {
        throw new HttpError(400, "Phí vận chuyển không hợp lệ", "VALIDATION_ERROR");
      }

      if (note !== undefined && typeof note !== "string") {
        throw new HttpError(400, "Ghi chú không hợp lệ", "VALIDATION_ERROR");
      }

      const order = await orderService.checkout(userId, {
        shippingAddr: shippingAddr.trim(),
        phoneNumber: phoneNumber.trim(),
        shippingFee: finalShippingFee,
        ...(note ? { note: note.trim() } : {}),
      });

      res.status(201).json({
        message: "Checkout thành công",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async listMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Không thể xác định người dùng", "UNAUTHORIZED");
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      const result = await orderService.listMyOrders(userId, page, limit);

      res.json({
        message: "Lấy danh sách đơn hàng của tôi thành công",
        data: result.orders,
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

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      const statusQuery = req.query.status as string | undefined;
      let status: OrderStatus | undefined;
      if (statusQuery) {
        const upperStatus = statusQuery.toUpperCase();
        if (!VALID_ORDER_STATUSES.includes(upperStatus as OrderStatus)) {
          throw new HttpError(400, "Trạng thái đơn hàng không hợp lệ", "VALIDATION_ERROR");
        }
        status = upperStatus as OrderStatus;
      }

      const userIdQuery = req.query.userId as string | undefined;
      let userId: number | undefined;
      if (userIdQuery) {
        const parsedUserId = parseInt(userIdQuery, 10);
        if (isNaN(parsedUserId) || parsedUserId <= 0) {
          throw new HttpError(400, "userId không hợp lệ", "VALIDATION_ERROR");
        }
        userId = parsedUserId;
      }

      const listParams: {
        page: number;
        limit: number;
        status?: OrderStatus;
        userId?: number;
      } = {
        page,
        limit,
      };

      if (status) {
        listParams.status = status;
      }

      if (typeof userId === "number") {
        listParams.userId = userId;
      }

      const result = await orderService.listOrders(listParams);

      res.json({
        message: "Lấy danh sách đơn hàng thành công",
        data: result.orders,
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

  async getOrderDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new HttpError(401, "Không thể xác định người dùng", "UNAUTHORIZED");
      }

      const orderId = parseInt((req.params.orderId as string) || "", 10);
      if (isNaN(orderId) || orderId <= 0) {
        throw new HttpError(400, "ID đơn hàng không hợp lệ", "VALIDATION_ERROR");
      }

      const order = await orderService.getOrderDetail(orderId, {
        id: user.id,
        role: user.role,
      });

      res.json({
        message: "Lấy chi tiết đơn hàng thành công",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new HttpError(401, "Không thể xác định người dùng", "UNAUTHORIZED");
      }

      const orderId = parseInt((req.params.orderId as string) || "", 10);
      if (isNaN(orderId) || orderId <= 0) {
        throw new HttpError(400, "ID đơn hàng không hợp lệ", "VALIDATION_ERROR");
      }

      const order = await orderService.cancelOrder(orderId, {
        id: user.id,
        role: user.role,
      });

      res.json({
        message: "Hủy đơn hàng thành công",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) {
        throw new HttpError(401, "Không thể xác định người dùng", "UNAUTHORIZED");
      }

      const orderId = parseInt((req.params.orderId as string) || "", 10);
      if (isNaN(orderId) || orderId <= 0) {
        throw new HttpError(400, "ID đơn hàng không hợp lệ", "VALIDATION_ERROR");
      }

      const statusRaw = req.body?.status;
      if (!statusRaw || typeof statusRaw !== "string") {
        throw new HttpError(400, "Thiếu trạng thái cần cập nhật", "VALIDATION_ERROR");
      }

      const normalizedStatus = statusRaw.toUpperCase() as OrderStatus;
      if (!VALID_ORDER_STATUSES.includes(normalizedStatus)) {
        throw new HttpError(400, "Trạng thái đơn hàng không hợp lệ", "VALIDATION_ERROR");
      }

      const order = await orderService.updateOrderStatus(
        orderId,
        normalizedStatus,
        actorId
      );

      res.json({
        message: "Cập nhật trạng thái đơn hàng thành công",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },
};
