// src/components/Dashboard/constants.js
import { useTheme } from '@mui/material';

// API URLs
export const API_BASE_URL = 'http://192.168.11.25:3000/api';
export const DASHBOARD_URL = `${API_BASE_URL}/reports/dashboard`;
export const PRODUCTION_URL = `${API_BASE_URL}/reports/production`;
export const PAUSES_URL = `${API_BASE_URL}/reports/pauses`;
export const MAINTENANCE_CLEANING_URL = `${API_BASE_URL}/reports/maintenance-cleaning`;

// Constantes para configuración
export const AUTO_REFRESH_INTERVAL = 60000; // Refresco cada 60 segundos

// Colores para gráficos
export const useColors = () => {
  const theme = useTheme();
  
  return {
    good: theme.palette.success.main,
    defective: theme.palette.error.main,
    pause: theme.palette.warning.main,
    maintenance: theme.palette.info.main,
    cleaning: theme.palette.primary.main,
    production: '#4caf50',
    pieColors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff5722', '#673ab7', '#03a9f4', '#9c27b0'],
    areaColors: ['rgba(0, 136, 254, 0.7)', 'rgba(0, 196, 159, 0.7)', 'rgba(255, 187, 40, 0.7)', 'rgba(255, 128, 66, 0.7)'],
    gradients: {
      production: ['#00c853', '#1de9b6'],
      pauses: ['#ffab00', '#ff6d00'],
      maintenance: ['#2196f3', '#00b0ff'],
      cleaning: ['#6a1b9a', '#9c27b0'],
    }
  };
};