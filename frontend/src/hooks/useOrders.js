import { useEffect, useState } from "react";
import { orderApi } from "../api/orderApi";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const response = await orderApi.getMyOrders();
      setOrders(response.data);
      return response.data;
    } catch (exception) {
      const message = exception.response?.data?.message ?? "Impossible de charger les commandes.";
      setError(message);
      throw exception;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders().catch(() => undefined);
  }, []);

  return { orders, setOrders, loading, error, loadOrders };
}
