import { prisma } from "../models/prisma";
import { HttpError } from "../utils/http-error";

// Service quản lý người dùng
// Chứa logic nghiệp vụ liên quan đến thông tin người dùng

export const userService = {
  // Lấy thông tin người dùng theo ID
  async getUserById(userId: number) {
    // Tìm user trong database (không lấy password)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Nếu user không tồn tại, throw error UNAUTHORIZED
    if (!user) {
      throw new HttpError(401, "Người dùng không tồn tại", "UNAUTHORIZED");
    }

    return user;
  },

  // Cập nhật thông tin hồ sơ người dùng
  async updateUserProfile(
    userId: number,
    data: {
      fullName?: string;
      phone?: string;
    }
  ) {
    // Chỉ cập nhật những trường được cung cấp (filter undefined values)
    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.phone) updateData.phone = data.phone;

    // Update user trong database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },

  // Lấy danh sách người dùng (hỗ trợ pagination và filter theo role)
  async listUsers(skip: number, take: number, role?: string) {
    // Build filter object for role (nếu có, chỉ lấy user có role tương ứng)
    const whereClause: any = {};
    if (role) {
      whereClause.role = role.toUpperCase();
    }

    // Fetch users từ database với pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return { users, total };
  },

  // Xóa người dùng (soft delete - cập nhật deletedAt thay vì xóa hoàn toàn)
  async deleteUser(userId: number) {
    // Kiểm tra user có tồn tại không trước khi xóa
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(404, "Người dùng không tồn tại", "NOT_FOUND");
    }

    // Soft delete: đặt deletedAt = now() thay vì xóa record
    return prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  },

  // Cập nhật role của người dùng (ADMIN hoặc USER)
  async updateUserRole(userId: number, newRole: "ADMIN" | "USER") {
    // Kiểm tra user có tồn tại không
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(404, "Người dùng không tồn tại", "NOT_FOUND");
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },
};
