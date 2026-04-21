import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/rbac.middleware";

// Routes quản lý sản phẩm
const productRouter = Router();

// Public routes - không cần xác thực
productRouter.get("/", productController.listProducts);
productRouter.get("/categories", productController.listCategories);
productRouter.get("/:productId", productController.getProductDetail);

// Admin routes - chỉ admin mới được phép
productRouter.post(
  "/",
  requireAuth,
  requireRoles("ADMIN"),
  productController.createProduct
);
productRouter.put(
  "/:productId",
  requireAuth,
  requireRoles("ADMIN"),
  productController.updateProduct
);
productRouter.delete(
  "/:productId",
  requireAuth,
  requireRoles("ADMIN"),
  productController.deleteProduct
);

export default productRouter;
