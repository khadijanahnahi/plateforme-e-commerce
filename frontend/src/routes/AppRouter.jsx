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
import AdminSupportMessagesPage from "../pages/AdminSupportMessagesPage";
import AdminReturnRequestsPage from "../pages/AdminReturnRequestsPage";
import AboutPage from "../pages/AboutPage";
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
import ProfileInformationPage from "../pages/ProfileInformationPage";
import ProfileOverviewPage from "../pages/ProfileOverviewPage";
import ProfileSecurityPage from "../pages/ProfileSecurityPage";
import RegisterPage from "../pages/RegisterPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ReturnPolicyPage from "../pages/ReturnPolicyPage";
import SupportPage from "../pages/SupportPage";
import TermsPage from "../pages/TermsPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ServerErrorPage from "../pages/ServerErrorPage";
import WishlistPage from "../pages/WishlistPage";

const AdminDashboardPage = lazy(() => import("../pages/AdminDashboardPage"));
const BlogPage = lazy(() => import("../pages/BlogPage"));
const BlogPostPage = lazy(() => import("../pages/BlogPostPage"));
const AdminBlogPostsPage = lazy(() => import("../pages/AdminBlogPostsPage"));
const AdminBlogEditorPage = lazy(() => import("../pages/AdminBlogEditorPage"));
const AdminBlogCategoriesPage = lazy(() => import("../pages/AdminBlogCategoriesPage"));
const AdminBlogTagsPage = lazy(() => import("../pages/AdminBlogTagsPage"));

function LazyPage({ children }) {
  return <Suspense fallback={<div className="dashboard-route-loading">Chargement...</div>}>{children}</Suspense>;
}

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
        <Route path="/profile" element={<ProfilePage />}>
          <Route index element={<ProfileOverviewPage />} />
          <Route path="informations" element={<ProfileInformationPage />} />
          <Route path="security" element={<ProfileSecurityPage />} />
        </Route>
        <Route path="/support" element={<SupportPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<LazyPage><BlogPage /></LazyPage>} />
        <Route path="/blog/:slug" element={<LazyPage><BlogPostPage /></LazyPage>} />
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
          <Route path="/admin/support-messages" element={<AdminSupportMessagesPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
          <Route path="/admin/return-requests" element={<AdminReturnRequestsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/blog/posts" element={<LazyPage><AdminBlogPostsPage /></LazyPage>} />
          <Route path="/admin/blog/posts/new" element={<LazyPage><AdminBlogEditorPage /></LazyPage>} />
          <Route path="/admin/blog/posts/:id/edit" element={<LazyPage><AdminBlogEditorPage /></LazyPage>} />
          <Route path="/admin/blog/categories" element={<LazyPage><AdminBlogCategoriesPage /></LazyPage>} />
          <Route path="/admin/blog/tags" element={<LazyPage><AdminBlogTagsPage /></LazyPage>} />
        </Route>
      </Route>
    </Routes>
  );
}
