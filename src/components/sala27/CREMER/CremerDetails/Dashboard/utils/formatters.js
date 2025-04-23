// src/components/Dashboard/utils/formatters.js
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para formatear fechas
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
};

// Función para formatear porcentajes
export const formatPercentage = (value) => {
  if (typeof value === 'string') {
    return `${parseFloat(value).toFixed(2)}%`;
  }
  return `${value.toFixed(2)}%`;
};

// Función para formatear tiempo en ms
export const formatTime = (ms) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  result += `${seconds}s`;
  
  return result;
};

// Obtener la fecha y hora actual formateada
export const getCurrentDateTime = () => {
  return format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es });
};