import { Router } from "express";
import { gatewayController } from "../controllers/gateway.controller";
import { authRouter } from "./auth.routes";
import userRouter from "./user.routes";
import productRouter from "./product.routes";
import cartRouter from "./cart.routes";
import orderRouter from "./order.routes";

export const apiGatewayRouter = Router();

apiGatewayRouter.get("/gateway/health", gatewayController.health);
apiGatewayRouter.get("/gateway/metrics", gatewayController.metrics);

apiGatewayRouter.use("/auth", authRouter);
apiGatewayRouter.use("/users", userRouter);
apiGatewayRouter.use("/products", productRouter);
apiGatewayRouter.use("/cart", cartRouter);
apiGatewayRouter.use("/orders", orderRouter);
