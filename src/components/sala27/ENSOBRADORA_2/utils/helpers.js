// File: src/utils/helpers.js
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha para mostrarla en la UI
 * @param {string|null} dateString - La fecha a formatear como string
 * @returns {string} La fecha formateada
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: es });
};

/**
 * Formatea tiempo en milisegundos a un formato legible de minutos y segundos
 * @param {number} timeInMs - Tiempo en milisegundos
 * @returns {string} Tiempo formateado en minutos y segundos
 */
export const formatTimeInMinutes = (timeInMs) => {
  const minutes = Math.floor(timeInMs / 60000);
  const seconds = Math.floor((timeInMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

/**
 * Obtiene el color del chip según el estado
 * @param {string} status - Estado de la orden
 * @returns {string} Nombre del color para el componente Chip
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'FINISHED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'PAUSED':
      return 'warning';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Obtiene el tooltip para una métrica específica
 * @param {string} metricName - Nombre de la métrica
 * @returns {string} Texto explicativo para el tooltip
 */
export const getMetricTooltip = (metricName) => {
  const tooltips = {
    // Fabricación
    'target_production_rate': 'Tasa de producción objetivo en unidades por minuto establecida para esta orden.',
    'good_units': 'Cantidad de unidades producidas correctamente, sin defectos.',
    'defective_units': 'Cantidad de unidades producidas con defectos o rechazadas por control de calidad.',
    'completion_percentage': 'Porcentaje de avance de la orden respecto a la cantidad total objetivo.',
    'total_duration': 'Tiempo total desde el inicio hasta el fin de la orden, incluyendo pausas.',
    'total_pause_time': 'Tiempo total acumulado de pausas durante la ejecución de la orden.',
    'effective_production_time': 'Tiempo de producción efectivo, excluyendo pausas y paradas.',
    
    // Eficiencia
    'actual_rate': 'Tasa de producción real alcanzada (unidades por hora).',
    'good_units_percentage': 'Porcentaje de unidades buenas respecto al total producido.',
    'defective_units_percentage': 'Porcentaje de unidades defectuosas respecto al total producido.',
    
    // Limpieza
    'estimated_duration_minutes': 'Tiempo estimado para completar la tarea de limpieza.',
    'estimated_vs_actual': 'Relación entre el tiempo estimado y el tiempo real empleado. Valores < 1 indican que tomó más tiempo del estimado.',
    
    // Pausas
    'reason': 'Motivo por el cual la producción fue parada temporalmente.',
    'duration_minutes': 'Duración de la pausa en minutos.'
  };
  
  return tooltips[metricName] || 'No hay información adicional disponible.';
};