// src/components/Dashboard/hooks/useDashboardData.js
import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  fetchDashboardData, 
  fetchProductionData, 
  fetchPausesData, 
  fetchMaintenanceCleaningData 
} from '../../../services/api';

// Constante para el intervalo de auto-refresco
const AUTO_REFRESH_INTERVAL = 60000; // 60 segundos

export const useDashboardData = () => {
  const { 
    startDate, 
    endDate, 
    autoRefresh, 
    setNotification 
  } = useDashboard();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [pausesData, setPausesData] = useState(null);
  const [maintenanceCleaningData, setMaintenanceCleaningData] = useState(null);

  // Función para cargar todos los reportes
  const fetchAllReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargar datos del dashboard
      const dashboardResult = await fetchDashboardData();
      setDashboardData(dashboardResult);
      
      // Cargar datos de producción
      const productionResult = await fetchProductionData(startDate, endDate);
      setProductionData(productionResult);
      
      // Cargar datos de pausas
      const pausesResult = await fetchPausesData(startDate, endDate);
      setPausesData(pausesResult);
      
      // Cargar datos de mantenimiento y limpieza
      const maintenanceResult = await fetchMaintenanceCleaningData(startDate, endDate);
      setMaintenanceCleaningData(maintenanceResult);
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: 'Datos actualizados correctamente',
      });
    } catch (err) {
      setError(`Error al cargar reportes: ${err.message}`);
      console.error('Error al cargar reportes:', err);
      
      setNotification({
        type: 'error',
        message: `Error al cargar datos: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, setNotification]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchAllReports();
    
    // Comprobar si está en modo fullscreen
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        // Actualizar estado de pantalla completa si es necesario
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [fetchAllReports]);

  // Efecto para el auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAllReports();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllReports]);

  return {
    isLoading,
    error,
    dashboardData,
    productionData,
    pausesData,
    maintenanceCleaningData,
    fetchAllReports
  };
};