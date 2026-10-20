import { useEffect } from "react";
import { queryClient } from "../api/queryClient";
import { streamMyOrderUpdates } from "../api/orderApi";
import { applyOrderUpdate, publishClientOrderUpdate } from "../events/clientOrderRealtime";

export function useClientOrderRealtime(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;

    let stopped = false;
    let retryTimer;
    let controller;

    async function connect() {
      controller = new AbortController();
      try {
        await streamMyOrderUpdates({
          signal: controller.signal,
          onUpdate: (update) => {
            queryClient.setQueryData(["orders", "mine"], (orders) => (
              Array.isArray(orders) ? orders.map((order) => applyOrderUpdate(order, update)) : orders
            ));
            publishClientOrderUpdate(update);
          },
        });
      } catch (error) {
        if (stopped || error.name === "AbortError" || error.status === 401 || error.status === 403) return;
      }
      if (!stopped) retryTimer = window.setTimeout(connect, 3000);
    }

    connect();
    return () => {
      stopped = true;
      controller?.abort();
      window.clearTimeout(retryTimer);
    };
  }, [enabled]);
}
