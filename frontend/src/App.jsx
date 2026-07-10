import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { ToastProvider } from "./contexts/ToastContext";
import AppErrorBoundary from "./components/errors/AppErrorBoundary";

export default function App() {
  return (
    <ToastProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <AppRouter />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </ToastProvider>
  );
}
