import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import addressRouter from "./routes/address.routes";
import cartRouter from "./routes/cart.routes";
import orderRouter from "./routes/order.routes";
import paymentRouter from "./routes/payment.routes";
import productRouter from "./routes/product.routes";
import userRouter from "./routes/user.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { createRateLimiter } from "./middlewares/rate-limit.middleware";
import { assignRequestContext } from "./middlewares/request-context.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";

export const app = express();

const apiRateLimiter = createRateLimiter({
  windowMs: env.rateLimitWindowMs,
  maxRequests: env.rateLimitMax,
  keyPrefix: "api",
});

if (env.trustProxy > 0) {
  app.set("trust proxy", env.trustProxy);
}

// Middleware nền: cho phép CORS và parse JSON body.
app.use(cors());
app.use(express.json());
app.use(assignRequestContext);
app.use(requestLogger);

// Health check đơn giản để kiểm tra service còn sống.
app.get("/", (_req, res) => {
  res.status(200).json({
    service: "LTWNC Backend",
    status: "ok",
  });
});

// Áp rate-limit chung cho toàn bộ API trước khi vào router chi tiết.
app.use("/api", apiRateLimiter);

// Mount toàn bộ route dưới prefix /api/*.
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", adminRouter);

// Bất kỳ route nào không match sẽ trả 404 để test dễ hơn.
app.use(notFoundHandler);

// Middleware bắt lỗi luôn đặt cuối pipeline.
app.use(errorHandler);
