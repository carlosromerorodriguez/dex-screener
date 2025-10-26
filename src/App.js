import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import TrendingPage from "./pages/TrendingPage";
import TokenPage from "./pages/TokenPage";
import PortfolioPage from "./pages/PortfolioPage";
import PumpFunPage from "./pages/PumpFunPage";
import ProfilePage from "./pages/ProfilePage.tsx";
import ProtectedRoute from "./routes/ProtectedRoute.tsx";
import AuthModal from "./components/auth/AuthModal.tsx";
import ErrorBoundary from "./components/common/ErrorBoundary.tsx";
import { ToastProvider } from "./components/common/Toaster.tsx";

/**
 * App - Componente raíz de MINOTAURION ⚡
 * 
 * SEMANA 2: Añadido auth, perfiles y error handling
 */
const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Layout global que envuelve todas las rutas */}
            <Route element={<AppLayout />}>
              {/* Rutas principales */}
              <Route path="/" element={<TrendingPage />} />
              <Route path="/:chainId" element={<TrendingPage />} />
              <Route path="/:chainId/:tokenAddress" element={<TokenPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/pumpfun" element={<PumpFunPage />} />
              
              {/* Rutas de perfil */}
              <Route path="/me" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/u/:username" element={<ProfilePage />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>

          {/* Modal global de auth */}
          <AuthModal />
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
