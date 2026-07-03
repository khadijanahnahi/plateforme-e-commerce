import { Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import AdminOrderDetailsPage from "../pages/AdminOrderDetailsPage";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminBannersPage from "../pages/AdminBannersPage";
import AdminCouponsPage from "../pages/AdminCouponsPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminProductsPage from "../pages/AdminProductsPage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";
import AdminReviewsPage from "../pages/AdminReviewsPage";
import AdminPromotionsPage from "../pages/AdminPromotionsPage";
import CategoriesPage from "../pages/CategoriesPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import OrdersPage from "../pages/OrdersPage";
import ProductDetailsPage from "../pages/ProductDetailsPage";
import ProductsPage from "../pages/ProductsPage";
import ProfilePage from "../pages/ProfilePage";
import RegisterPage from "../pages/RegisterPage";
import SupportPage from "../pages/SupportPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/banners" element={<AdminBannersPage />} />
          <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
