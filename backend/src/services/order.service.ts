import { OrderStatus, UserRole } from "@prisma/client";
import { prisma } from "../models/prisma";
import { HttpError } from "../utils/http-error";

interface CheckoutPayload {
  shippingAddr: string;
  phoneNumber: string;
  shippingFee: number;
  note?: string;
}

interface ListOrdersParams {
  page: number;
  limit: number;
  status?: OrderStatus;
  userId?: number;
}

interface CurrentUser {
  id: number;
  role: UserRole;
}

const USER_CANCELABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

const normalizeOrder = (order: any) => {
  const totalQuantity = order.items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );

  return {
    ...order,
    itemCount: order.items.length,
    totalQuantity,
  };
};

const validateAdminStatusTransition = (
  fromStatus: OrderStatus,
  toStatus: OrderStatus
) => {
  // Luồng trạng thái chuẩn để tránh cập nhật sai vòng đời đơn hàng.
  const allowedNextMap: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const allowedNext = allowedNextMap[fromStatus] || [];
  return allowedNext.includes(toStatus);
};

export const orderService = {
  // Checkout: tạo đơn từ giỏ hàng, trừ tồn kho và dọn cart item trong cùng transaction.
  async checkout(userId: number, payload: CheckoutPayload) {
    const { shippingAddr, phoneNumber, shippingFee, note } = payload;

    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new HttpError(400, "Giỏ hàng trống, không thể checkout", "VALIDATION_ERROR");
      }

      for (const item of cart.items) {
        if (!item.product.isActive) {
          throw new HttpError(
            400,
            `Sản phẩm ${item.product.name} đã ngừng kinh doanh`,
            "VALIDATION_ERROR"
          );
        }

        if (item.product.stock < item.quantity) {
          throw new HttpError(
            400,
            `Sản phẩm ${item.product.name} chỉ còn ${item.product.stock} trong kho`,
            "VALIDATION_ERROR",
            { productId: item.productId, available: item.product.stock }
          );
        }
      }

      const subtotal = cart.items.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);
      const totalPrice = subtotal + shippingFee;

      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new HttpError(
            409,
            `Tồn kho đã thay đổi cho sản phẩm ${item.product.name}, vui lòng thử lại`,
            "CONFLICT"
          );
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          totalPrice,
          shippingAddr,
          phoneNumber,
          ...(note ? { note } : {}),
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "checkout",
          entity: "order",
          entityId: createdOrder.id,
          newValues: JSON.stringify({
            status: createdOrder.status,
            totalPrice: createdOrder.totalPrice,
          }),
        },
      });

      return createdOrder;
    });

    return normalizeOrder(order);
  },

  async listMyOrders(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders: orders.map(normalizeOrder),
      total,
    };
  },

  async listOrders(params: ListOrdersParams) {
    const { page, limit, status, userId } = params;
    const skip = (page - 1) * limit;

    const whereClause: {
      status?: OrderStatus;
      userId?: number;
    } = {};

    if (status) {
      whereClause.status = status;
    }

    if (typeof userId === "number") {
      whereClause.userId = userId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return {
      orders: orders.map(normalizeOrder),
      total,
    };
  },

  async getOrderDetail(orderId: number, currentUser: CurrentUser) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new HttpError(404, "Đơn hàng không tồn tại", "NOT_FOUND");
    }

    const canView =
      currentUser.role === "ADMIN" || order.userId === currentUser.id;

    if (!canView) {
      throw new HttpError(403, "Không có quyền truy cập đơn hàng này", "FORBIDDEN");
    }

    return normalizeOrder(order);
  },

  async cancelOrder(orderId: number, currentUser: CurrentUser) {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!existingOrder) {
        throw new HttpError(404, "Đơn hàng không tồn tại", "NOT_FOUND");
      }

      if (
        currentUser.role !== "ADMIN" &&
        existingOrder.userId !== currentUser.id
      ) {
        throw new HttpError(403, "Không có quyền hủy đơn hàng này", "FORBIDDEN");
      }

      if (!USER_CANCELABLE_STATUSES.includes(existingOrder.status)) {
        throw new HttpError(
          400,
          "Chỉ có thể hủy đơn ở trạng thái chờ xác nhận hoặc đã xác nhận",
          "VALIDATION_ERROR"
        );
      }

      const cancelledOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        include: {
          items: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      // Hoàn lại tồn kho khi hủy đơn để đảm bảo số liệu kho nhất quán.
      for (const item of existingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "cancel",
          entity: "order",
          entityId: existingOrder.id,
          oldValues: JSON.stringify({ status: existingOrder.status }),
          newValues: JSON.stringify({ status: "CANCELLED" }),
        },
      });

      return cancelledOrder;
    });

    return normalizeOrder(order);
  },

  async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus,
    actorId: number
  ) {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!existingOrder) {
        throw new HttpError(404, "Đơn hàng không tồn tại", "NOT_FOUND");
      }

      if (existingOrder.status === newStatus) {
        throw new HttpError(400, "Đơn hàng đã ở trạng thái này", "VALIDATION_ERROR");
      }

      if (!validateAdminStatusTransition(existingOrder.status, newStatus)) {
        throw new HttpError(
          400,
          `Không thể chuyển trạng thái từ ${existingOrder.status} sang ${newStatus}`,
          "VALIDATION_ERROR"
        );
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      if (newStatus === "CANCELLED") {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "status_update",
          entity: "order",
          entityId: existingOrder.id,
          oldValues: JSON.stringify({ status: existingOrder.status }),
          newValues: JSON.stringify({ status: newStatus }),
        },
      });

      return updatedOrder;
    });

    return normalizeOrder(order);
  },
};
