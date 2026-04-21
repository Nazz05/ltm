import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const requiredEnv = ["JWT_SECRET", "DATABASE_URL"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: parseNumber(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET as string,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  resetTokenTtl: process.env.RESET_TOKEN_TTL ?? "15m",
  trustProxy: parseNumber(process.env.TRUST_PROXY, 0),
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 120),
  enableClusterMode: parseBoolean(process.env.ENABLE_CLUSTER_MODE, false),
  clusterWorkers: parseNumber(process.env.CLUSTER_WORKERS, 1),
  vnpayTmnCode: process.env.VNPAY_TMN_CODE ?? "",
  vnpayHashSecret: process.env.VNPAY_HASH_SECRET ?? "",
  vnpayUrl: process.env.VNPAY_URL ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnpayReturnUrl: process.env.VNPAY_RETURN_URL ?? "",
  vnpayIpnUrl: process.env.VNPAY_IPN_URL ?? "",
  vnpayLocale: process.env.VNPAY_LOCALE ?? "vn",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  facebookClientId: process.env.FACEBOOK_CLIENT_ID ?? "",
  facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
  oauthRedirectUri: process.env.OAUTH_REDIRECT_URI ?? "",
};
