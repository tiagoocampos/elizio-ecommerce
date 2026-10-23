import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AdminRoute, ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/States";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import OrderDetail from "@/pages/OrderDetail";
import Orders from "@/pages/Orders";
import PaymentReturn from "@/pages/PaymentReturn";
import ProductDetail from "@/pages/ProductDetail";
import Products from "@/pages/Products";
import Register from "@/pages/Register";

// O painel admin é carregado sob demanda: o cliente da loja não baixa esse código.
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminHome = lazy(() => import("@/pages/admin/AdminHome"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("@/pages/admin/AdminProductForm"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/AdminOrderDetail"));
const AdminShipping = lazy(() => import("@/pages/admin/AdminShipping"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="produtos" element={<Products />} />
          <Route path="produto/:slug" element={<ProductDetail />} />
          <Route path="carrinho" element={<Cart />} />
          <Route path="entrar" element={<Login />} />
          <Route path="cadastrar" element={<Register />} />
          <Route path="payment/success" element={<PaymentReturn kind="success" />} />
          <Route path="payment/failure" element={<PaymentReturn kind="failure" />} />
          <Route path="payment/pending" element={<PaymentReturn kind="pending" />} />

          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="pedidos" element={<Orders />} />
            <Route path="pedidos/:orderId" element={<OrderDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="produtos/novo" element={<AdminProductForm />} />
            <Route path="produtos/:id" element={<AdminProductForm />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="pedidos/:orderId" element={<AdminOrderDetail />} />
            <Route path="frete" element={<AdminShipping />} />
            <Route path="categorias" element={<AdminCategories />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
