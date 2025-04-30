import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Paper, 
  CircularProgress, 
  Alert, 
  IconButton,
  Tooltip,
  Divider,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  DateRange as DateRangeIcon,
  HelpOutline as HelpIcon,
  FileDownload as DownloadIcon,
  Summarize as SummaryIcon,
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon,
  BarChart as ChartIcon,
  TableRows as TableViewIcon,
  ViewDay as GroupViewIcon,
  Calculate as CalculateIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getMetricTooltip } from '../../CREMER/utils/helpers';
import logoImg from '../../../../assets/logo.png';
import cremerLogo from '../../../../assets/logo.png'; // Asegúrate de que exista esta imagen

// API base URL
const API_BASE_URL = 'http://192.168.11.25:3000/api';

// Valores standard disponibles
const standardOptions = [
  { value: 2000, label: '2000 unidades/hora' },
  { value: 1500, label: '1500 unidades/hora' },
  { value: 1000, label: '1000 unidades/hora' }
];

// Tipos de reportes disponibles
const reportTypes = [
  { id: 'manufacturing_detailed', name: 'Fabricación Detallado' },
  { id: 'production_efficiency', name: 'Eficiencia de Producción' },
  { id: 'downtime_analysis', name: 'Análisis de Tiempos Muertos' },
  { id: 'summary_report', name: 'Reporte Resumen' },
  { id: 'oee_analysis', name: 'Análisis OEE' }
];

// Opciones de agrupación para reportes
const groupingOptions = [
  { id: 'none', name: 'Sin Agrupar' },
  { id: 'article_code', name: 'Por Artículo' },
  { id: 'status', name: 'Por Estado' },
  { id: 'date', name: 'Por Fecha' }
];

// Función para agrupar datos
const groupData = (data, groupBy) => {
  if (!data || !Array.isArray(data) || data.length === 0 || groupBy === 'none') {
    return { grouped: false, data };
  }

  const groupedData = {};
  
  data.forEach(item => {
    let groupKey;
    
    switch(groupBy) {
      case 'article_code':
        groupKey = item.article_code || 'Sin código';
        break;
      case 'status':
        groupKey = item.status || 'Desconocido';
        break;
      case 'date':
        if (item.start_time) {
          const date = new Date(item.start_time);
          groupKey = format(date, 'yyyy-MM-dd');
        } else {
          groupKey = 'Sin fecha';
        }
        break;
      default:
        groupKey = 'Todos';
    }
    
    if (!groupedData[groupKey]) {
      groupedData[groupKey] = [];
    }
    
    groupedData[groupKey].push(item);
  });
  
  return { 
    grouped: true, 
    groups: Object.keys(groupedData),
    data: groupedData
  };
};// Componente principal
const ReportsView = ({ selectedManufacturingOrder, fetchManufacturingOrderDetails }) => {
  const [manufacturingOrders, setManufacturingOrders] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState('manufacturing_detailed');
  const [selectedGrouping, setSelectedGrouping] = useState('none');
  const [selectedStandard, setSelectedStandard] = useState(2000);
  const [reportData, setReportData] = useState([]);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingBatchReports, setGeneratingBatchReports] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailedOrders, setDetailedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showStandardDialog, setShowStandardDialog] = useState(false);
  
  // Estado para filtros de fecha
  const [filterDates, setFilterDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // Estado para datos agrupados
  const [groupedData, setGroupedData] = useState({ grouped: false, data: [] });
  
  // Referencia para la tabla de vista previa
  const previewTableRef = useRef(null);
  
  // Cargar las órdenes al iniciar la vista
  useEffect(() => {
    fetchAllManufacturingOrders();
  }, []);
  
  // Efecto para actualizar órdenes filtradas cuando cambian las fechas o los pedidos originales
  useEffect(() => {
    if (!filterDates || !startDate || !endDate) {
      setFilteredOrders(manufacturingOrders || []);
      return;
    }
    
    const filteredByDate = filterOrdersByDate(manufacturingOrders, startDate, endDate);
    setFilteredOrders(filteredByDate);
  }, [filterDates, startDate, endDate, manufacturingOrders]);
  
  // Efecto para actualizar datos agrupados cuando cambia la agrupación o los datos
  useEffect(() => {
    const grouped = groupData(reportData, selectedGrouping);
    setGroupedData(grouped);
  }, [reportData, selectedGrouping]);
  
  // Función para manejar cambio de pestaña
  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Función para manejar el cambio de valor estándar
  const handleStandardChange = (event) => {
    setSelectedStandard(Number(event.target.value));
  };
  
  // Función para abrir el diálogo de selección de estándar
  const openStandardDialog = () => {
    setShowStandardDialog(true);
  };
  
  // Función para cerrar el diálogo de selección de estándar
  const closeStandardDialog = () => {
    setShowStandardDialog(false);
  };
  
  // Función para confirmar el estándar y generar el reporte
  const confirmStandardAndGenerateReport = () => {
    setShowStandardDialog(false);
    generateReport();
  };
  
  // Función para obtener todas las órdenes de fabricación
  const fetchAllManufacturingOrders = async () => {
    setLoading(true);
    setReportError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/manufacturing`);
      console.log('API Response:', response.data);
      
      if (response.data && response.data.orders) {
        setManufacturingOrders(response.data.orders);
        setFilteredOrders(response.data.orders);
        console.log(`Se cargaron ${response.data.orders.length} órdenes de fabricación`);
      } else {
        throw new Error('Respuesta inesperada del API');
      }
    } catch (error) {
      console.error('Error al obtener órdenes de fabricación:', error);
      setReportError(`Error al cargar órdenes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar los detalles de una orden específica
  const fetchOrderDetails = async (orderId) => {
    try {
      // Parece que la API espera el order_id y no el id
      // Verificamos primero qué propiedad usar
      const response = await axios.get(`${API_BASE_URL}/manufacturing/${orderId}`);
      console.log(`Detalles de orden ${orderId}:`, response.data);
      return response.data;
    } catch (error) {
      // Si falla con el id, intentemos con order_id si está disponible
      try {
        console.warn(`Error con ID ${orderId}, intentando con order_id...`);
        const orderToProcess = manufacturingOrders.find(o => o.id === orderId);
        if (orderToProcess && orderToProcess.order_id) {
          const response = await axios.get(`${API_BASE_URL}/manufacturing/${orderToProcess.order_id}`);
          console.log(`Detalles de orden con order_id ${orderToProcess.order_id}:`, response.data);
          return response.data;
        } else {
          throw new Error('No se pudo encontrar order_id correspondiente');
        }
      } catch (secondError) {
        console.error(`Error al obtener detalles de orden ${orderId}:`, secondError);
        
        // Si ambos métodos fallan, construir un objeto con los datos básicos que tenemos
        // para que el resto del código pueda seguir funcionando
        const orderBasicData = manufacturingOrders.find(o => o.id === orderId);
        if (orderBasicData) {
          console.warn('Generando datos básicos a partir de la lista de órdenes');
          return {
            order: {
              id: orderBasicData.id,
              order_code: orderBasicData.order_code,
              type: "MANUFACTURING",
              status: orderBasicData.status,
              start_time: orderBasicData.time?.start_time,
              end_time: orderBasicData.time?.end_time,
              created_at: orderBasicData.time?.created_at,
              updated_at: orderBasicData.time?.updated_at
            },
            manufacturing_order: {
              id: orderBasicData.id,
              article_code: orderBasicData.article_code,
              description: orderBasicData.description,
              quantity: orderBasicData.quantity,
              target_production_rate: 0,
              good_units: orderBasicData.produced?.good_units || 0,
              defective_units: orderBasicData.produced?.defective_units || 0,
              total_produced: orderBasicData.produced?.total || 0,
              completion_percentage: orderBasicData.produced?.completion_percentage || 0
            },
            time_stats: {
              total_duration: 0,
              total_pause_time: 0,
              effective_production_time: 0
            },
            pauses: []
          };
        }
        throw error;
      }
    }
  };
  
  // Función para cargar detalles de todas las órdenes necesarias para reportes
  const fetchAllOrderDetails = async () => {
    setLoading(true);
    setReportError(null);
    
    try {
      const ordersToProcess = filterDates ? filteredOrders : manufacturingOrders;
      
      if (!ordersToProcess || ordersToProcess.length === 0) {
        setReportError('No hay órdenes para procesar');
        setLoading(false);
        return [];
      }
      
      console.log(`Cargando detalles para ${ordersToProcess.length} órdenes...`);
      
      const detailedOrdersPromises = ordersToProcess.map(order => fetchOrderDetails(order.id));
      const fetchedDetails = await Promise.all(detailedOrdersPromises);
      
      console.log(`Se obtuvieron detalles para ${fetchedDetails.length} órdenes`);
      setDetailedOrders(fetchedDetails);
      
      return fetchedDetails;
    } catch (error) {
      console.error('Error al obtener detalles de órdenes:', error);
      setReportError(`Error al cargar detalles: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };// Función para filtrar órdenes por fecha
  const filterOrdersByDate = (orders, start, end) => {
    // Validación básica de parámetros
    if (!orders || !Array.isArray(orders) || orders.length === 0 || !start || !end) {
      console.log('Parámetros incompletos para filtrado de fechas');
      return orders || [];
    }
    
    try {
      // Crear objetos Date y validarlos
      const startDateTime = new Date(start);
      const endDateTime = new Date(end);
      
      // Validar que las fechas sean correctas
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error('Fechas inválidas para filtrado', { start, end });
        return orders;
      }
      
      // Ajustar horas para abarcar días completos
      startDateTime.setHours(0, 0, 0, 0);
      endDateTime.setHours(23, 59, 59, 999);
      
      console.log(`Filtrando órdenes entre ${startDateTime.toISOString()} y ${endDateTime.toISOString()}`);
      
      // Aplicar filtro con rangos de tiempo correctos
      return orders.filter(order => {
        if (!order || !order.time || !order.time.start_time) {
          return false;
        }
        
        try {
          const orderDate = new Date(order.time.start_time);
          
          // Validar que la fecha de la orden sea correcta
          if (isNaN(orderDate.getTime())) {
            console.warn('Fecha inválida en orden:', order.id, order.time.start_time);
            return false;
          }
          
          // Comparación correcta dentro del rango
          return orderDate >= startDateTime && orderDate <= endDateTime;
        } catch (error) {
          console.warn('Error al procesar fecha de orden:', order.id, error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error en filtrado por fecha:', error);
      return orders;
    }
  };

  // useEffect mejorado para aplicar el filtrado de fechas
  useEffect(() => {
    if (!filterDates) {
      console.log('Filtrado por fechas desactivado, mostrando todas las órdenes');
      setFilteredOrders(manufacturingOrders || []);
      return;
    }
    
    if (!startDate || !endDate) {
      console.log('Falta rango de fechas, mostrando todas las órdenes');
      setFilteredOrders(manufacturingOrders || []);
      return;
    }
    
    try {
      // Validar fechas antes de aplicar el filtro
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Formato de fecha inválido');
        setReportError('Error: Formato de fecha inválido');
        setFilteredOrders(manufacturingOrders || []);
        return;
      }
      
      // Validar que la fecha de inicio sea anterior a la fecha de fin
      if (start > end) {
        console.error('La fecha de inicio debe ser anterior a la fecha de fin');
        setReportError('Error: La fecha de inicio debe ser anterior a la fecha de fin');
        setFilteredOrders([]);
        return;
      }
      
      console.log('Aplicando filtro por fechas:', { startDate, endDate });
      const filteredByDate = filterOrdersByDate(manufacturingOrders, startDate, endDate);
      setFilteredOrders(filteredByDate);
      
      // Proporcionar feedback al usuario si no hay resultados
      if (filteredByDate.length === 0 && manufacturingOrders.length > 0) {
        setReportError('No se encontraron órdenes en el rango de fechas seleccionado');
      } else {
        // Limpiar error anterior si hay resultados
        setReportError(null);
      }
    } catch (error) {
      console.error('Error al aplicar filtro por fecha:', error);
      setReportError(`Error al aplicar filtro: ${error.message}`);
      setFilteredOrders(manufacturingOrders || []);
    }
  }, [filterDates, startDate, endDate, manufacturingOrders]);
  
  // Improved date handling in report generation
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle space-separated format
      let standardizedDate = dateString;
      if (typeof standardizedDate === 'string' && standardizedDate.includes(' ')) {
        standardizedDate = standardizedDate.replace(' ', 'T');
      }
      
      const date = new Date(standardizedDate);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      return format(date, 'dd/MM/yyyy HH:mm:ss');
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString;
    }
  };
  
  // Función para manejar cambios en el tipo de reporte
  const handleReportTypeChange = (event) => {
    setSelectedReportType(event.target.value);
    // Reset preview
    setShowReportPreview(false);
    setReportData([]);
  };
  
  // Función para manejar cambios en el tipo de agrupación
  const handleGroupingChange = (event) => {
    setSelectedGrouping(event.target.value);
  };
  
  const setDefaultDateRange = () => {
    // Establecer fecha fin como hoy
    const endDate = new Date();
    // Establecer fecha inicio como 30 días atrás
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Formatear fechas en formato YYYY-MM-DD
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  };
  
  // Función para activar filtro con valores predeterminados si es necesario
  const enableFilterWithDefaults = () => {
    // Si ya hay fechas seleccionadas, solo activar el filtro
    if (startDate && endDate) {
      setFilterDates(true);
      return;
    }
    
    // Si no hay fechas, establecer valores predeterminados
    const { startDate: defaultStart, endDate: defaultEnd } = setDefaultDateRange();
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setFilterDates(true);
  };
  
  // Función para limpiar filtros
  const resetFilters = () => {
    setFilterDates(false);
    setStartDate('');
    setEndDate('');
    setReportError(null);
  };// Función para generar el reporte
  const generateReport = async () => {
    if (!selectedManufacturingOrder) {
      setReportError('No hay una orden de fabricación seleccionada para generar el reporte');
      return;
    }
    
    // Si es un reporte de OEE y no se ha mostrado el diálogo de selección de estándar, mostrarlo
    if (selectedReportType === 'oee_analysis' && !showStandardDialog) {
      openStandardDialog();
      return;
    }
    
    setGeneratingReport(true);
    setReportError(null);
    setReportData([]);
    
    try {
      // Convertir la orden seleccionada al formato esperado por las funciones de reporte
      const formattedOrder = {
        order: selectedManufacturingOrder.order,
        manufacturing_order: selectedManufacturingOrder.manufacturing_order,
        time_stats: selectedManufacturingOrder.time_stats,
        pauses: selectedManufacturingOrder.pauses || []
      };
      
      let generatedData = [];
      
      // Generar datos específicos según el tipo de reporte
      if (selectedReportType === 'manufacturing_detailed') {
        generatedData = generateManufacturingDetailedReport(formattedOrder);
      } else if (selectedReportType === 'downtime_analysis') {
        generatedData = generateDowntimeAnalysisReport(formattedOrder);
      } else if (selectedReportType === 'production_efficiency') {
        generatedData = generateProductionEfficiencyReport(formattedOrder);
      } else if (selectedReportType === 'summary_report') {
        generatedData = generateSummaryReport(formattedOrder);
      } else if (selectedReportType === 'oee_analysis') {
        generatedData = generateOEEReport(formattedOrder, selectedStandard);
      }
      
      // Verificar que haya datos para mostrar
      if (!generatedData || generatedData.length === 0) {
        throw new Error('No se pudieron generar datos para el reporte');
      }
      
      setReportData(generatedData);
      setShowReportPreview(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setReportError(`Error al generar el reporte: ${errorMessage}`);
      console.error('Error al generar el reporte:', err);
    } finally {
      setGeneratingReport(false);
    }
  };
  
  // Función para generar reporte detallado de fabricación
  const generateManufacturingDetailedReport = (orderData) => {
    const order = orderData.order || {};
    const mfgOrder = orderData.manufacturing_order || {};
    const timeStats = orderData.time_stats || {};
    
    return [{
      order_code: order.order_code || 'Sin código',
      article_code: mfgOrder.article_code || 'Sin código',
      description: mfgOrder.description || 'Sin descripción',
      status: order.status || 'Desconocido',
      start_time: order.start_time || '',
      end_time: order.end_time || '',
      quantity: mfgOrder.quantity || 0,
      good_units: mfgOrder.good_units || 0,
      defective_units: mfgOrder.defective_units || 0,
      total_produced: mfgOrder.total_produced || 0,
      completion_percentage: mfgOrder.completion_percentage || 0,
      total_duration_minutes: Math.round((timeStats.total_duration || 0) / 60000),
      production_time_minutes: Math.round((timeStats.effective_production_time || 0) / 60000),
      pause_time_minutes: Math.round((timeStats.total_pause_time || 0) / 60000)
    }];
  };
  
  // Función para generar reporte de análisis de tiempos muertos
  const generateDowntimeAnalysisReport = (orderData) => {
    if (!orderData.pauses || !Array.isArray(orderData.pauses) || orderData.pauses.length === 0) {
      console.warn('No hay pausas registradas para esta orden:', orderData.order?.order_code);
      return [];
    }
    
    const order = orderData.order || {};
    const mfgOrder = orderData.manufacturing_order || {};
    
    return orderData.pauses.map(pause => {
      if (!pause) return null;
      
      return {
        order_code: order.order_code || 'Sin código',
        article_code: mfgOrder.article_code || 'Sin código',
        description: mfgOrder.description || 'Sin descripción',
        reason: pause.reason || 'Sin motivo',
        start_time: pause.start_time || '',
        end_time: pause.end_time || '',
        duration_minutes: pause.duration_minutes || 0,
        comments: pause.comments || 'Sin comentarios'
      };
    }).filter(item => item !== null);
  };
  
  // Función para generar reporte de eficiencia de producción
  const generateProductionEfficiencyReport = (orderData) => {
    const order = orderData.order || {};
    const mfgOrder = orderData.manufacturing_order || {};
    const timeStats = orderData.time_stats || {};
    
    const productionTimeHours = ((timeStats.effective_production_time || 0) / 3600000).toFixed(2);
    const totalProduced = mfgOrder.total_produced || 0;
    
    // Calcular eficiencia (unidades/hora)
    const efficiency = parseFloat(productionTimeHours) > 0 ? 
      (totalProduced / parseFloat(productionTimeHours)).toFixed(2) : '0.00';
    
    const goodUnits = mfgOrder.good_units || 0;
    const defectiveUnits = mfgOrder.defective_units || 0;
    
    return [{
      order_code: order.order_code || 'Sin código',
      article_code: mfgOrder.article_code || 'Sin código',
      description: mfgOrder.description || 'Sin descripción',
      status: order.status || 'Desconocido',
      target_rate: mfgOrder.target_production_rate || 0,
      actual_rate: parseFloat(efficiency),
      good_units: goodUnits,
      defective_units: defectiveUnits,
      total_produced: totalProduced,
      production_time_hours: productionTimeHours,
      good_units_percentage: totalProduced > 0 ? 
        ((goodUnits / totalProduced) * 100).toFixed(2) : '0.00',
      defective_units_percentage: totalProduced > 0 ? 
        ((defectiveUnits / totalProduced) * 100).toFixed(2) : '0.00',
      completion_percentage: mfgOrder.completion_percentage || 0
    }];
  };
  
  // Función para generar un reporte resumido con métricas clave
  const generateSummaryReport = (orderData) => {
    const order = orderData.order || {};
    const mfgOrder = orderData.manufacturing_order || {};
    const timeStats = orderData.time_stats || {};
    
    const totalDurationHours = ((timeStats.total_duration || 0) / 3600000).toFixed(2);
    const productionTimeHours = ((timeStats.effective_production_time || 0) / 3600000).toFixed(2);
    const pauseTimeHours = ((timeStats.total_pause_time || 0) / 3600000).toFixed(2);
    
    // Calcular métricas adicionales
    const effectiveTimePercentage = timeStats.total_duration > 0 ? 
      ((timeStats.effective_production_time / timeStats.total_duration) * 100).toFixed(2) : '0.00';
    
    const totalProduced = mfgOrder.total_produced || 0;
    const goodUnits = mfgOrder.good_units || 0;
    const defectiveUnits = mfgOrder.defective_units || 0;
    
    const qualityPercentage = totalProduced > 0 ? 
      ((goodUnits / totalProduced) * 100).toFixed(2) : '0.00';
    
    // Calcular eficiencia (unidades/hora)
    const efficiency = parseFloat(productionTimeHours) > 0 ? 
      (totalProduced / parseFloat(productionTimeHours)).toFixed(2) : '0.00';
    
    return [{
      order_code: order.order_code || 'Sin código',
      article_code: mfgOrder.article_code || 'Sin código',
      description: mfgOrder.description || 'Sin descripción',
      status: order.status || 'Desconocido',
      start_time: order.start_time || '',
      end_time: order.end_time || '',
      total_duration_hours: totalDurationHours,
      production_time_hours: productionTimeHours,
      pause_time_hours: pauseTimeHours,
      effective_time_percentage: effectiveTimePercentage,
      target_rate: mfgOrder.target_production_rate || 0,
      actual_rate: parseFloat(efficiency),
      quantity: mfgOrder.quantity || 0,
      good_units: goodUnits,
      defective_units: defectiveUnits,
      total_produced: totalProduced,
      quality_percentage: qualityPercentage,
      completion_percentage: mfgOrder.completion_percentage || 0
    }];
  };
  
  // Función para generar reporte de análisis OEE con los cálculos solicitados
  const generateOEEReport = (orderData, standardValue) => {
    const order = orderData.order || {};
    const mfgOrder = orderData.manufacturing_order || {};
    const timeStats = orderData.time_stats || {};
    
    // Convertir tiempos de ms a horas para los cálculos
    const totalDurationHours = (timeStats.total_duration || 0) / 3600000;
    const totalActiveTimeHours = (timeStats.effective_production_time || 0) / 3600000;
    const pauseTimeHours = (timeStats.total_pause_time || 0) / 3600000;
    
    // Valores totales para calcular métricas
    const totalProduced = mfgOrder.total_produced || 0;
    const goodUnits = mfgOrder.good_units || 0;
    const defectiveUnits = mfgOrder.defective_units || 0;
    
    // Cálculos de OEE según fórmulas solicitadas
    // Disponibilidad = total_Active_time / tiempo total
    const availability = totalDurationHours > 0 
      ? (totalActiveTimeHours / totalDurationHours) 
      : 0;
    
    // Rendimiento = total unidades / (standard * total_active_time(en horas))
    const performance = (totalActiveTimeHours > 0 && standardValue > 0) 
      ? (totalProduced / (standardValue * totalActiveTimeHours)) 
      : 0;
    
    // Calidad = unidades Buenas / totales
    const quality = totalProduced > 0 
      ? (goodUnits / totalProduced) 
      : 0;
    
    // OEE = Disponibilidad * Rendimiento * Calidad
    const oee = availability * performance * quality;
    
    // Tiempo estimado Producción = cantidad a producir / standard
    const estimatedProductionTime = standardValue > 0 
      ? (mfgOrder.quantity / standardValue) 
      : 0;
    
    // Standard Real = total unidades / (tiempo activo / 60)
    const activeTimeMinutes = totalActiveTimeHours * 60;
    const realStandard = activeTimeMinutes > 0 
      ? (totalProduced / activeTimeMinutes) * 60 // Multiplicamos por 60 para convertir a unidades/hora
      : 0;
    
    // Standard Real Respecto Teórico = (Standard Real - teórico) / teórico
    const standardDeviation = standardValue > 0 
      ? ((realStandard - standardValue) / standardValue) 
      : 0;
    
    return [{
      order_code: order.order_code || 'Sin código',
      article_code: mfgOrder.article_code || 'Sin código',
      description: mfgOrder.description || 'Sin descripción',
      status: order.status || 'Desconocido',
      start_time: order.start_time || '',
      end_time: order.end_time || '',
      quantity: mfgOrder.quantity || 0,
      total_produced: totalProduced,
      good_units: goodUnits,
      defective_units: defectiveUnits,
      total_duration_hours: totalDurationHours.toFixed(2),
      active_time_hours: totalActiveTimeHours.toFixed(2),
      pause_time_hours: pauseTimeHours.toFixed(2),
      standard_theoretical: standardValue,
      standard_real: realStandard.toFixed(2),
      standard_deviation_percentage: (standardDeviation * 100).toFixed(2),
      estimated_production_time: estimatedProductionTime.toFixed(2),
      availability_percentage: (availability * 100).toFixed(2),
      performance_percentage: (performance * 100).toFixed(2),
      quality_percentage: (quality * 100).toFixed(2),
      oee_percentage: (oee * 100).toFixed(2)
    }];
  };
  
  // Función para adaptar el formato de los datos de la API a la estructura esperada
  const adaptApiDataToReportFormat = (apiOrder) => {
    // Si es un detalle completo de una orden específica
    if (apiOrder.order && apiOrder.manufacturing_order) {
      return {
        order: apiOrder.order,
        manufacturing_order: apiOrder.manufacturing_order,
        time_stats: apiOrder.time_stats || {
          total_duration: 0,
          total_pause_time: 0,
          effective_production_time: 0
        },
        pauses: apiOrder.pauses || []
      };
    }
    
    // Si es una orden de la lista de órdenes
    return {
      order: {
        id: apiOrder.id,
        order_code: apiOrder.order_code,
        status: apiOrder.status,
        start_time: apiOrder.time?.start_time,
        end_time: apiOrder.time?.end_time
      },
      manufacturing_order: {
        article_code: apiOrder.article_code,
        description: apiOrder.description,
        quantity: apiOrder.quantity,
        good_units: apiOrder.produced?.good_units || 0,
        defective_units: apiOrder.produced?.defective_units || 0,
        total_produced: apiOrder.produced?.total || 0,
        completion_percentage: apiOrder.produced?.completion_percentage || 0
      },
      time_stats: {
        total_duration: 0, // Necesitamos el detalle de la orden para esto
        total_pause_time: 0,
        effective_production_time: 0
      },
      pauses: []
    };
  };// Función mejorada para descargar todos los reportes en un archivo Excel con hojas grupadas y diseño mejorado
  const exportAllReportsExcel = async () => {
    if (!manufacturingOrders || !Array.isArray(manufacturingOrders) || manufacturingOrders.length === 0) {
      setReportError('No hay órdenes de fabricación para generar reportes');
      return;
    }
    
    setGeneratingBatchReports(true);
    setReportError(null);
    
    try {
      // Primero, obtener todos los detalles de las órdenes
      console.log('Obteniendo detalles de órdenes para generar reportes...');
      const orderDetails = await fetchAllOrderDetails();
      
      if (!orderDetails || orderDetails.length === 0) {
        setReportError('No se pudieron obtener detalles de las órdenes para generar reportes');
        setGeneratingBatchReports(false);
        return;
      }
      
      console.log(`Procesando ${orderDetails.length} órdenes para generar reportes...`);
      
      // Crear un libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Añadir una portada con información de Cremer y el standard seleccionado
      createCoverSheet(wb);
      
      // Añadir hoja de resumen con metadatos generales
      createSummarySheet(wb, orderDetails);
      
      // Para cada tipo de reporte (creará una hoja por cada tipo)
      for (const reportType of reportTypes) {
        let allOrdersData = [];
        let validOrdersCount = 0;
        
        // Para cada orden de fabricación
        for (let i = 0; i < orderDetails.length; i++) {
          const orderDetail = orderDetails[i];
          const formattedOrder = adaptApiDataToReportFormat(orderDetail);
          
          // Verificar que la orden tenga datos válidos
          if (!formattedOrder.order || !formattedOrder.manufacturing_order) {
            console.warn('Orden con estructura incorrecta:', orderDetail);
            continue;
          }
          
          let reportData = [];
          
          // Generar datos según el tipo de reporte
          if (reportType.id === 'manufacturing_detailed') {
            reportData = generateManufacturingDetailedReport(formattedOrder);
          } else if (reportType.id === 'downtime_analysis') {
            reportData = generateDowntimeAnalysisReport(formattedOrder);
          } else if (reportType.id === 'production_efficiency') {
            reportData = generateProductionEfficiencyReport(formattedOrder);
          } else if (reportType.id === 'summary_report') {
            reportData = generateSummaryReport(formattedOrder);
          } else if (reportType.id === 'oee_analysis') {
            // Para el reporte OEE, usamos el standard seleccionado
            reportData = generateOEEReport(formattedOrder, selectedStandard);
          }
          
          if (reportData && reportData.length > 0) {
            validOrdersCount++;
            allOrdersData = [...allOrdersData, ...reportData];
          }
        }
        
        console.log(`Órdenes válidas para el reporte ${reportType.name}: ${validOrdersCount} de ${orderDetails.length}`);
        
        if (allOrdersData.length > 0) {
          try {
            // Transformar los datos para Excel (traducciones y formatos)
            const processedData = allOrdersData.map(row => {
              const newRow = {};
              
              // Procesar cada valor para la exportación
              Object.entries(row).forEach(([key, value]) => {
                const translatedKey = translateHeader(key);
                
                // Formatear fechas
                if (key.includes('time') || key.includes('date')) {
                  try {
                    if (value && typeof value === 'string' && value.trim() !== '') {
                      newRow[translatedKey] = format(new Date(value), 'dd/MM/yyyy HH:mm:ss');
                    } else {
                      newRow[translatedKey] = '';
                    }
                    return;
                  } catch (e) {
                    // Mantener el valor original si no es una fecha válida
                    console.warn('Error al formatear fecha:', e, value);
                    newRow[translatedKey] = value;
                    return;
                  }
                }
                
                // Tratar porcentajes y números
                if (key.includes('percentage')) {
                  // Asegurarse de que es una cadena formateada con 2 decimales
                  newRow[translatedKey] = typeof value === 'number' ? 
                    `${value.toFixed(2)}%` : 
                    (typeof value === 'string' ? 
                      (value.includes('%') ? value : `${value}%`) : '0.00%');
                } else if (typeof value === 'number') {
                  // Formatear números con 2 decimales si es necesario
                  newRow[translatedKey] = Number.isInteger(value) ? value : value.toFixed(2);
                } else {
                  newRow[translatedKey] = value;
                }
              });
              
              return newRow;
            });
            
            // Agrupar datos si es necesario
            const groupedReportData = groupData(processedData, selectedGrouping);
            
            if (groupedReportData.grouped) {
              // Crear una hoja para el reporte con datos agrupados
              addGroupedDataToWorkbook(wb, groupedReportData, reportType.name);
            } else {
              // Crear una hoja para este tipo de reporte sin agrupar
              const ws = XLSX.utils.json_to_sheet(processedData);
              
              // Añadir metadatos y formato
              applyExcelFormatting(ws, processedData);
              
              // Añadir la hoja al libro
              XLSX.utils.book_append_sheet(wb, ws, reportType.name);
            }
            
            console.log(`Hoja añadida para ${reportType.name} con ${processedData.length} filas de datos`);
          } catch (sheetError) {
            console.error('Error al crear hoja de Excel para:', reportType.name, sheetError);
            // Si hay error, crear una hoja con mensaje de error
            const ws = XLSX.utils.aoa_to_sheet([
              ['Error al procesar los datos para este reporte.'], 
              ['Detalles del error:'], 
              [sheetError.toString()]
            ]);
            XLSX.utils.book_append_sheet(wb, ws, reportType.name);
          }
        } else {
          // Si no hay datos, crear una hoja vacía con un mensaje
          const ws = XLSX.utils.aoa_to_sheet([
            ['No hay datos disponibles para este tipo de reporte.'],
            ['Posibles razones:'],
            ['- No hay órdenes que cumplan con los criterios de filtrado'],
            ['- Las órdenes no tienen la estructura de datos necesaria'],
            ['- Para el reporte de tiempos muertos, no hay pausas registradas']
          ]);
          XLSX.utils.book_append_sheet(wb, ws, reportType.name);
        }
      }
      
      // Añadir hoja específica con análisis OEE para todas las órdenes
      createOEEAnalysisSheet(wb, orderDetails);
      
      // Guardar el archivo con nombre que incluya rango de fechas si hay filtro
      let fileName = `Cremer_Reportes_${format(new Date(), 'yyyyMMdd_HHmm')}`;
      
      if (filterDates && startDate && endDate) {
        const formattedStartDate = format(new Date(startDate), 'yyyyMMdd');
        const formattedEndDate = format(new Date(endDate), 'yyyyMMdd');
        fileName = `Cremer_Reportes_${formattedStartDate}_a_${formattedEndDate}`;
      }
      
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      setReportError(null);
    } catch (err) {
      console.error('Error al exportar todos los reportes a Excel:', err);
      setReportError(`Error al generar el Excel con todos los reportes: ${err.message}. Verifica la consola para más detalles.`);
    } finally {
      setGeneratingBatchReports(false);
    }
  };
  
  // Función para crear una portada en el workbook
  const createCoverSheet = (workbook) => {
    try {
      // Crear los datos de la portada
      const coverData = [
        ['CREMER'],
        [''],
        ['REPORTES DE PRODUCCIÓN'],
        [''],
        ['Fecha de generación:', format(new Date(), 'dd/MM/yyyy HH:mm')],
        [''],
        ['Valor de Estándar utilizado para cálculos OEE:', `${selectedStandard} unidades/hora`],
        [''],
        ['Periodo:', filterDates ? `${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}` : 'Todos los periodos'],
        [''],
        ['Este reporte contiene la siguiente información:'],
        ['- Resumen general de producción'],
        ['- Detalles de fabricación'],
        ['- Análisis de eficiencia'],
        ['- Análisis de tiempos muertos'],
        ['- Análisis OEE (Overall Equipment Effectiveness)'],
      ];
      
      // Crear la hoja
      const ws = XLSX.utils.aoa_to_sheet(coverData);
      
      // Definir anchos de columna
      ws['!cols'] = [
        { wch: 40 }, // A
        { wch: 40 }, // B
      ];
      
      // Definir estilos (lo máximo que permite el formato xlsx sin usar una librería adicional)
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // CREMER
        { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // REPORTES DE PRODUCCIÓN
      ];
      ws['!merges'] = merges;
      
      // Añadir la hoja al principio del libro
      XLSX.utils.book_append_sheet(workbook, ws, 'Portada');
      
    } catch (error) {
      console.error('Error al crear portada:', error);
      const ws = XLSX.utils.aoa_to_sheet([
        ['Error al crear la portada'],
        [error.toString()]
      ]);
      XLSX.utils.book_append_sheet(workbook, ws, 'Portada');
    }
  };
  
  // Función para crear una hoja de resumen en el workbook
  const createSummarySheet = (workbook, orderDetails) => {
    try {
      // Extraer datos clave para el resumen
      const totalOrders = orderDetails.length;
      const statuses = {};
      const articles = {};
      let totalGoodUnits = 0;
      let totalDefectiveUnits = 0;
      let totalProductionTimeMs = 0;
      let totalPauseTimeMs = 0;
      
      orderDetails.forEach(detail => {
        const order = detail.order || {};
        const mfgOrder = detail.manufacturing_order || {};
        const timeStats = detail.time_stats || {};
        
        // Contar por estado
        const status = order.status || 'Desconocido';
        statuses[status] = (statuses[status] || 0) + 1;
        
        // Contar por artículo
        const article = mfgOrder.article_code || 'Sin código';
        if (!articles[article]) {
          articles[article] = {
            count: 0,
            description: mfgOrder.description || 'Sin descripción',
            totalProduced: 0,
            goodUnits: 0,
            defectiveUnits: 0
          };
        }
        articles[article].count++;
        articles[article].totalProduced += mfgOrder.total_produced || 0;
        articles[article].goodUnits += mfgOrder.good_units || 0;
        articles[article].defectiveUnits += mfgOrder.defective_units || 0;
        
        // Totales generales
        totalGoodUnits += mfgOrder.good_units || 0;
        totalDefectiveUnits += mfgOrder.defective_units || 0;
        totalProductionTimeMs += timeStats.effective_production_time || 0;
        totalPauseTimeMs += timeStats.total_pause_time || 0;
      });
      
      // Convertir tiempos de ms a horas
      const totalProductionTimeHrs = (totalProductionTimeMs / 3600000).toFixed(2);
      const totalPauseTimeHrs = (totalPauseTimeMs / 3600000).toFixed(2);
      
      // Crear datos para la hoja de resumen
      const summaryData = [
        ['RESUMEN DE PRODUCCIÓN'],
        [''],
        ['Periodo:', filterDates ? `${startDate} a ${endDate}` : 'Todos los periodos'],
        ['Total órdenes:', totalOrders],
        ['Unidades buenas:', totalGoodUnits],
        ['Unidades defectuosas:', totalDefectiveUnits],
        ['Tiempo total de producción (h):', totalProductionTimeHrs],
        ['Tiempo total de pausa (h):', totalPauseTimeHrs],
        [''],
        ['ÓRDENES POR ESTADO'],
        ['']
      ];
      
      // Añadir datos de estados
      Object.entries(statuses).forEach(([status, count]) => {
        summaryData.push([status, count, `${((count / totalOrders) * 100).toFixed(2)}%`]);
      });
      
      summaryData.push([''], ['PRODUCCIÓN POR ARTÍCULO'], ['']);
      summaryData.push(['Código', 'Descripción', 'Órdenes', 'Unidades Producidas', 'Unidades Buenas', 'Unidades Defectuosas']);
      
      // Añadir datos de artículos
      Object.entries(articles).forEach(([code, data]) => {
        summaryData.push([
          code,
          data.description,
          data.count,
          data.totalProduced,
          data.goodUnits,
          data.defectiveUnits
        ]);
      });
      
      // Crear la hoja y aplicar formato
      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Definir anchos de columna
      ws['!cols'] = [
        { wch: 20 }, // A
        { wch: 40 }, // B
        { wch: 15 }, // C
        { wch: 20 }, // D
        { wch: 15 }, // E
        { wch: 20 }  // F
      ];
      
      // Añadir la hoja de resumen al principio del libro
      XLSX.utils.book_append_sheet(workbook, ws, 'Resumen');
      
    } catch (error) {
      console.error('Error al crear hoja de resumen:', error);
      const ws = XLSX.utils.aoa_to_sheet([
        ['Error al crear el resumen'],
        [error.toString()]
      ]);
      XLSX.utils.book_append_sheet(workbook, ws, 'Resumen');
    }
  };// Función para crear hoja específica de análisis OEE
  const createOEEAnalysisSheet = (workbook, orderDetails) => {
    try {
      // Verificar si la hoja ya existe en el libro
      const baseSheetName = 'Análisis OEE';
      
      // Generar un nombre único si la hoja ya existe
      let sheetName = baseSheetName;
      let counter = 1;
      while (workbook.SheetNames.includes(sheetName)) {
        sheetName = `${baseSheetName} ${counter}`;
        counter++;
      }
      
      // --- SECCIÓN DE CABECERA ---
      // Crear filas de encabezado con información corporativa y parámetros
      const headerRows = [
        ['CREMER - ANÁLISIS OEE DETALLADO'], 
        [''],
        ['Fecha de generación:', format(new Date(), 'dd/MM/yyyy HH:mm')],
        ['Standard utilizado:', `${selectedStandard} unidades/hora`],
        ['Periodo analizado:', filterDates ? 
          `${format(new Date(startDate), 'dd/MM/yyyy')} al ${format(new Date(endDate), 'dd/MM/yyyy')}` : 
          'Todos los periodos'],
        ['']
      ];
      
      // --- SECCIÓN DE RESUMEN ---
      // Calcular totales y promedios para el resumen
      let totalAvailability = 0;
      let totalPerformance = 0;
      let totalQuality = 0;
      let totalOEE = 0;
      let totalProducedUnits = 0;
      let totalOrdersWithData = 0;
      
      const orderSummaryData = orderDetails.map(orderDetail => {
        const formattedOrder = adaptApiDataToReportFormat(orderDetail);
        if (!formattedOrder.order || !formattedOrder.manufacturing_order) {
          return null;
        }
        
        const order = formattedOrder.order;
        const mfgOrder = formattedOrder.manufacturing_order;
        const timeStats = formattedOrder.time_stats || {};
        
        // Convertir tiempos de ms a horas para los cálculos
        const totalDurationHours = (timeStats.total_duration || 0) / 3600000;
        const totalActiveTimeHours = (timeStats.effective_production_time || 0) / 3600000;
        
        // Valores totales para calcular métricas
        const totalProduced = mfgOrder.total_produced || 0;
        const goodUnits = mfgOrder.good_units || 0;
        
        // Cálculos de OEE
        const availability = totalDurationHours > 0 ? (totalActiveTimeHours / totalDurationHours) : 0;
        const performance = (totalActiveTimeHours > 0 && selectedStandard > 0) ? 
          (totalProduced / (selectedStandard * totalActiveTimeHours)) : 0;
        const quality = totalProduced > 0 ? (goodUnits / totalProduced) : 0;
        const oee = availability * performance * quality;
        
        if (totalDurationHours > 0) {
          totalAvailability += availability;
          totalPerformance += performance;
          totalQuality += quality;
          totalOEE += oee;
          totalProducedUnits += totalProduced;
          totalOrdersWithData++;
        }
        
        return {
          order,
          mfgOrder,
          timeStats,
          metrics: {
            availability,
            performance,
            quality,
            oee,
            totalProduced
          }
        };
      }).filter(data => data !== null);
      
      // Calcular promedios
      const avgAvailability = totalOrdersWithData > 0 ? (totalAvailability / totalOrdersWithData) : 0;
      const avgPerformance = totalOrdersWithData > 0 ? (totalPerformance / totalOrdersWithData) : 0;
      const avgQuality = totalOrdersWithData > 0 ? (totalQuality / totalOrdersWithData) : 0;
      const avgOEE = totalOrdersWithData > 0 ? (totalOEE / totalOrdersWithData) : 0;
      
      // Filas de resumen
      const summaryRows = [
        ['RESUMEN GENERAL OEE'],
        [''],
        ['Total órdenes analizadas:', totalOrdersWithData],
        ['Total unidades producidas:', totalProducedUnits],
        [''],
        ['INDICADORES PROMEDIO:'],
        ['Disponibilidad:', `${(avgAvailability * 100).toFixed(2)}%`],
        ['Rendimiento:', `${(avgPerformance * 100).toFixed(2)}%`],
        ['Calidad:', `${(avgQuality * 100).toFixed(2)}%`],
        ['OEE:', `${(avgOEE * 100).toFixed(2)}%`],
        ['']
      ];
      
      // --- SECCIÓN DE TABLA DETALLADA ---
      // Crear encabezados para la tabla OEE
      const tableHeader = [
        'Código Orden', 
        'Artículo', 
        'Descripción', 
        'Estado',
        'Disponibilidad', 
        'Rendimiento', 
        'Calidad', 
        'OEE',
        'Standard Teórico', 
        'Standard Real', 
        'Desviación Standard (%)',
        'Tiempo Estimado (h)',
        'Tiempo Total (h)',
        'Tiempo Activo (h)',
        'Tiempo Pausa (h)'
      ];
      
      // Crear la tabla con todas las filas (encabezado + datos)
      const detailRows = [tableHeader];
      
      // Agregar filas de datos detallados
      orderSummaryData.forEach(data => {
        const order = data.order;
        const mfgOrder = data.mfgOrder;
        const timeStats = data.timeStats;
        const metrics = data.metrics;
        
        // Calcular métricas adicionales
        const totalDurationHours = (timeStats.total_duration || 0) / 3600000;
        const totalActiveTimeHours = (timeStats.effective_production_time || 0) / 3600000;
        const pauseTimeHours = (timeStats.total_pause_time || 0) / 3600000;
        
        // Tiempo estimado Producción
        const estimatedProductionTime = selectedStandard > 0 
          ? (mfgOrder.quantity / selectedStandard) 
          : 0;
        
        // Standard Real
        const activeTimeMinutes = totalActiveTimeHours * 60;
        const realStandard = activeTimeMinutes > 0 
          ? (metrics.totalProduced / activeTimeMinutes) * 60
          : 0;
        
        // Desviación Standard
        const standardDeviation = selectedStandard > 0 
          ? ((realStandard - selectedStandard) / selectedStandard) 
          : 0;
        
        detailRows.push([
          order.order_code || 'Sin código',
          mfgOrder.article_code || 'Sin código',
          mfgOrder.description || 'Sin descripción',
          order.status || 'Desconocido',
          (metrics.availability * 100).toFixed(2) + '%',
          (metrics.performance * 100).toFixed(2) + '%',
          (metrics.quality * 100).toFixed(2) + '%',
          (metrics.oee * 100).toFixed(2) + '%',
          selectedStandard,
          realStandard.toFixed(2),
          (standardDeviation * 100).toFixed(2) + '%',
          estimatedProductionTime.toFixed(2),
          totalDurationHours.toFixed(2),
          totalActiveTimeHours.toFixed(2),
          pauseTimeHours.toFixed(2)
        ]);
      });
      
      // Si no hay datos, agregar una fila indicándolo
      if (detailRows.length === 1) {
        detailRows.push(['No hay datos disponibles para el análisis OEE']);
      }
      
      // --- COMBINACIÓN DE TODAS LAS SECCIONES ---
      // Unir todas las secciones en un solo conjunto de datos
      const completeData = [
        ...headerRows,
        ...summaryRows,
        ['DETALLE POR ÓRDENES'],
        [''],
        ...detailRows
      ];
      
      // Crear la hoja con todos los datos
      const ws = XLSX.utils.aoa_to_sheet(completeData);
      
      // --- APLICAR FORMATO ---
      // Definir anchos de columna óptimos
      ws['!cols'] = [
        { wch: 18 }, // Código Orden
        { wch: 15 }, // Artículo
        { wch: 35 }, // Descripción
        { wch: 15 }, // Estado
        { wch: 15 }, // Disponibilidad
        { wch: 15 }, // Rendimiento
        { wch: 15 }, // Calidad
        { wch: 15 }, // OEE
        { wch: 18 }, // Standard Teórico
        { wch: 18 }, // Standard Real
        { wch: 20 }, // Desviación Standard
        { wch: 18 }, // Tiempo Estimado
        { wch: 15 }, // Tiempo Total
        { wch: 15 }, // Tiempo Activo
        { wch: 15 }  // Tiempo Pausa
      ];
      
      // Combinar celdas para títulos
      if (!ws['!merges']) ws['!merges'] = [];
      // Título principal
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
      // Título de resumen
      ws['!merges'].push({ s: { r: headerRows.length, c: 0 }, e: { r: headerRows.length, c: 5 } });
      // Título de detalle
      ws['!merges'].push({ s: { r: headerRows.length + summaryRows.length, c: 0 }, e: { r: headerRows.length + summaryRows.length, c: 5 } });
      
      // Añadir la hoja al libro con el nombre único
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      
      console.log(`Hoja de análisis OEE creada con éxito como "${sheetName}"`);
      
    } catch (error) {
      console.error('Error al crear hoja de análisis OEE:', error);
      
      // Generar un nombre único para la hoja de error también
      let errorSheetName = 'Error OEE';
      let counter = 1;
      while (workbook.SheetNames.includes(errorSheetName)) {
        errorSheetName = `Error OEE ${counter}`;
        counter++;
      }
      
      const ws = XLSX.utils.aoa_to_sheet([
        ['Error al crear el análisis OEE'],
        [error.toString()]
      ]);
      
      XLSX.utils.book_append_sheet(workbook, ws, errorSheetName);
    }
  };
  
  // Función para aplicar formato a hojas de Excel
  const applyExcelFormatting = (worksheet, data) => {
    if (!data || data.length === 0) return;
    
    // Definir anchos de columna basados en el contenido
    const keys = Object.keys(data[0]);
    const colWidths = keys.map(key => {
      const maxContentLength = Math.max(
        key.length,
        ...data.map(row => {
          const val = row[key];
          return val ? String(val).length : 0;
        })
      );
      return { wch: Math.min(Math.max(maxContentLength, 10), 50) };
    });
    
    worksheet['!cols'] = colWidths;
  };
  
  // Función para añadir datos agrupados al workbook
  const addGroupedDataToWorkbook = (workbook, groupedData, sheetName) => {
    try {
      const { groups, data } = groupedData;
      
      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        const ws = XLSX.utils.aoa_to_sheet([['No hay datos para agrupar']]);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
        return;
      }
      
      // Crear una hoja con outline para poder colapsar/expandir grupos
      // Primero una fila con el nombre del grupo, luego los datos de ese grupo
      
      // Crear un array para la tabla de datos
      let tableData = [];
      let rowIndex = 0;
      
      groups.forEach((groupName) => {
        // Añadir fila de encabezado del grupo
        tableData.push([`${groupName} (${data[groupName].length} registros)`]);
        rowIndex++;
        
        // Si es el primer grupo, añadir encabezados de columna
        if (groups.indexOf(groupName) === 0 && data[groupName].length > 0) {
          const headers = Object.keys(data[groupName][0]).map(key => translateHeader(key));
          tableData.push(headers);
          rowIndex++;
        } else if (data[groupName].length === 0) {
          tableData.push(['No hay datos en este grupo']);
          rowIndex++;
          return;
        }
        
        // Añadir datos del grupo
        data[groupName].forEach(row => {
          tableData.push(Object.values(row));
          rowIndex++;
        });
        
        // Línea en blanco entre grupos
        tableData.push([]);
        rowIndex++;
      });
      
      // Crear la hoja con los datos
      const ws = XLSX.utils.aoa_to_sheet(tableData);
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      
      // Aplicar outline (agrupación) a las filas para colapsar/expandir
      if (!ws['!rows']) ws['!rows'] = [];
      
      let currentRow = 0;
      groups.forEach((groupName) => {
        // La primera fila del grupo (título) tiene outline level 1
        ws['!rows'][currentRow] = { level: 1 };
        currentRow++;
        
        // Los encabezados y datos tienen outline level 2
        const groupItemCount = data[groupName].length + 1; // +1 por los encabezados
        for (let i = 0; i < groupItemCount; i++) {
          ws['!rows'][currentRow] = { hidden: false, level: 2 };
          currentRow++;
        }
        
        // Fila en blanco
        currentRow++;
      });
      
    } catch (error) {
      console.error('Error al añadir datos agrupados al workbook:', error);
      const ws = XLSX.utils.aoa_to_sheet([
        ['Error al agrupar datos'],
        [error.toString()]
      ]);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }
  };// Función para exportar a PDF mejorada con soporte para datos agrupados
  const exportToPDF = () => {
    if (!reportData.length) {
      setReportError('No hay datos para exportar a PDF');
      return;
    }
    
    try {
      // Obtener encabezados y crear datos formateados
      const headers = Object.keys(reportData[0]);
      const translatedHeaders = translateHeaders(headers);
      
      // Verificar si necesitamos manejar datos agrupados
      if (selectedGrouping !== 'none') {
        exportGroupedPDF(translatedHeaders);
      } else {
        exportSimplePDF(translatedHeaders);
      }
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      setReportError('Error al generar el PDF. Verifica la consola para más detalles.');
    }
  };
  
  // Función para exportar PDF simple (sin agrupación)
  const exportSimplePDF = (translatedHeaders) => {
    try {
      const formattedData = formatReportData(reportData, Object.keys(reportData[0]));
      
      // Crear un nuevo documento PDF con orientación horizontal
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Paleta de colores profesional en tonos de gris
      const colors = {
        headerBackground: [240, 240, 240],
        borderColor: [200, 200, 200],
        alternateRowColor: [248, 248, 248],
        textColor: [50, 50, 50]
      };
      
      // Título del reporte según el tipo seleccionado
      const reportTitle = reportTypes.find(rt => rt.id === selectedReportType)?.name || 'Reporte';
      
      // Si es un reporte OEE, añadir información del standard usado
      let subtitle = '';
      if (selectedReportType === 'oee_analysis') {
        subtitle = `Standard: ${selectedStandard} unidades/hora`;
      }
      
      // Configurar el PDF
      configurePDFHeader(doc, colors, reportTitle, subtitle);
      
      // Agregar la tabla al PDF directamente después del encabezado
      doc.autoTable({
        head: [translatedHeaders],
        body: formattedData,
        startY: 40,
        theme: 'grid',
        headStyles: getPDFHeadStyles(colors),
        styles: getPDFBodyStyles(colors),
        columnStyles: getPDFColumnStyles(translatedHeaders),
        alternateRowStyles: {
          fillColor: colors.alternateRowColor
        },
        margin: { top: 40, right: 5, bottom: 15, left: 5 },
        didDrawPage: function(data) {
          configurePDFFooter(doc, data, colors);
        }
      });
      
      // Guardar el PDF
      const orderCode = selectedManufacturingOrder?.order?.order_code || 'reporte';
      doc.save(`${orderCode}_${selectedReportType}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF simple:', error);
      setReportError(`Error al generar el PDF: ${error.message}`);
    }
  };
  
  // Función para exportar PDF con datos agrupados
  const exportGroupedPDF = (translatedHeaders) => {
    try {
      // Verificar que los datos estén agrupados
      if (!groupedData.grouped) {
        exportSimplePDF(translatedHeaders);
        return;
      }
      
      // Crear un nuevo documento PDF con orientación horizontal
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Paleta de colores profesional en tonos de gris
      const colors = {
        headerBackground: [240, 240, 240],
        borderColor: [200, 200, 200],
        alternateRowColor: [248, 248, 248],
        textColor: [50, 50, 50],
        groupHeaderBackground: [220, 230, 240]
      };
      
      // Título del reporte según el tipo seleccionado
      const reportTitle = reportTypes.find(rt => rt.id === selectedReportType)?.name || 'Reporte';
      const groupingName = groupingOptions.find(go => go.id === selectedGrouping)?.name || 'Agrupado';
      
      // Si es un reporte OEE, añadir información del standard usado
      let subtitle = `${groupingName}`;
      if (selectedReportType === 'oee_analysis') {
        subtitle = `${groupingName} - Standard: ${selectedStandard} unidades/hora`;
      }
      
      // Configurar el PDF
      configurePDFHeader(doc, colors, reportTitle, subtitle);
      
      // Variable para posición Y actual
      let yPosition = 40;
      
      // Para cada grupo, añadir un encabezado y una tabla
      groupedData.groups.forEach((groupName, groupIndex) => {
        const groupItems = groupedData.data[groupName];
        
        // Si no hay datos en este grupo, mostrar solo título
        if (!groupItems || groupItems.length === 0) {
          return;
        }
        
        // Añadir encabezado del grupo
        doc.setFillColor(colors.groupHeaderBackground[0], colors.groupHeaderBackground[1], colors.groupHeaderBackground[2]);
        doc.setDrawColor(colors.borderColor[0], colors.borderColor[1], colors.borderColor[2]);
        doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
        doc.rect(5, yPosition, 287, 8, 'FD');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${groupName} (${groupItems.length} registros)`, 10, yPosition + 5);
        
        yPosition += 10;
        
        // Verificar si hay suficiente espacio en la página actual
        if (yPosition + 10 > 200) {
          doc.addPage();
          configurePDFHeader(doc, colors, reportTitle, subtitle);
          yPosition = 40;
        }
        
        // Formatear datos para este grupo
        const formattedData = formatReportData(groupItems, Object.keys(groupItems[0]));
        
        // Agregar tabla para este grupo
        doc.autoTable({
          head: [translatedHeaders],
          body: formattedData,
          startY: yPosition,
          theme: 'grid',
          headStyles: getPDFHeadStyles(colors),
          styles: getPDFBodyStyles(colors),
          columnStyles: getPDFColumnStyles(translatedHeaders),
          alternateRowStyles: {
            fillColor: colors.alternateRowColor
          },
          margin: { top: yPosition, right: 5, bottom: 15, left: 5 },
          didDrawPage: function(data) {
            configurePDFFooter(doc, data, colors);
          }
        });
        
        // Actualizar posición Y para el siguiente grupo
        yPosition = doc.lastAutoTable.finalY + 10;
        
        // Si no es el último grupo, añadir una página nueva
        if (groupIndex < groupedData.groups.length - 1) {
          doc.addPage();
          configurePDFHeader(doc, colors, reportTitle, subtitle);
          yPosition = 40;
        }
      });
      
      // Guardar el PDF
      const orderCode = selectedManufacturingOrder?.order?.order_code || 'reporte';
      doc.save(`${orderCode}_${selectedReportType}_${selectedGrouping}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF agrupado:', error);
      setReportError(`Error al generar el PDF agrupado: ${error.message}`);
    }
  };
  
  // Función para exportar a Excel mejorada con soporte para datos agrupados
  const exportToExcel = () => {
    if (!reportData.length) {
      setReportError('No hay datos para exportar a Excel');
      return;
    }
    
    try {
      // Obtener encabezados
      const headers = Object.keys(reportData[0]);
      
      // Formatear datos para la exportación
      const processedData = reportData.map(row => {
        const newRow = {};
        
        // Procesar cada valor para la exportación
        Object.entries(row).forEach(([key, value]) => {
          const translatedKey = translateHeader(key);
          
          // Formatear fechas
          if (key.includes('time') || key.includes('date')) {
            try {
              if (value && typeof value === 'string') {
                newRow[translatedKey] = format(new Date(value), 'dd/MM/yyyy HH:mm:ss');
                return;
              }
            } catch (e) {
              // Mantener el valor original si no es una fecha válida
              newRow[translatedKey] = value;
            }
          } else {
            newRow[translatedKey] = value;
          }
        });
        
        return newRow;
      });
      
      // Crear un libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Añadir una portada con información de Cremer y el standard seleccionado
      createCoverSheet(wb);
      
      // Verificar si necesitamos manejar datos agrupados
      if (selectedGrouping !== 'none') {
        // Agrupar datos
        const groupedReportData = groupData(processedData, selectedGrouping);
        
        // Añadir datos agrupados al Excel
        addGroupedDataToWorkbook(wb, groupedReportData, 'Datos');
      } else {
        // Crear una hoja para este tipo de reporte sin agrupar
        const ws = XLSX.utils.json_to_sheet(processedData);
        
        // Añadir metadatos y formato
        applyExcelFormatting(ws, processedData);
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');
      }
      
      // Si es un reporte OEE, añadir una hoja con análisis de OEE
      if (selectedReportType === 'oee_analysis') {
        const singleOrderDetails = [selectedManufacturingOrder];
        createOEEAnalysisSheet(wb, singleOrderDetails);
      }
      
      // Guardar el archivo
      const reportTitle = reportTypes.find(rt => rt.id === selectedReportType)?.name || 'Reporte';
      const orderCode = selectedManufacturingOrder?.order?.order_code || 'reporte';
      
      XLSX.writeFile(wb, `Cremer_${orderCode}_${reportTitle}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      setReportError('Error al generar el Excel. Verifica la consola para más detalles.');
    }
  };// Funciones de utilidad para trabajar con el PDF
  
  // Configurar encabezado del PDF
  const configurePDFHeader = (doc, colors, title, subtitle = '') => {
    try {
      // Borde completo en gris claro
      doc.setFillColor(colors.borderColor[0], colors.borderColor[1], colors.borderColor[2]);
      doc.rect(0, 0, 297, 210, 'S'); // borde exterior
      doc.setLineWidth(0.5);
      doc.setDrawColor(colors.borderColor[0], colors.borderColor[1], colors.borderColor[2]);
      doc.rect(3, 3, 291, 204, 'S'); // borde interior
      
      // Barra superior en gris claro
      doc.setFillColor(colors.headerBackground[0], colors.headerBackground[1], colors.headerBackground[2]);
      doc.rect(3, 3, 291, 34, 'F');
      
      // Añadir logo sin fondo blanco
      try {
        // Logo en esquina superior izquierda
        doc.addImage(cremerLogo || logoImg, 'PNG', 10, 10, 60, 15, '', 'NONE');
      } catch (e) {
        // Si no hay logo, poner texto de la empresa
        doc.setFontSize(18);
        doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text("CREMER", 10, 15);
        doc.setFontSize(12);
        doc.text("Reporte de Producción", 10, 23);
      }
      
      // Título del reporte
      doc.setFontSize(16);
      doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 148, 20, { align: 'center' });
      
      // Subtítulo si existe
      if (subtitle) {
        doc.setFontSize(12);
        doc.text(subtitle, 148, 28, { align: 'center' });
      }
      
      // Fecha de generación en la parte derecha superior
      doc.setFontSize(10);
      doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 230, 20);
      
      // Si es un reporte OEE, mostrar el standard usado
      if (selectedReportType === 'oee_analysis' && !subtitle.includes('Standard')) {
        doc.text(`Standard: ${selectedStandard} unidades/hora`, 230, 28);
      }
    } catch (error) {
      console.error('Error al configurar encabezado del PDF:', error);
      // Configuración mínima en caso de error
      doc.setFontSize(16);
      doc.text(title, 148, 20, { align: 'center' });
    }
  };
  
  // Configurar pie de página del PDF
  const configurePDFFooter = (doc, data, colors) => {
    try {
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      
      // Pie de página en gris claro
      doc.setFillColor(colors.headerBackground[0], colors.headerBackground[1], colors.headerBackground[2]);
      doc.rect(3, 195, 291, 12, 'F');
      
      // Texto del pie de página
      doc.setFontSize(8);
      doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
      doc.text(`Reporte de Producción - Página ${currentPage} de ${pageCount}`, 10, 202);
      
      // Fecha en pie de página
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 230, 202);
      
      // Rehacer encabezado en páginas adicionales
      if (currentPage > 1) {
        try {
          // Repetir el borde exterior en nuevas páginas
          doc.setFillColor(colors.borderColor[0], colors.borderColor[1], colors.borderColor[2]);
          doc.rect(0, 0, 297, 210, 'S');
          doc.setLineWidth(0.5);
          doc.setDrawColor(colors.borderColor[0], colors.borderColor[1], colors.borderColor[2]);
          doc.rect(3, 3, 291, 204, 'S');
          
          // Barra superior en gris claro
          doc.setFillColor(colors.headerBackground[0], colors.headerBackground[1], colors.headerBackground[2]);
          doc.rect(3, 3, 291, 34, 'F');
          
          try {
            // Logo en páginas adicionales sin fondo blanco
            doc.addImage(cremerLogo || logoImg, 'PNG', 10, 10, 60, 15, '', 'NONE');
          } catch (e) {
            // Texto alternativo si no hay logo
            doc.setFontSize(18);
            doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text("CREMER", 10, 15);
            doc.setFontSize(12);
            doc.text("Reporte de Producción", 10, 23);
          }
          
          // Fecha de generación en la parte derecha superior (páginas adicionales)
          doc.setFontSize(10);
          doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
          doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 230, 20);
        } catch (error) {
          console.error('Error al configurar encabezado de página adicional:', error);
        }
      }
    } catch (error) {
      console.error('Error al configurar pie de página del PDF:', error);
    }
  };
  
  // Función para dibujar una caja métrica
  const drawMetricBox = (doc, x, y, width, height, title, value, colors) => {
    try {
      // Dibujar el cuadro
      doc.setDrawColor(colors.borderColor[0], colors.borderColor[1], colors.borderColor[2]);
      doc.setFillColor(255, 255, 255);
      doc.rect(x, y, width, height, 'FD');
      
      // Añadir título
      doc.setFontSize(10);
      doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(title, x + width / 2, y + 8, { align: 'center' });
      
      // Añadir valor
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), x + width / 2, y + 18, { align: 'center' });
    } catch (error) {
      console.error('Error al dibujar caja métrica:', error);
    }
  };
  
  // Obtener estilos para encabezados de tabla en PDF
  const getPDFHeadStyles = (colors) => {
    return {
      fillColor: colors.headerBackground,
      textColor: colors.textColor,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8,
      cellPadding: 2
    };
  };
  
  // Obtener estilos para cuerpo de tabla en PDF
  const getPDFBodyStyles = (colors) => {
    return {
      fontSize: 8,
      cellPadding: 1,
      lineColor: colors.borderColor,
      lineWidth: 0.1,
      valign: 'middle',
      textColor: colors.textColor
    };
  };
  
  // Obtener estilos de columnas para PDF
  const getPDFColumnStyles = (headers) => {
    const columnStyles = {};
    headers.forEach((header, index) => {
      columnStyles[index] = { 
        cellWidth: 'auto',
        halign: header.includes('%') || header.includes('Número') ? 'right' : 'left'
      };
    });
    return columnStyles;
  };
  
  // Función para traducir los encabezados
  const translateHeaders = (headers) => {
    return headers.map(header => translateHeader(header));
  };
  
  // Función para traducir un encabezado
  const translateHeader = (header) => {
    const translations = {
      order_code: 'Código de Orden',
      article_code: 'Código de Artículo',
      description: 'Descripción',
      quantity: 'Cantidad',
      status: 'Estado',
      start_time: 'Fecha Inicio',
      end_time: 'Fecha Fin',
      good_units: 'Unidades Buenas',
      defective_units: 'Unidades Defectuosas',
      total_produced: 'Total Producido',
      completion_percentage: '% Completado',
      total_duration_minutes: 'Duración Total (min)',
      production_time_minutes: 'Tiempo Producción (min)',
      pause_time_minutes: 'Tiempo Pausa (min)',
      production_time_hours: 'Tiempo Producción (h)',
      target_rate: 'Tasa Objetivo (u/min)',
      actual_rate: 'Tasa Real (u/h)',
      good_units_percentage: '% Unidades Buenas',
      defective_units_percentage: '% Unidades Defectuosas',
      reason: 'Motivo de Pausa',
      duration_minutes: 'Duración (min)',
      comments: 'Comentarios',
      order_name: 'Orden',
      total_duration_hours: 'Duración Total (h)',
      pause_time_hours: 'Tiempo de Pausa (h)',
      effective_time_percentage: '% Tiempo Efectivo',
      quality_percentage: '% Calidad',
      // OEE específicas
      active_time_hours: 'Tiempo Activo (h)',
      standard_theoretical: 'Standard Teórico (u/h)',
      standard_real: 'Standard Real (u/h)',
      standard_deviation_percentage: 'Desviación Standard (%)',
      estimated_production_time: 'Tiempo Estimado (h)',
      availability_percentage: 'Disponibilidad (%)',
      performance_percentage: 'Rendimiento (%)',
      oee_percentage: 'OEE (%)'
    };
    
    return translations[header] || header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Formatear datos para reportes
  const formatReportData = (data, headers) => {
    if (!data || !Array.isArray(data) || data.length === 0 || !headers || !Array.isArray(headers)) {
      console.warn('Datos inválidos para formatear reportes:', data, headers);
      return [];
    }
    
    try {
      return data.map(row => {
        if (!row) return headers.map(() => 'N/A');
        
        return headers.map(key => {
          let value = row[key];
          
          // Formatear fechas
          if (key.includes('time') || key.includes('date')) {
            try {
              if (value && typeof value === 'string') {
                value = format(new Date(value), 'dd/MM/yyyy HH:mm:ss');
              }
            } catch (e) {
              // Mantener el valor original si no es una fecha válida
              console.warn('Error al formatear fecha:', e);
            }
          }
          
          // Formatear porcentajes
          if (key.includes('percentage')) {
            value = `${value}%`;
          }
          
          // Formatear números
          if (
            typeof value === 'number' && 
            !key.includes('id') && 
            !key.includes('percentage')
          ) {
            value = value.toLocaleString();
          }
          
          return value === null || value === undefined ? 'N/A' : String(value);
        });
      });
    } catch (error) {
      console.error('Error al formatear datos del reporte:', error);
      return [];
    }
  };// Renderizado de la vista de reportes
  return (
    <Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Diálogo para seleccionar el valor de Standard */}
      <Dialog open={showStandardDialog} onClose={closeStandardDialog}>
        <DialogTitle>Seleccionar valor Standard para cálculo OEE</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            El valor Standard se utiliza para calcular métricas de OEE y eficiencia.
            Representa la cantidad de unidades por hora que debería producirse teóricamente.
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              aria-label="standard-value"
              name="standard-value"
              value={selectedStandard}
              onChange={handleStandardChange}
            >
              {standardOptions.map(option => (
                <FormControlLabel 
                  key={option.value} 
                  value={option.value} 
                  control={<Radio />} 
                  label={option.label} 
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStandardDialog} color="secondary">
            Cancelar
          </Button>
          <Button onClick={confirmStandardAndGenerateReport} color="primary" variant="contained">
            Aplicar y Generar Reporte
          </Button>
        </DialogActions>
      </Dialog>
      
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardHeader 
          title="Reportes de Fabricación" 
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={fetchAllManufacturingOrders}
                disabled={loading}
              >
                Actualizar Órdenes
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={generatingBatchReports ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={exportAllReportsExcel}
                disabled={!manufacturingOrders || !Array.isArray(manufacturingOrders) || 
                          manufacturingOrders.length === 0 || generatingBatchReports || loading}
              >
                {generatingBatchReports ? 'Generando...' : 'Descargar Reportes en Excel'}
              </Button>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          {/* Mostrar información de órdenes cargadas */}
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {manufacturingOrders.length > 0 
              ? `${manufacturingOrders.length} órdenes de fabricación disponibles` 
              : 'No hay órdenes cargadas'}
          </Typography>
          
          {/* Filtros de fecha */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Filtros de reporte
                <Tooltip title="Filtra las órdenes por fecha de inicio">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <FilterIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {filterDates && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    color="secondary"
                    onClick={resetFilters}
                    startIcon={<RefreshIcon />}
                  >
                    Limpiar filtros
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={fetchAllManufacturingOrders}
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                >
                  Actualizar datos
                </Button>
              </Box>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={filterDates}
                        onChange={(e) => {
                          if (e.target.checked) {
                            enableFilterWithDefaults();
                          } else {
                            setFilterDates(false);
                          }
                        }}
                        color="primary"
                      />
                    }
                    label="Filtrar por fechas"
                  />
                </FormGroup>
              </Grid>
              
              <Grid item xs={12} sm={4.5}>
                <TextField
                  label="Fecha de inicio"
                  type="date"
                  fullWidth
                  disabled={!filterDates}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={filterDates && reportError && (reportError.includes('fecha') || reportError.includes('formato'))}
                  helperText={filterDates ? "Formato: AAAA-MM-DD" : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={4.5}>
                <TextField
                  label="Fecha de fin"
                  type="date"
                  fullWidth
                  disabled={!filterDates}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={filterDates && reportError && (reportError.includes('fecha') || reportError.includes('formato'))}
                />
              </Grid>
            </Grid>
            
            {filterDates && (
              <Box sx={{ mt: 2 }}>
                {reportError ? (
                  <Alert 
                    severity="warning" 
                    sx={{ mb: 2 }}
                  >
                    {reportError}
                  </Alert>
                ) : (
                  <Alert severity="info">
                    Mostrando <strong>{filteredOrders?.length || 0}</strong> de <strong>{manufacturingOrders?.length || 0}</strong> órdenes
                    {startDate && endDate && (
                      <>
                        {' '} en el periodo del <strong>{format(new Date(startDate), 'dd/MM/yyyy')}</strong> al 
                        <strong> {format(new Date(endDate), 'dd/MM/yyyy')}</strong>
                      </>
                    )}
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
          
          {!selectedManufacturingOrder ? (
            <Alert severity="info" sx={{ my: 2 }}>
              Para generar un reporte individual, primero debes seleccionar una orden de fabricación.
              <br />
              Ve a la pestaña "Órdenes" y haz clic en el botón de información de una orden específica.
              <br />
              Para generar reportes generales, utiliza el botón "Descargar Reportes en Excel" en la parte superior.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Orden:</strong> {selectedManufacturingOrder.order?.order_code || 'Sin código'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Artículo:</strong> {selectedManufacturingOrder.manufacturing_order?.article_code || 'Sin código'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Descripción:</strong> {selectedManufacturingOrder.manufacturing_order?.description || 'Sin descripción'}
                </Typography>
                <Typography variant="body1">
                  <strong>Estado:</strong> {selectedManufacturingOrder.order?.status || 'Desconocido'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Reporte</InputLabel>
                    <Select
                      value={selectedReportType}
                      onChange={handleReportTypeChange}
                      label="Tipo de Reporte"
                    >
                      {reportTypes.map((report) => (
                        <MenuItem key={report.id} value={report.id}>
                          {report.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Agrupar por</InputLabel>
                    <Select
                      value={selectedGrouping}
                      onChange={handleGroupingChange}
                      label="Agrupar por"
                    >
                      {groupingOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Selector de Standard para reportes OEE */}
                {selectedReportType === 'oee_analysis' && (
                  <Box sx={{ mb: 2 }}>
                    <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        <SpeedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Standard seleccionado: <strong>{selectedStandard} unidades/hora</strong>
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CalculateIcon />}
                        onClick={openStandardDialog}
                        sx={{ mt: 1 }}
                      >
                        Cambiar valor Standard
                      </Button>
                    </Paper>
                  </Box>
                )}
                
                <Box>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={generateReport}
                    disabled={generatingReport}
                    fullWidth
                    startIcon={generatingReport ? <CircularProgress size={20} /> : <DateRangeIcon />}
                  >
                    {generatingReport ? 'Generando...' : 'Generar Reporte'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
      
      {reportError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {reportError}
        </Alert>
      )}
      
      {showReportPreview && reportData && reportData.length > 0 && (
        <Box sx={{ mt: 3, overflowX: 'auto' }}>
          <Card elevation={3}>
            <CardHeader
              title="Vista previa del reporte"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    color="success" 
                    startIcon={<PdfIcon />} 
                    onClick={exportToPDF}
                  >
                    Exportar PDF
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="success" 
                    startIcon={<ExcelIcon />} 
                    onClick={exportToExcel}
                  >
                    Exportar Excel
                  </Button>
                </Box>
              }
            />
            <Divider />
            <CardContent>
              {/* Pestañas para mostrar vista de tabla o vista agrupada */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleChangeTab} 
                  aria-label="vista de reporte"
                >
                  <Tab 
                    icon={<TableViewIcon />} 
                    label="Vista de Tabla" 
                    id="tab-0" 
                    aria-controls="tabpanel-0" 
                  />
                  {selectedGrouping !== 'none' && (
                    <Tab 
                      icon={<GroupViewIcon />} 
                      label="Vista Agrupada" 
                      id="tab-1" 
                      aria-controls="tabpanel-1" 
                    />
                  )}
                </Tabs>
              </Box>
              
              {/* Panel para vista de tabla */}
              <div
                role="tabpanel"
                hidden={activeTab !== 0}
                id="tabpanel-0"
                aria-labelledby="tab-0"
              >
                {activeTab === 0 && (
                  <Paper sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    <table 
                      ref={previewTableRef} 
                      style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        fontSize: '0.9rem'
                      }}
                      className="responsive-table"
                    >
                      <thead>
                        <tr>
                          {Object.keys(reportData[0]).map(header => {
                            const headerText = translateHeader(header);
                            
                            return (
                              <th key={header} style={{ 
                                padding: '8px 16px', 
                                backgroundColor: '#2e7d32', // Verde primario para coincidir con el PDF
                                color: 'white',
                                fontWeight: 'bold',
                                textAlign: 'left',
                                position: 'sticky',
                                top: 0
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {headerText}
                                  {getMetricTooltip && typeof getMetricTooltip === 'function' && 
                                   getMetricTooltip(header) !== 'No hay información adicional disponible.' && (
                                    <Tooltip title={getMetricTooltip(header)}>
                                      <IconButton size="small" sx={{ ml: 1, color: 'white' }}>
                                        <HelpIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((row, rowIndex) => (
                          <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#e8f5e9' : 'white' }}>
                            {Object.entries(row).map(([key, value], cellIndex) => {
                              try {
                                // Formatear valores específicos
                                let cellValue = value;
                                
                                // Formatear fechas
                                if (
                                  key.includes('time') || 
                                  key.includes('date')
                                ) {
                                  try {
                                    if (cellValue && typeof cellValue === 'string') {
                                      cellValue = format(new Date(cellValue), 'dd/MM/yyyy HH:mm:ss');
                                    }
                                  } catch (e) {
                                    // Mantener el valor original si no es una fecha válida
                                  }
                                }
                                
                                // Formatear porcentajes
                                if (key.includes('percentage')) {
                                  cellValue = `${cellValue}%`;
                                }
                                
                                // Formatear números
                                if (
                                  typeof cellValue === 'number' && 
                                  !key.includes('id') && 
                                  !key.includes('percentage')
                                ) {
                                  cellValue = cellValue.toLocaleString();
                                }
                                
                                return (
                                  <td key={cellIndex} style={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0' }}>
                                    {cellValue === null || cellValue === undefined ? 'N/A' : String(cellValue)}
                                  </td>
                                );
                              } catch (error) {
                                console.error('Error al renderizar celda:', error);
                                return (
                                  <td key={cellIndex} style={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0' }}>
                                    Error
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Paper>
                )}
              </div>
              
              {/* Panel para vista agrupada */}
              <div
                role="tabpanel"
                hidden={activeTab !== 1 || selectedGrouping === 'none'}
                id="tabpanel-1"
                aria-labelledby="tab-1"
              >
                {activeTab === 1 && selectedGrouping !== 'none' && groupedData.grouped && (
                  <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {groupedData.groups.map((groupName) => (
                      <Paper 
                        key={groupName} 
                        elevation={2} 
                        sx={{ mb: 3, overflow: 'hidden' }}
                      >
                        <Box 
                          sx={{ 
                            p: 1.5, 
                            backgroundColor: '#e8f5e9', 
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Typography variant="subtitle1">
                            {groupName}
                          </Typography>
                          <Typography variant="body2">
                            {groupedData.data[groupName].length} registros
                          </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ p: 1 }}>
                          <table 
                            style={{ 
                              width: '100%', 
                              borderCollapse: 'collapse',
                              fontSize: '0.9rem'
                            }}
                            className="responsive-table"
                          >
                            <thead>
                              <tr>
                                {Object.keys(groupedData.data[groupName][0] || {}).map(header => (
                                  <th key={header} style={{ 
                                    padding: '8px 16px', 
                                    backgroundColor: '#81c784',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textAlign: 'left'
                                  }}>
                                    {translateHeader(header)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {groupedData.data[groupName].map((row, rowIndex) => (
                                <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#f1f8e9' : 'white' }}>
                                  {Object.entries(row).map(([key, value], cellIndex) => {
                                    try {
                                      // Formatear valores específicos
                                      let cellValue = value;
                                      
                                      // Formatear fechas
                                      if (
                                        key.includes('time') || 
                                        key.includes('date')
                                      ) {
                                        try {
                                          if (cellValue && typeof cellValue === 'string') {
                                            cellValue = format(new Date(cellValue), 'dd/MM/yyyy HH:mm:ss');
                                          }
                                        } catch (e) {
                                          // Mantener el valor original si no es una fecha válida
                                        }
                                      }
                                      
                                      // Formatear porcentajes
                                      if (key.includes('percentage')) {
                                        cellValue = `${cellValue}%`;
                                      }
                                      
                                      // Formatear números
                                      if (
                                        typeof cellValue === 'number' && 
                                        !key.includes('id') && 
                                        !key.includes('percentage')
                                      ) {
                                        cellValue = cellValue.toLocaleString();
                                      }
                                      
                                      return (
                                        <td key={cellIndex} style={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0' }}>
                                          {cellValue === null || cellValue === undefined ? 'N/A' : String(cellValue)}
                                        </td>
                                      );
                                    } catch (error) {
                                      console.error('Error al renderizar celda agrupada:', error);
                                      return (
                                        <td key={cellIndex} style={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0' }}>
                                          Error
                                        </td>
                                      );
                                    }
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </div>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default ReportsView;