import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import AdminOrderDetailsPage from "../pages/AdminOrderDetailsPage";
import ClientLayout from "../layouts/ClientLayout";
import AdminLayout from "../layouts/AdminLayout";
import AdminBannersPage from "../pages/AdminBannersPage";
import AdminCouponsPage from "../pages/AdminCouponsPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminProductsPage from "../pages/AdminProductsPage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";
import AdminReviewsPage from "../pages/AdminReviewsPage";
import AdminPromotionsPage from "../pages/AdminPromotionsPage";
import AdminCustomersPage from "../pages/AdminCustomersPage";
import AdminCustomerDetailsPage from "../pages/AdminCustomerDetailsPage";
import AdminSettingsPage from "../pages/AdminSettingsPage";
import AdminStockMovementsPage from "../pages/AdminStockMovementsPage";
import CategoriesPage from "../pages/CategoriesPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import OrdersPage from "../pages/OrdersPage";
import OrderDetailsPage from "../pages/OrderDetailsPage";
import OrderSuccessPage from "../pages/OrderSuccessPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import ProductDetailsPage from "../pages/ProductDetailsPage";
import ProductsPage from "../pages/ProductsPage";
import ProfilePage from "../pages/ProfilePage";
import RegisterPage from "../pages/RegisterPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ReturnPolicyPage from "../pages/ReturnPolicyPage";
import SupportPage from "../pages/SupportPage";
import TermsPage from "../pages/TermsPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ServerErrorPage from "../pages/ServerErrorPage";
import WishlistPage from "../pages/WishlistPage";

const AdminDashboardPage = lazy(() => import("../pages/AdminDashboardPage"));

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/dashboard"
            element={(
              <Suspense fallback={<div className="dashboard-route-loading">Chargement du tableau de bord...</div>}>
                <AdminDashboardPage />
              </Suspense>
            )}
          />
          <Route path="/admin/banners" element={<AdminBannersPage />} />
          <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/customers/:id" element={<AdminCustomerDetailsPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/stock-movements" element={<AdminStockMovementsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
