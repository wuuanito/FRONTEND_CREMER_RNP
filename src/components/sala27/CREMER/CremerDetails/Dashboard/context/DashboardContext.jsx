// src/components/Dashboard/context/DashboardContext.js
import React, { createContext, useState, useContext } from 'react';
import { format, subDays } from 'date-fns';

// Crear el contexto
const DashboardContext = createContext();

// Hook personalizado para usar el contexto
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard debe ser usado dentro de un DashboardProvider");
  }
  return context;
};

// Proveedor del contexto
export const DashboardProvider = ({ children }) => {
  // Estados compartidos
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeCards, setActiveCards] = useState({
    production: true,
    pauses: true,
    maintenance: true,
    cleaning: true
  });

  // Función para actualizar las fechas
  const updateDateRange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Función para alternar la visibilidad de las tarjetas
  const toggleCardVisibility = (cardKey) => {
    setActiveCards(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  // Función para entrar/salir en modo pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Función para cerrar notificaciones
  const closeNotification = () => {
    setNotification(null);
  };

  // Valores a compartir en el contexto
  const contextValue = {
    // Estados
    startDate,
    endDate,
    showFilters,
    autoRefresh,
    compactView,
    fullscreenMode,
    notification,
    activeCards,
    
    // Funciones
    setStartDate,
    setEndDate,
    setShowFilters,
    setAutoRefresh,
    setCompactView,
    setFullscreenMode,
    setNotification,
    updateDateRange,
    toggleCardVisibility,
    toggleFullscreen,
    closeNotification
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};