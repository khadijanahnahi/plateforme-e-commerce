import http from "./http";

export const couponApi = {
  getActivePublicCoupons() {
    return http.get("/coupons/public/active");
  },
};
