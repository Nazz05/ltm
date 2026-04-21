import { Request, Response, NextFunction } from "express";
import { prisma } from "../models/prisma";
import { HttpError } from "../utils/http-error";

// Admin controller - Quản lý admin operations
export const adminController = {
  // ========== ORDERS ==========
  // Lấy danh sách tất cả đơn hàng (admin view)
  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;
      const status = req.query.status as string | undefined;

      const whereClause: any = { deletedAt: null };
      if (status) {
        whereClause.status = status.toUpperCase();
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({ where: whereClause }),
      ]);

      res.json({
        message: "Lấy danh sách đơn hàng thành công",
        data: {
          orders,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật trạng thái đơn hàng
  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new HttpError(400, "Vui lòng cung cấp status");
      }

      const validStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
      if (!validStatuses.includes(status.toUpperCase())) {
        throw new HttpError(400, "Status không hợp lệ");
      }

      const order = await prisma.order.findUnique({
        where: { id: parseInt(id as string) },
      });

      if (!order) {
        throw new HttpError(404, "Đơn hàng không tồn tại");
      }

      const updated = await prisma.order.update({
        where: { id: parseInt(id as string) },
        data: { status: status.toUpperCase() },
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
                select: { id: true, name: true, price: true },
              },
            },
          },
        },
      });

      res.json({
        message: "Cập nhật trạng thái đơn hàng thành công",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // Xóa đơn hàng (soft delete)
  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id: parseInt(id as string) },
      });

      if (!order) {
        throw new HttpError(404, "Đơn hàng không tồn tại");
      }

      await prisma.order.update({
        where: { id: parseInt(id as string) },
        data: { deletedAt: new Date() },
      });

      res.json({
        message: "Xóa đơn hàng thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== REVENUE ==========
  // Lấy thống kê doanh thu
  async getRevenueStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Tính từ đầu tháng
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const orders = await prisma.order.findMany({
        where: {
          deletedAt: null,
          status: "DELIVERED",
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
        select: {
          totalPrice: true,
          createdAt: true,
        },
      });

      const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Tính doanh thu theo ngày
      const dailyRevenueMap: { [key: string]: number } = {};
      orders.forEach((order) => {
        const date = order.createdAt.toISOString().split("T")[0] as string;
        dailyRevenueMap[date] = (dailyRevenueMap[date] || 0) + order.totalPrice;
      });

      const dailyRevenue = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      }));

      res.json({
        message: "Lấy thống kê doanh thu thành công",
        data: {
          summary: {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalOrders,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          },
          dailyRevenue,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== USERS ==========
  // Lấy danh sách tất cả người dùng
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;
      const role = req.query.role as string | undefined;

      const whereClause: any = { deletedAt: null };
      if (role) {
        whereClause.role = role.toUpperCase();
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      res.json({
        message: "Lấy danh sách người dùng thành công",
        data: {
          users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật người dùng
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { fullName, phone, role, isActive } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id as string) },
      });

      if (!user) {
        throw new HttpError(404, "Người dùng không tồn tại");
      }

      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role.toUpperCase();
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await prisma.user.update({
        where: { id: parseInt(id as string) },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        message: "Cập nhật người dùng thành công",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // Xóa người dùng (soft delete)
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id as string) },
      });

      if (!user) {
        throw new HttpError(404, "Người dùng không tồn tại");
      }

      await prisma.user.update({
        where: { id: parseInt(id as string) },
        data: { deletedAt: new Date() },
      });

      res.json({
        message: "Xóa người dùng thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== ADDRESSES ==========
  // Lấy danh sách tất cả địa chỉ
  async getAllAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;

      const whereClause: any = { deletedAt: null };

      const [addresses, total] = await Promise.all([
        prisma.address.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.address.count({ where: whereClause }),
      ]);

      res.json({
        message: "Lấy danh sách địa chỉ thành công",
        data: {
          addresses,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật địa chỉ
  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { street, ward, district, city, zipCode, isDefault } = req.body;

      const address = await prisma.address.findUnique({
        where: { id: parseInt(id as string) },
      });

      if (!address) {
        throw new HttpError(404, "Địa chỉ không tồn tại");
      }

      const updateData: any = {};
      if (street !== undefined) updateData.street = street;
      if (ward !== undefined) updateData.ward = ward;
      if (district !== undefined) updateData.district = district;
      if (city !== undefined) updateData.city = city;
      if (zipCode !== undefined) updateData.zipCode = zipCode;
      if (isDefault !== undefined) updateData.isDefault = isDefault;

      const updated = await prisma.address.update({
        where: { id: parseInt(id as string) },
        data: updateData,
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      res.json({
        message: "Cập nhật địa chỉ thành công",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // Xóa địa chỉ
  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const address = await prisma.address.findUnique({
        where: { id: parseInt(id as string) },
      });

      if (!address) {
        throw new HttpError(404, "Địa chỉ không tồn tại");
      }

      await prisma.address.update({
        where: { id: parseInt(id as string) },
        data: { deletedAt: new Date() },
      });

      res.json({
        message: "Xóa địa chỉ thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== AUDIT LOGS ==========
  // Lấy danh sách audit logs
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;
      const action = req.query.action as string | undefined;
      const entity = req.query.entity as string | undefined;

      const whereClause: any = {};
      if (action) {
        whereClause.action = action;
      }
      if (entity) {
        whereClause.entity = entity;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.count({ where: whereClause }),
      ]);

      res.json({
        message: "Lấy danh sách audit logs thành công",
        data: {
          content: logs,
          pagination: {
            totalElements: total,
            totalPages: Math.ceil(total / limit),
            size: limit,
            number: page - 1,
            numberOfElements: logs.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
