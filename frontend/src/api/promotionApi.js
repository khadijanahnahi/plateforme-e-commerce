import http from "./http";

export const promotionApi = {
  getFlashSale() {
    return http.get("/promotions/flash-sale");
  },

  getActivePromotions() {
    return http.get("/promotions/active");
  },
};
