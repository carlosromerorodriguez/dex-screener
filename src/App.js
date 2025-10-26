import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import TrendingPage from "./pages/TrendingPage";
import TokenPage from "./pages/TokenPage";
import PortfolioPage from "./pages/PortfolioPage";
import PumpFunPage from "./pages/PumpFunPage";
import ProfilePage from "./pages/ProfilePage.tsx";
import ProtectedRoute from "./routes/ProtectedRoute.tsx";
import AuthModalV2 from "./components/auth/AuthModalV2.tsx";
import ErrorBoundary from "./components/common/ErrorBoundary.tsx";
import { ToastProvider } from "./components/common/Toaster.tsx";
import { MinotaurionWalletProvider } from "./wallet/WalletProvider.tsx";

/**
 * App - Componente raíz de MINOTAURION ⚡
 * 
 * SEMANA 2.5: Wallet integration con SIWS
 */
const App = () => {
  return (
    <ErrorBoundary>
      <MinotaurionWalletProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<TrendingPage />} />
                <Route path="/:chainId" element={<TrendingPage />} />
                <Route path="/:chainId/:tokenAddress" element={<TokenPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/pumpfun" element={<PumpFunPage />} />
                <Route path="/me" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/u/:username" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            <AuthModalV2 />
          </Router>
        </ToastProvider>
      </MinotaurionWalletProvider>
    </ErrorBoundary>
  );
};

export default App;
