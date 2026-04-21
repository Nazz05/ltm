import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { HttpError } from "../utils/http-error";

// Controller quản lý sản phẩm
// Xử lý các request/response liên quan đến sản phẩm

export const productController = {
  // Lấy danh sách tất cả sản phẩm (có pagination, tìm kiếm và filter)
  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      // Lấy pagination parameters từ query string
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;

      // Lấy các filter từ query string
      const search = (req.query.search as string) || undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const sortBy = (req.query.sortBy as string) || "latest"; // latest, price_asc, price_desc, popular

      // Gọi service để lấy danh sách sản phẩm
      const result = await productService.listProducts({
        skip,
        take: limit,
        search: search || undefined,
        categoryId,
        sortBy,
      });

      res.json({
        message: "Lấy danh sách sản phẩm thành công",
        data: result.products,
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

  // Lấy chi tiết một sản phẩm theo ID
  async getProductDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;

      // Validate product ID
      if (!productId || isNaN(parseInt(productId))) {
        throw new HttpError(400, "ID sản phẩm không hợp lệ", "VALIDATION_ERROR");
      }

      // Gọi service để lấy chi tiết sản phẩm
      const product = await productService.getProductById(parseInt(productId));

      res.json({
        message: "Lấy chi tiết sản phẩm thành công",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Tạo sản phẩm mới
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      // Lấy dữ liệu từ request body
      const { name, desc, price, stock, categoryId, image } = req.body;

      // Validate dữ liệu đầu vào bắt buộc
      if (!name || !price || !categoryId) {
        throw new HttpError(
          400,
          "Vui lòng cung cấp: name, price, categoryId",
          "VALIDATION_ERROR"
        );
      }

      // Validate kiến type
      if (typeof price !== "number" || price < 0) {
        throw new HttpError(400, "Giá phải là số dương", "VALIDATION_ERROR");
      }

      if (stock && (typeof stock !== "number" || stock < 0)) {
        throw new HttpError(400, "Số lượng phải là số >= 0", "VALIDATION_ERROR");
      }

      // Gọi service để tạo sản phẩm
      const product = await productService.createProduct({
        name,
        desc,
        price,
        stock: stock || 0,
        categoryId,
        image,
      });

      res.status(201).json({
        message: "Tạo sản phẩm thành công",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Cập nhật sản phẩm
  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const { name, desc, price, stock, image } = req.body;

      // Validate product ID
      if (!productId || isNaN(parseInt(productId))) {
        throw new HttpError(400, "ID sản phẩm không hợp lệ", "VALIDATION_ERROR");
      }

      // Validate dữ liệu
      if (price && (typeof price !== "number" || price < 0)) {
        throw new HttpError(400, "Giá phải là số dương", "VALIDATION_ERROR");
      }

      // Gọi service để cập nhật sản phẩm
      const product = await productService.updateProduct(parseInt(productId), {
        name,
        desc,
        price,
        stock,
        image,
      });

      res.json({
        message: "Cập nhật sản phẩm thành công",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Xóa sản phẩm
  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;

      // Validate product ID
      if (!productId || isNaN(parseInt(productId))) {
        throw new HttpError(400, "ID sản phẩm không hợp lệ", "VALIDATION_ERROR");
      }

      await productService.deleteProduct(parseInt(productId));

      res.json({
        message: "Xóa sản phẩm thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // Lấy danh sách danh mục sản phẩm
  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productService.listCategories();

      res.json({
        message: "Lấy danh mục sản phẩm thành công",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },
};
