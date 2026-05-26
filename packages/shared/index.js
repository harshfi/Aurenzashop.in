export const CATEGORY_LIST = [
  "sarees",
  "lehengas",
  "kurtas-kurta-sets",
  "gowns",
  "fusion-wear",
  "dupattas-accessories",
  "seasonal-special",
  "ethnic-wear",
  "festive-collection",
  "accessories",
  "mens-ethnic"
];

export const ORDER_STATUSES = {
  PLACED: "placed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUSES);

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded"
};

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUSES);

export const PAYMENT_METHOD_LIST = ["razorpay", "cod"];
