import { Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import CartPage from "../pages/CartPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import OrdersPage from "../pages/OrdersPage";
import ProductDetailsPage from "../pages/ProductDetailsPage";
import RegisterPage from "../pages/RegisterPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Route>
    </Routes>
  );
}
