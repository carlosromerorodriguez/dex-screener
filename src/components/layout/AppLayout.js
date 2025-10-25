// src/components/layout/AppLayout.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./LeftSidebar";
import SearchModal from "../modals/SearchModal";

/**
 * AppLayout - Layout global persistente para MINOTAURION
 * 
 * Este componente envuelve todas las rutas y asegura que el sidebar
 * izquierdo sea visible en todas las páginas sin cortarse.
 */
const AppLayout = () => {
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);

  console.log("AppLayout mounted - MINOTAURION ⚡");

  return (
    <div className="min-h-screen bg-dex-bg-primary text-dex-text-primary">
      <div className="flex min-h-screen">
        {/* Sidebar fijo - ancho constante, sticky, sin shrink */}
        <aside
          className="w-64 flex-shrink-0 border-r border-dex-border bg-dex-bg-secondary sticky top-0 h-screen overflow-y-auto z-20"
          data-testid="minotaurion-sidebar"
        >
          <LeftSidebar openSearchModal={() => setSearchModalOpen(true)} />
        </aside>

        {/* Contenido principal - flex-1, sin scroll horizontal */}
        <main
          className="flex-1 min-w-0 overflow-x-hidden bg-dex-bg-primary"
          data-testid="minotaurion-content"
        >
          <Outlet />
        </main>
      </div>

      {/* Modal de búsqueda global */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;

