export const CATEGORY_LIST = [
  "clothing",
  "wallpaper",
  "accessories"
];

export const ORDER_STATUSES = {
  PLACED: "placed",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  PACKED: "packed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUSES);

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded"
};

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUSES);

export const PAYMENT_METHODS = {
  PREPAID: "razorpay",
  COD: "cod"
};

export const PAYMENT_METHOD_LIST = Object.values(PAYMENT_METHODS);
