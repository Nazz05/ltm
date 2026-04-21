import crypto from "crypto";
import { env } from "../config/env";
import { prisma } from "../models/prisma";
import { HttpError } from "../utils/http-error";

type PaymentStatus = "PENDING" | "PAID" | "FAILED";

type VnpayCallbackResult = {
  success: boolean;
  code: string;
  message: string;
  orderId?: number;
  paymentStatus?: PaymentStatus;
  transactionId?: string;
};

const formatDateGMT7 = (date: Date) => {
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const yyyy = gmt7.getUTCFullYear();
  const mm = String(gmt7.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(gmt7.getUTCDate()).padStart(2, "0");
  const hh = String(gmt7.getUTCHours()).padStart(2, "0");
  const mi = String(gmt7.getUTCMinutes()).padStart(2, "0");
  const ss = String(gmt7.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
};

const encodeRFC3986 = (value: string) =>
  encodeURIComponent(value).replace(/%20/g, "+");

const buildSortedQuery = (input: Record<string, string>) => {
  return Object.keys(input)
    .sort()
    .map((key) => `${encodeRFC3986(key)}=${encodeRFC3986(input[key] ?? "")}`)
    .join("&");
};

const signVnpayData = (data: string) => {
  return crypto
    .createHmac("sha512", env.vnpayHashSecret)
    .update(Buffer.from(data, "utf-8"))
    .digest("hex");
};

const normalizePaymentStatus = (status: string | null | undefined): PaymentStatus => {
  const normalized = (status ?? "PENDING").toUpperCase();
  if (normalized === "PAID") return "PAID";
  if (normalized === "FAILED") return "FAILED";
  return "PENDING";
};

const normalizePayment = (payment: {
  id: number;
  orderId: number;
  amount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  transactionId: string | null;
  responseCode: string | null;
  bankCode: string | null;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: payment.id,
  orderId: payment.orderId,
  amount: payment.amount,
  method: payment.paymentMethod,
  status: normalizePaymentStatus(payment.paymentStatus),
  transactionId: payment.transactionId,
  responseCode: payment.responseCode,
  bankCode: payment.bankCode,
  paidAt: payment.paidAt,
  notes: payment.notes,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const normalizeQueryParams = (params: Record<string, string>) => {
  const copy: Record<string, string> = { ...params };
  delete copy.vnp_SecureHash;
  delete copy.vnp_SecureHashType;
  return copy;
};

const parseOrderIdFromTxnRef = (txnRef: string | null) => {
  if (!txnRef) {
    return null;
  }

  const raw = txnRef.split("_")[0] ?? "";
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

const validateVnpayConfig = () => {
  if (!env.vnpayTmnCode || !env.vnpayHashSecret || !env.vnpayReturnUrl || !env.vnpayIpnUrl) {
    throw new HttpError(
      500,
      "Thiếu cấu hình VNPAY. Cần VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_RETURN_URL, VNPAY_IPN_URL",
      "INTERNAL_ERROR"
    );
  }
};

// Service quản lý thanh toán
export const paymentService = {
  // Lấy danh sách phương thức thanh toán
  async getPaymentMethods() {
    const methods = await prisma.paymentMethod.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return methods;
  },

  // Lấy danh sách thanh toán của người dùng
  async listPaymentsByUser(userId: number, skip: number, take: number) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          order: {
            userId,
            deletedAt: null,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.payment.count({
        where: {
          order: {
            userId,
            deletedAt: null,
          },
        },
      }),
    ]);

    return {
      payments: payments.map(normalizePayment),
      total,
    };
  },

  // Tạo thanh toán mới
  async createPayment(
    userId: number,
    data: {
      orderId: number;
      methodCode: string;
      amount: number;
    }
  ) {
    // Kiểm tra order có tồn tại và thuộc về user không
    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        userId,
        deletedAt: null,
      },
    });

    if (!order) {
      throw new HttpError(404, "Đơn hàng không tồn tại", "NOT_FOUND");
    }

    // Kiểm tra phương thức thanh toán có hợp lệ không
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        code: data.methodCode,
        isActive: true,
      },
    });

    if (!paymentMethod) {
      throw new HttpError(400, "Phương thức thanh toán không hợp lệ", "VALIDATION_ERROR");
    }

    // Kiểm tra số tiền thanh toán có khớp không
    if (data.amount !== order.totalPrice) {
      throw new HttpError(
        400,
        `Số tiền thanh toán không khớp. Yêu cầu: ${order.totalPrice}, nhận: ${data.amount}`,
        "VALIDATION_ERROR"
      );
    }

    const payment = await prisma.payment.upsert({
      where: { orderId: data.orderId },
      update: {
        amount: data.amount,
        paymentMethod: data.methodCode,
        paymentStatus: "PENDING",
        responseCode: null,
        paidAt: null,
      },
      create: {
        orderId: data.orderId,
        amount: data.amount,
        paymentMethod: data.methodCode,
        paymentStatus: "PENDING",
      },
    });

    return normalizePayment(payment);
  },

  // Lấy chi tiết thanh toán
  async getPaymentDetail(userId: number, paymentId: number) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!payment) {
      throw new HttpError(404, "Thanh toán không tồn tại", "NOT_FOUND");
    }

    return normalizePayment(payment);
  },

  // Admin: Lấy danh sách tất cả thanh toán
  async listAllPayments(skip: number, take: number) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          order: {
            select: {
              userId: true,
            },
          },
        },
      }),
      prisma.payment.count(),
    ]);

    return {
      payments: payments.map((payment) => ({
        ...normalizePayment(payment),
        userId: payment.order.userId,
      })),
      total,
    };
  },

  async createVnpayPaymentUrl(
    userId: number,
    data: {
      orderId: number;
      bankCode?: string;
      locale?: string;
      clientIp: string;
    }
  ) {
    validateVnpayConfig();

    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        userId,
        deletedAt: null,
      },
    });

    if (!order) {
      throw new HttpError(404, "Đơn hàng không tồn tại", "NOT_FOUND");
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (normalizePaymentStatus(existingPayment?.paymentStatus) === "PAID") {
      throw new HttpError(409, "Đơn hàng đã thanh toán", "CONFLICT");
    }

    const now = new Date();
    const expire = new Date(now.getTime() + 15 * 60 * 1000);
    const txnRef = `${order.id}_${Date.now()}`;
    const amount = Math.round(order.totalPrice * 100);

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        amount: order.totalPrice,
        paymentMethod: "VNPAY",
        paymentStatus: "PENDING",
        transactionId: txnRef,
        bankCode: data.bankCode ?? null,
        responseCode: null,
        paidAt: null,
        gatewayPayload: JSON.stringify({ stage: "INIT", createdAt: now.toISOString() }),
        notes: "VNPAY init",
      },
      create: {
        orderId: order.id,
        amount: order.totalPrice,
        paymentMethod: "VNPAY",
        paymentStatus: "PENDING",
        transactionId: txnRef,
        bankCode: data.bankCode ?? null,
        gatewayPayload: JSON.stringify({ stage: "INIT", createdAt: now.toISOString() }),
        notes: "VNPAY init",
      },
    });

    const vnpParams: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: env.vnpayTmnCode,
      vnp_Amount: String(amount),
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang #${order.id}`,
      vnp_OrderType: "other",
      vnp_Locale: data.locale ?? env.vnpayLocale,
      vnp_ReturnUrl: env.vnpayReturnUrl,
      vnp_IpAddr: data.clientIp,
      vnp_CreateDate: formatDateGMT7(now),
      vnp_ExpireDate: formatDateGMT7(expire),
    };

    if (data.bankCode) {
      vnpParams.vnp_BankCode = data.bankCode;
    }

    const signData = buildSortedQuery(vnpParams);
    const secureHash = signVnpayData(signData);
    const paymentUrl = `${env.vnpayUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    return {
      orderId: order.id,
      txnRef,
      amount: order.totalPrice,
      paymentUrl,
      expiredAt: expire.toISOString(),
    };
  },

  async handleVnpayCallback(params: Record<string, string>): Promise<VnpayCallbackResult> {
    validateVnpayConfig();

    const receivedHash = params.vnp_SecureHash;
    if (!receivedHash) {
      return { success: false, code: "97", message: "Missing secure hash" };
    }

    const normalized = normalizeQueryParams(params);
    const signData = buildSortedQuery(normalized);
    const expectedHash = signVnpayData(signData);

    if (expectedHash.toLowerCase() !== receivedHash.toLowerCase()) {
      return { success: false, code: "97", message: "Invalid signature" };
    }

    const txnRef = normalized.vnp_TxnRef ?? null;
    const responseCode = normalized.vnp_ResponseCode ?? "99";
    const transactionNo = normalized.vnp_TransactionNo ?? null;
    const bankCode = normalized.vnp_BankCode ?? null;
    const callbackTxnId = transactionNo ?? txnRef ?? "VNPAY_UNKNOWN_TXN";
    const amountFromGateway = Number(normalized.vnp_Amount ?? "0") / 100;

    let payment = await prisma.payment.findFirst({
      where: { transactionId: txnRef },
    });

    if (!payment) {
      const orderIdFromRef = parseOrderIdFromTxnRef(txnRef);
      if (!orderIdFromRef) {
        return { success: false, code: "01", message: "Payment not found" };
      }

      payment = await prisma.payment.findUnique({
        where: { orderId: orderIdFromRef },
      });
    }

    if (!payment) {
      return { success: false, code: "01", message: "Payment not found" };
    }

    if (Math.abs(payment.amount - amountFromGateway) > 0.001) {
      return { success: false, code: "04", message: "Invalid amount" };
    }

    const currentStatus = normalizePaymentStatus(payment.paymentStatus);
    if (currentStatus === "PAID") {
      return {
        success: true,
        code: "00",
        message: "Already confirmed",
        orderId: payment.orderId,
        paymentStatus: "PAID",
        transactionId: payment.transactionId ?? callbackTxnId,
      };
    }

    if (responseCode === "00") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: "PAID",
            transactionId: callbackTxnId,
            bankCode,
            responseCode,
            paidAt: new Date(),
            gatewayPayload: JSON.stringify(normalized),
            notes: "VNPAY callback success",
          },
        });

        await tx.order.updateMany({
          where: { id: payment.orderId, status: "PENDING" },
          data: { status: "CONFIRMED" },
        });

        await tx.auditLog.create({
          data: {
            userId: null,
            action: "payment_success",
            entity: "payment",
            entityId: payment.id,
            newValues: JSON.stringify({
              orderId: payment.orderId,
              transactionId: callbackTxnId,
              responseCode,
            }),
          },
        });
      });

      return {
        success: true,
        code: "00",
        message: "Payment success",
        orderId: payment.orderId,
        paymentStatus: "PAID",
        transactionId: callbackTxnId,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: "FAILED",
          transactionId: callbackTxnId,
          bankCode,
          responseCode,
          gatewayPayload: JSON.stringify(normalized),
          notes: "VNPAY callback failed",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: "payment_failed",
          entity: "payment",
          entityId: payment.id,
          newValues: JSON.stringify({
            orderId: payment.orderId,
            transactionId: callbackTxnId,
            responseCode,
          }),
        },
      });
    });

    return {
      success: false,
      code: responseCode,
      message: "Payment failed",
      orderId: payment.orderId,
      paymentStatus: "FAILED",
      transactionId: callbackTxnId,
    };
  },
};
