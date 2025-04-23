// File: src/utils/dateUtils.js
import { format, parseISO, differenceInMilliseconds, addDays, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha para mostrarla en la interfaz de usuario
 * @param {string|Date|null} date - Fecha a formatear (string ISO, objeto Date o null)
 * @param {string} formatStr - Formato de salida (por defecto: dd/MM/yyyy HH:mm:ss)
 * @returns {string} Fecha formateada o 'N/A' si es null
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy HH:mm:ss') => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Fecha inválida';
    }
    
    return format(dateObj, formatStr, { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error en fecha';
  }
};

/**
 * Calcula la diferencia en milisegundos entre dos fechas
 * @param {string|Date} startDate - Fecha de inicio
 * @param {string|Date} endDate - Fecha de fin
 * @returns {number} Diferencia en milisegundos o 0 si hay error
 */
export const getDateDifference = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) {
      return 0;
    }
    
    return differenceInMilliseconds(end, start);
  } catch (error) {
    console.error('Error al calcular diferencia de fechas:', error);
    return 0;
  }
};

/**
 * Formatea un tiempo en milisegundos a formato legible de horas, minutos y segundos
 * @param {number} timeInMs - Tiempo en milisegundos
 * @param {boolean} includeSeconds - Si se incluyen los segundos en el formato
 * @returns {string} Tiempo formateado
 */
export const formatTimeInMinutes = (timeInMs, includeSeconds = true) => {
  if (!timeInMs || isNaN(timeInMs) || timeInMs < 0) {
    return '0m';
  }
  
  const hours = Math.floor(timeInMs / 3600000);
  const minutes = Math.floor((timeInMs % 3600000) / 60000);
  const seconds = Math.floor((timeInMs % 60000) / 1000);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  if (includeSeconds && (seconds > 0 || (hours === 0 && minutes === 0))) {
    result += `${seconds}s`;
  }
  
  return result.trim();
};

/**
 * Obtiene la fecha actual formateada
 * @param {string} formatStr - Formato de salida (por defecto: dd/MM/yyyy HH:mm:ss)
 * @returns {string} Fecha actual formateada
 */
export const getCurrentFormattedDate = (formatStr = 'dd/MM/yyyy HH:mm:ss') => {
  return format(new Date(), formatStr, { locale: es });
};

/**
 * Calcula una fecha futura o pasada a partir de la fecha actual
 * @param {number} days - Número de días a añadir (positivo) o restar (negativo)
 * @param {string} formatStr - Formato de salida (por defecto: dd/MM/yyyy)
 * @returns {string} Fecha calculada formateada
 */
export const getRelativeDate = (days, formatStr = 'dd/MM/yyyy') => {
  const date = addDays(new Date(), days);
  return format(date, formatStr, { locale: es });
};

/**
 * Comprueba si una cadena es una fecha válida en formato ISO
 * @param {string} dateString - Cadena a comprobar
 * @returns {boolean} true si es una fecha válida
 */
export const isValidISODateString = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch (error) {
    return false;
  }
};

export default {
  formatDate,
  getDateDifference,
  formatTimeInMinutes,
  getCurrentFormattedDate,
  getRelativeDate,
  isValidISODateString
};