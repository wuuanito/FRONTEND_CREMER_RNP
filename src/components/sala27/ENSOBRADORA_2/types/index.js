// File: src/types/index.js

/**
 * @typedef {Object} ManufacturingOrderList
 * @property {number} total - Total de órdenes disponibles
 * @property {number} limit - Límite de órdenes por página
 * @property {number} offset - Desplazamiento para paginación
 * @property {ManufacturingOrderSummary[]} orders - Lista de órdenes
 */

/**
 * @typedef {Object} ManufacturingOrderSummary
 * @property {number} id - ID de la orden en la tabla de órdenes de fabricación
 * @property {number} order_id - ID de la orden general
 * @property {string} order_code - Código de orden
 * @property {string} status - Estado de la orden
 * @property {string} article_code - Código del artículo
 * @property {string} description - Descripción del artículo
 * @property {number} quantity - Cantidad a producir
 * @property {Object} produced - Datos de producción
 * @property {number} produced.good_units - Unidades buenas producidas
 * @property {number} produced.defective_units - Unidades defectuosas producidas
 * @property {number} produced.total - Total de unidades producidas
 * @property {number} produced.completion_percentage - Porcentaje de completado
 * @property {Object} time - Datos de tiempo
 * @property {string} time.start_time - Hora de inicio
 * @property {string} time.end_time - Hora de fin
 * @property {string} time.created_at - Fecha de creación
 * @property {string} time.updated_at - Fecha de última actualización
 */

/**
 * @typedef {Object} CleaningOrderList
 * @property {number} total - Total de órdenes disponibles
 * @property {number} limit - Límite de órdenes por página
 * @property {number} offset - Desplazamiento para paginación
 * @property {CleaningOrderSummary[]} orders - Lista de órdenes
 */

/**
 * @typedef {Object} CleaningOrderSummary
 * @property {number} id - ID de la orden en la tabla de órdenes de limpieza
 * @property {number} order_id - ID de la orden general
 * @property {string} order_code - Código de orden
 * @property {string} status - Estado de la orden
 * @property {string} cleaning_type - Tipo de limpieza
 * @property {string} area_id - ID del área
 * @property {string} area_name - Nombre del área
 * @property {string} description - Descripción de la limpieza
 * @property {number|null} associated_manufacturing_order_id - ID de orden de fabricación asociada
 * @property {string|null} operator_name - Nombre del operador
 * @property {boolean} completed - Indica si está completada
 * @property {number} estimated_duration_minutes - Duración estimada en minutos
 * @property {Object} time - Datos de tiempo
 * @property {string} time.start_time - Hora de inicio
 * @property {string} time.end_time - Hora de fin
 * @property {string} time.created_at - Fecha de creación
 * @property {string} time.updated_at - Fecha de última actualización
 * @property {number} time.duration - Duración real en ms
 */

/**
 * @typedef {Object} ManufacturingOrderDetail
 * @property {Object} order - Datos generales de la orden
 * @property {number} order.id - ID de la orden
 * @property {string} order.order_code - Código de orden
 * @property {string} order.type - Tipo de orden
 * @property {string} order.status - Estado de la orden
 * @property {string} order.start_time - Hora de inicio
 * @property {string} order.end_time - Hora de fin
 * @property {string} order.created_at - Fecha de creación
 * @property {string} order.updated_at - Fecha de última actualización
 * @property {string|null} order.notes - Notas de la orden
 * @property {Object} manufacturing_order - Datos específicos de la orden de fabricación
 * @property {number} manufacturing_order.id - ID de la orden de fabricación
 * @property {string} manufacturing_order.article_code - Código del artículo
 * @property {string} manufacturing_order.description - Descripción del artículo
 * @property {number} manufacturing_order.quantity - Cantidad a producir
 * @property {number} manufacturing_order.target_production_rate - Tasa de producción objetivo
 * @property {number} manufacturing_order.good_units - Unidades buenas producidas
 * @property {number} manufacturing_order.defective_units - Unidades defectuosas producidas
 * @property {number} manufacturing_order.total_produced - Total de unidades producidas
 * @property {number} manufacturing_order.completion_percentage - Porcentaje de completado
 * @property {Object} time_stats - Estadísticas de tiempo
 * @property {number} time_stats.total_duration - Duración total en ms
 * @property {number} time_stats.total_pause_time - Tiempo total de pausa en ms
 * @property {number} time_stats.effective_production_time - Tiempo efectivo de producción en ms
 * @property {Array} pauses - Lista de pausas en la producción
 * @property {number} pauses[].id - ID de la pausa
 * @property {string} pauses[].reason - Motivo de la pausa
 * @property {string} pauses[].start_time - Hora de inicio
 * @property {string} pauses[].end_time - Hora de fin
 * @property {number} pauses[].duration_ms - Duración en ms
 * @property {number} pauses[].duration_minutes - Duración en minutos
 * @property {string} pauses[].comments - Comentarios sobre la pausa
 * @property {Array} recent_production_entries - Entradas recientes de producción
 */

/**
 * @typedef {Object} CleaningOrderDetail
 * @property {Object} order - Datos generales de la orden
 * @property {number} order.id - ID de la orden
 * @property {string} order.order_code - Código de orden
 * @property {string} order.type - Tipo de orden
 * @property {string} order.status - Estado de la orden
 * @property {string} order.start_time - Hora de inicio
 * @property {string} order.end_time - Hora de fin
 * @property {string} order.created_at - Fecha de creación
 * @property {string} order.updated_at - Fecha de última actualización
 * @property {string|null} order.notes - Notas de la orden
 * @property {Object} cleaning_order - Datos específicos de la orden de limpieza
 * @property {number} cleaning_order.id - ID de la orden de limpieza
 * @property {string} cleaning_order.cleaning_type - Tipo de limpieza
 * @property {string} cleaning_order.area_id - ID del área
 * @property {string} cleaning_order.area_name - Nombre del área
 * @property {string} cleaning_order.description - Descripción de la limpieza
 * @property {string|null} cleaning_order.operator_id - ID del operador
 * @property {string|null} cleaning_order.operator_name - Nombre del operador
 * @property {number} cleaning_order.estimated_duration_minutes - Duración estimada en minutos
 * @property {boolean} cleaning_order.completed - Indica si está completada
 * @property {string|null} cleaning_order.completion_notes - Notas de finalización
 * @property {string|null} cleaning_order.products_used - Productos utilizados
 * @property {Object|null} associated_manufacturing_order - Datos de orden de fabricación asociada
 * @property {Object} time_stats - Estadísticas de tiempo
 * @property {number} time_stats.duration_ms - Duración en ms
 * @property {number} time_stats.duration_minutes - Duración en minutos
 * @property {number} time_stats.estimated_vs_actual - Relación entre tiempo estimado y real
 */

/**
 * @typedef {Object} ReportType
 * @property {string} id - Identificador del tipo de reporte
 * @property {string} name - Nombre descriptivo del reporte
 */

/**
 * @typedef {Object} Notification
 * @property {string} id - Identificador único de la notificación
 * @property {'manufacturing'|'cleaning'} type - Tipo de notificación
 * @property {string} order_code - Código de la orden asociada
 * @property {string} status - Estado nuevo de la orden
 * @property {string} message - Mensaje descriptivo
 * @property {Date} timestamp - Fecha y hora de la notificación
 * @property {boolean} read - Indica si ha sido leída
 */

// Exportaciones de objetos vacíos para que sean importables en JavaScript
export const ManufacturingOrderList = {};
export const ManufacturingOrderSummary = {};
export const CleaningOrderList = {};
export const CleaningOrderSummary = {};
export const ManufacturingOrderDetail = {};
export const CleaningOrderDetail = {};
export const ReportType = {};
export const Notification = {};

// Exportación por defecto
export default {
  ManufacturingOrderList,
  ManufacturingOrderSummary,
  CleaningOrderList,
  CleaningOrderSummary,
  ManufacturingOrderDetail,
  CleaningOrderDetail,
  ReportType,
  Notification
};