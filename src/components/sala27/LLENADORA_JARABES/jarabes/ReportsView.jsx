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
  Checkbox
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  DateRange as DateRangeIcon,
  HelpOutline as HelpIcon,
  FileDownload as DownloadIcon,
  Summarize as SummaryIcon,
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getMetricTooltip } from '../../LLENADORA_JARABES/utils/helpers';
import logoImg from '../../../../assets/logo.png';

// API base URL
const API_BASE_URL = 'http://192.168.11.25:3003/api';

// Tipos de reportes disponibles
const reportTypes = [
  { id: 'manufacturing_detailed', name: 'Fabricación Detallado' },
  { id: 'production_efficiency', name: 'Eficiencia de Producción' },
  { id: 'downtime_analysis', name: 'Análisis de Tiempos Muertos' }
];

const ReportsView = ({ selectedManufacturingOrder, fetchManufacturingOrderDetails }) => {
  const [manufacturingOrders, setManufacturingOrders] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState('manufacturing_detailed');
  const [reportData, setReportData] = useState([]);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingBatchReports, setGeneratingBatchReports] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailedOrders, setDetailedOrders] = useState([]);
  
  // Estado para filtros de fecha
  const [filterDates, setFilterDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // Referencia para la tabla de vista previa
  const previewTableRef = useRef(null);// Cargar las órdenes al iniciar la vista
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
  };
  
  // Función para filtrar órdenes por fecha
  const filterOrdersByDate = (orders, start, end) => {
    if (!orders || !Array.isArray(orders) || orders.length === 0 || !start || !end) {
      return orders || [];
    }
    
    try {
      const startDateTime = new Date(start);
      const endDateTime = new Date(end);
      
      // Ajustar final del día para la fecha de fin
      endDateTime.setHours(23, 59, 59, 999);
      
      return orders.filter(order => {
        if (!order || !order.time || !order.time.start_time) {
          return false;
        }
        
        try {
          const orderDate = new Date(order.time.start_time);
          return isWithinInterval(orderDate, { start: startDateTime, end: endDateTime });
        } catch (error) {
          console.warn('Error al analizar fecha de orden:', error, order);
          return false;
        }
      });
    } catch (error) {
      console.error('Error al filtrar órdenes por fecha:', error);
      return orders;
    }
  };// Función para manejar cambios en el tipo de reporte
  const handleReportTypeChange = (event) => {
    setSelectedReportType(event.target.value);
    // Reset preview
    setShowReportPreview(false);
    setReportData([]);
  };
  
  // Función para generar el reporte a partir de los datos de orden seleccionada
  const generateReport = async () => {
    if (!selectedManufacturingOrder) {
      setReportError('No hay una orden de fabricación seleccionada para generar el reporte');
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
  };// Función para descargar todos los reportes en un archivo Excel con tres hojas
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
            
            // Crear una hoja para este tipo de reporte
            const ws = XLSX.utils.json_to_sheet(processedData);
            
            // Añadir metadatos
            ws['!cols'] = Object.keys(processedData[0]).map(() => ({ wch: 15 })); // Ancho de columna predeterminado
            
            // Añadir la hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, reportType.name);
            
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
      
      // Guardar el archivo con nombre que incluya rango de fechas si hay filtro
      let fileName = `Todos_los_reportes_${format(new Date(), 'yyyyMMdd_HHmm')}`;
      
      if (filterDates && startDate && endDate) {
        const formattedStartDate = format(new Date(startDate), 'yyyyMMdd');
        const formattedEndDate = format(new Date(endDate), 'yyyyMMdd');
        fileName = `Reportes_${formattedStartDate}_a_${formattedEndDate}`;
      }
      
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      setReportError(null);
    } catch (err) {
      console.error('Error al exportar todos los reportes a Excel:', err);
      setReportError(`Error al generar el Excel con todos los reportes: ${err.message}. Verifica la consola para más detalles.`);
    } finally {
      setGeneratingBatchReports(false);
    }
  };// Función para exportar a PDF mejorada
  const exportToPDF = () => {
    if (!reportData.length) {
      setReportError('No hay datos para exportar a PDF');
      return;
    }
    
    try {
      // Obtener encabezados y crear datos formateados
      const headers = Object.keys(reportData[0]);
      const translatedHeaders = translateHeaders(headers);
      const formattedData = formatReportData(reportData, headers);
      
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
      
      // Configurar el PDF
      configurePDFHeader(doc, colors, 'Reporte de Producción');
      
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
      const reportTitle = selectedManufacturingOrder?.order?.order_code || 'reporte';
      doc.save(`${reportTitle}_${selectedReportType}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      setReportError('Error al generar el PDF. Verifica la consola para más detalles.');
    }
  };
  
  // Función para exportar a Excel
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
      
      // Crear un libro de trabajo y una hoja
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(processedData);
      
      // Añadir metadatos
      ws['!cols'] = Object.keys(processedData[0]).map(() => ({ wch: 15 })); // Ancho de columna predeterminado
      
      // Añadir la hoja al libro
      const reportTitle = reportTypes.find(rt => rt.id === selectedReportType)?.name || 'Reporte';
      XLSX.utils.book_append_sheet(wb, ws, reportTitle);
      
      // Guardar el archivo
      const fileName = selectedManufacturingOrder?.order?.order_code || 'reporte';
      XLSX.writeFile(wb, `${fileName}_${selectedReportType}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      setReportError('Error al generar el Excel. Verifica la consola para más detalles.');
    }
  };
  
  // Funciones de utilidad para trabajar con el PDF
  
  // Configurar encabezado del PDF
  const configurePDFHeader = (doc, colors, title) => {
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
        doc.addImage(logoImg, 'PNG', 10, 10, 60, 15, '', 'NONE');
      } catch (e) {
        // Si no hay logo, poner texto de la empresa
        doc.setFontSize(18);
        doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text("NATURE PHARMA", 10, 15);
        doc.setFontSize(12);
        doc.text("Reporte de Producción", 10, 23);
      }
      
      // Título del reporte
      doc.setFontSize(16);
      doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 148, 20, { align: 'center' });
      
      // Fecha de generación en la parte derecha superior
      doc.setFontSize(10);
      doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 230, 20);
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
            doc.addImage(logoImg, 'PNG', 10, 10, 60, 15, '', 'NONE');
          } catch (e) {
            // Texto alternativo si no hay logo
            doc.setFontSize(18);
            doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text("NATURE PHARMA", 10, 15);
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
      production_time_minutes: 'Tiempo de Producción (min)',
      pause_time_minutes: 'Tiempo de Pausa (min)',
      production_time_hours: 'Tiempo de Producción (h)',
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
      quality_percentage: '% Calidad'
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
            <Typography variant="h6" gutterBottom>
              Filtros de reporte
              <Tooltip title="Filtra las órdenes por fecha de inicio">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={filterDates}
                        onChange={(e) => setFilterDates(e.target.checked)}
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
                />
              </Grid>
            </Grid>
            
            {filterDates && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Órdenes filtradas: {filteredOrders?.length || 0} de {manufacturingOrders?.length || 0}
                </Typography>
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
                
                <Box sx={{ mt: 2 }}>
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
          <Typography variant="h6" gutterBottom>
            Vista previa del reporte
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
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
                          textAlign: 'left'
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
            </div>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ReportsView;