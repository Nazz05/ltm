import { prisma } from "../models/prisma";
import { HttpError } from "../utils/http-error";

// Service quản lý địa chỉ giao hàng
export const addressService = {
  // Lấy danh sách địa chỉ của người dùng
  async listAddresses(userId: number) {
    const addresses = await prisma.address.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return addresses;
  },

  // Tạo địa chỉ mới
  async createAddress(
    userId: number,
    data: {
      street: string;
      ward: string;
      district: string;
      city: string;
      zipCode?: string;
      isDefault: boolean;
    }
  ) {
    // Nếu isDefault = true, bỏ mặc định từ các địa chỉ khác
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        street: data.street,
        ward: data.ward,
        district: data.district,
        city: data.city,
        zipCode: data.zipCode || null,
        isDefault: data.isDefault,
      },
    });

    return address;
  },

  // Cập nhật địa chỉ
  async updateAddress(
    userId: number,
    addressId: number,
    data: {
      street?: string;
      ward?: string;
      district?: string;
      city?: string;
      zipCode?: string;
    }
  ) {
    // Kiểm tra địa chỉ có tồn tại và thuộc về user không
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },
    });

    if (!address) {
      throw new HttpError(404, "Địa chỉ không tồn tại");
    }

    // Update address
    const updateData: any = {};
    if (data.street) updateData.street = data.street;
    if (data.ward) updateData.ward = data.ward;
    if (data.district) updateData.district = data.district;
    if (data.city) updateData.city = data.city;
    if (data.zipCode) updateData.zipCode = data.zipCode;

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    return updatedAddress;
  },

  // Xóa địa chỉ (soft delete)
  async deleteAddress(userId: number, addressId: number) {
    // Kiểm tra địa chỉ có tồn tại không
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },
    });

    if (!address) {
      throw new HttpError(404, "Địa chỉ không tồn tại");
    }

    // Soft delete
    await prisma.address.update({
      where: { id: addressId },
      data: { deletedAt: new Date() },
    });
  },

  // Đặt địa chỉ mặc định
  async setDefaultAddress(userId: number, addressId: number) {
    // Kiểm tra địa chỉ có tồn tại không
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },
    });

    if (!address) {
      throw new HttpError(404, "Địa chỉ không tồn tại");
    }

    // Bỏ mặc định từ các địa chỉ khác
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Đặt địa chỉ này làm mặc định
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return updatedAddress;
  },
};
