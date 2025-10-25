import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import TrendingPage from "./pages/TrendingPage";
import TokenPage from "./pages/TokenPage";
import PortfolioPage from "./pages/PortfolioPage";
import PumpFunPage from "./pages/PumpFunPage";

/**
 * App - Componente raíz de MINOTAURION ⚡
 * 
 * Todas las rutas están envueltas en AppLayout para mantener
 * el sidebar persistente en todas las páginas.
 */
const App = () => {
  return (
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
          
          {/* Fallback: redirigir a trending */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
