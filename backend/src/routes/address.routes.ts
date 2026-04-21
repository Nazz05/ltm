import { Router } from "express";
import { addressController } from "../controllers/address.controller";
import { requireAuth } from "../middlewares/auth.middleware";

// Routes quản lý địa chỉ
const addressRouter = Router();

// Protected routes - cần xác thực
addressRouter.get("/", requireAuth, addressController.listAddresses);
addressRouter.post("/", requireAuth, addressController.createAddress);
addressRouter.put("/:addressId", requireAuth, addressController.updateAddress);
addressRouter.delete("/:addressId", requireAuth, addressController.deleteAddress);
addressRouter.post("/:addressId/set-default", requireAuth, addressController.setDefaultAddress);

export default addressRouter;
