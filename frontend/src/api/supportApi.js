import http from "./http";

export const supportApi = {
  createMessage(payload) {
    return http.post("/support-messages", payload);
  },
};

export function getSupportApiError(exception, fallback = "Impossible d'envoyer le message.") {
  return exception.response?.data?.message ?? exception.message ?? fallback;
}
