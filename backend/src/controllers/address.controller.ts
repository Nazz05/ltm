import { Request, Response, NextFunction } from "express";
import { addressService } from "../services/address.service";
import { HttpError } from "../utils/http-error";

// Controller quản lý địa chỉ
export const addressController = {
  // Lấy danh sách địa chỉ của người dùng hiện tại
  async listAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Không thể xác định người dùng");
      }

      const addresses = await addressService.listAddresses(userId);

      res.json({
        message: "Lấy danh sách địa chỉ thành công",
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  },

  // Tạo địa chỉ mới
  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Không thể xác định người dùng");
      }

      const { street, ward, district, city, zipCode, isDefault } = req.body;

      // Validate dữ liệu bắt buộc
      if (!street || !ward || !district || !city) {
        throw new HttpError(400, "Vui lòng cung cấp: street, ward, district, city");
      }

      const address = await addressService.createAddress(userId, {
        street,
        ward,
        district,
        city,
        zipCode,
        isDefault: isDefault || false,
      });

      res.status(201).json({
        message: "Tạo địa chỉ thành công",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật địa chỉ
  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Không thể xác định người dùng");
      }

      const addressId = String(req.params.addressId);
      if (!addressId || isNaN(parseInt(addressId))) {
        throw new HttpError(400, "ID địa chỉ không hợp lệ");
      }

      const { street, ward, district, city, zipCode } = req.body;

      const address = await addressService.updateAddress(userId, parseInt(addressId), {
        street,
        ward,
        district,
        city,
        zipCode,
      });

      res.json({
        message: "Cập nhật địa chỉ thành công",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  },

  // Xóa địa chỉ
  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Không thể xác định người dùng");
      }

      const addressId = String(req.params.addressId);
      if (!addressId || isNaN(parseInt(addressId))) {
        throw new HttpError(400, "ID địa chỉ không hợp lệ");
      }

      await addressService.deleteAddress(userId, parseInt(addressId));

      res.json({
        message: "Xóa địa chỉ thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // Đặt địa chỉ mặc định
  async setDefaultAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpError(401, "Không thể xác định người dùng");
      }

      const addressId = String(req.params.addressId);
      if (!addressId || isNaN(parseInt(addressId))) {
        throw new HttpError(400, "ID địa chỉ không hợp lệ");
      }

      const address = await addressService.setDefaultAddress(userId, parseInt(addressId));

      res.json({
        message: "Đặt địa chỉ mặc định thành công",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  },
};
