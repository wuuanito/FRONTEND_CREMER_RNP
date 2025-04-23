// src/services/api.js
import { 
    API_BASE_URL, 
    DASHBOARD_URL, 
    PRODUCTION_URL, 
    PAUSES_URL, 
    MAINTENANCE_CLEANING_URL 
  } from '../components/Dashboard/constants';
  
  // Función genérica para manejar las respuestas fetch
  const handleResponse = async (response) => {
    if (!response.ok) {
      throw new Error(`Error en la respuesta: ${response.status}`);
    }
    return await response.json();
  };
  
  // Función para manejar errores
  const handleError = (error, context) => {
    console.error(`Error al cargar ${context}:`, error);
    throw error;
  };
  
  // Función para obtener datos del dashboard principal
  export const fetchDashboardData = async () => {
    try {
      const response = await fetch(DASHBOARD_URL);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error, 'dashboard');
    }
  };
  
  // Función para obtener datos de producción
  export const fetchProductionData = async (startDate, endDate) => {
    try {
      const url = `${PRODUCTION_URL}?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error, 'reporte de producción');
    }
  };
  
  // Función para obtener datos de pausas
  export const fetchPausesData = async (startDate, endDate) => {
    try {
      const url = `${PAUSES_URL}?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error, 'reporte de pausas');
    }
  };
  
  // Función para obtener datos de mantenimiento y limpieza
  export const fetchMaintenanceCleaningData = async (startDate, endDate) => {
    try {
      const url = `${MAINTENANCE_CLEANING_URL}?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error, 'reporte de mantenimiento y limpieza');
    }
  };