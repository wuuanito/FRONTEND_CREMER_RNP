import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Tooltip,
  ChipProps,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Alert,
  
  SelectChangeEvent
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Info as InfoIcon,
  LocalShipping as ShippingIcon,
  CleaningServices as CleaningIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon,
  BarChart as ChartIcon,
  Assessment as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DashboardReports from './components/DashboardReports'; 

// Interfaces para tipado
interface ManufacturingOrderList {
  total: number;
  limit: number;
  offset: number;
  orders: ManufacturingOrderSummary[];
}

interface ManufacturingOrderSummary {
  id: number;
  order_id: number;
  order_code: string;
  status: string;
  article_code: string;
  description: string;
  quantity: number;
  produced: {
    good_units: number;
    defective_units: number;
    total: number;
    completion_percentage: number;
  };
  time: {
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
  };
}

interface CleaningOrderList {
  total: number;
  limit: number;
  offset: number;
  orders: CleaningOrderSummary[];
}

interface CleaningOrderSummary {
  id: number;
  order_id: number;
  order_code: string;
  status: string;
  cleaning_type: string;
  area_id: string;
  area_name: string;
  description: string;
  associated_manufacturing_order_id: number | null;
  operator_name: string | null;
  completed: boolean;
  estimated_duration_minutes: number;
  time: {
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
    duration: number;
  };
}

interface ManufacturingOrderDetail {
  order: {
    id: number;
    order_code: string;
    type: string;
    status: string;
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
    notes: string | null;
  };
  manufacturing_order: {
    id: number;
    article_code: string;
    description: string;
    quantity: number;
    target_production_rate: number;
    good_units: number;
    defective_units: number;
    total_produced: number;
    completion_percentage: number;
  };
  time_stats: {
    total_duration: number;
    total_pause_time: number;
    effective_production_time: number;
  };
  pauses: {
    id: number;
    reason: string;
    start_time: string;
    end_time: string;
    duration_ms: number;
    duration_minutes: number;
    comments: string;
  }[];
  recent_production_entries: any[];
}

interface CleaningOrderDetail {
  order: {
    id: number;
    order_code: string;
    type: string;
    status: string;
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
    notes: string | null;
  };
  cleaning_order: {
    id: number;
    cleaning_type: string;
    area_id: string;
    area_name: string;
    description: string;
    operator_id: string | null;
    operator_name: string | null;
    estimated_duration_minutes: number;
    completed: boolean;
    completion_notes: string | null;
    products_used: string | null;
  };
  associated_manufacturing_order: any | null;
  time_stats: {
    duration_ms: number;
    duration_minutes: number;
    estimated_vs_actual: number;
  };
}

interface ReportType {
  id: string;
  name: string;
}

// URLs API
const API_BASE_URL = 'http://192.168.11.25:3000/api';
const MANUFACTURING_URL = `${API_BASE_URL}/manufacturing`;
const CLEANING_URL = `${API_BASE_URL}/cleaning`;

// Estilos para las filas de tablas
const tableStyles = `
  .hover-row:hover {
    background-color: #f5f5f5;
  }
`;

// Tipos de reportes disponibles
const reportTypes: ReportType[] = [
  { id: 'manufacturing_detailed', name: 'Fabricación Detallado' },
  { id: 'production_efficiency', name: 'Eficiencia de Producción' },
  { id: 'downtime_analysis', name: 'Análisis de Tiempos Muertos' }
];

const CremerDetails: React.FC = () => {
  // Estado para el tab activo
  const [mainTab, setMainTab] = useState<number>(0); // 0: Dashboard, 1: Órdenes, 2: Reportes
  const [detailsTab, setDetailsTab] = useState<number>(0); // 0: Fabricación, 1: Limpieza
  
  // Estados para los listados
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrderSummary[]>([]);
  const [cleaningOrders, setCleaningOrders] = useState<CleaningOrderSummary[]>([]);
  
  // Estados para los detalles
  const [selectedManufacturingOrder, setSelectedManufacturingOrder] = useState<ManufacturingOrderDetail | null>(null);
  const [selectedCleaningOrder, setSelectedCleaningOrder] = useState<CleaningOrderDetail | null>(null);
  
  // Estado para controlar la visualización
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDetails, setViewingDetails] = useState<boolean>(false);
  
  // Estados para la generación de reportes
  const [selectedReportType, setSelectedReportType] = useState<string>('manufacturing_detailed');
  const [reportData, setReportData] = useState<any[]>([]);
  const [showReportPreview, setShowReportPreview] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  
  // Referencia para la tabla de vista previa
  const previewTableRef = useRef<HTMLTableElement>(null);
  
  // Función para formatear fechas
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: es });
  };
  
  // Función para formatear tiempo en ms a minutos
  const formatTimeInMinutes = (timeInMs: number): string => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };
  
  // Cargar los datos iniciales
  useEffect(() => {
    fetchManufacturingOrders();
    fetchCleaningOrders();
  }, []);
  
  // Función para obtener las órdenes de fabricación
  const fetchManufacturingOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(MANUFACTURING_URL);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data: ManufacturingOrderList = await response.json();
      setManufacturingOrders(data.orders);
    } catch (err: any) {
      setError(`Error al cargar órdenes de fabricación: ${err.message}`);
      console.error('Error al cargar órdenes de fabricación:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para obtener las órdenes de limpieza
  const fetchCleaningOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(CLEANING_URL);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data: CleaningOrderList = await response.json();
      setCleaningOrders(data.orders);
    } catch (err: any) {
      setError(`Error al cargar órdenes de limpieza: ${err.message}`);
      console.error('Error al cargar órdenes de limpieza:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para obtener los detalles de una orden de fabricación
  const fetchManufacturingOrderDetails = async (orderId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MANUFACTURING_URL}/${orderId}`);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data: ManufacturingOrderDetail = await response.json();
      setSelectedManufacturingOrder(data);
      setViewingDetails(true);
      setMainTab(1); // Cambiar a la pestaña de órdenes
      setDetailsTab(0); // Asegurarse que estamos en detalles de fabricación
    } catch (err: any) {
      setError(`Error al cargar detalles de la orden: ${err.message}`);
      console.error('Error al cargar detalles de la orden:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para obtener los detalles de una orden de limpieza
  const fetchCleaningOrderDetails = async (orderId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${CLEANING_URL}/${orderId}`);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data: CleaningOrderDetail = await response.json();
      setSelectedCleaningOrder(data);
      setViewingDetails(true);
      setMainTab(1); // Cambiar a la pestaña de órdenes
      setDetailsTab(1); // Asegurarse que estamos en detalles de limpieza
    } catch (err: any) {
      setError(`Error al cargar detalles de la orden: ${err.message}`);
      console.error('Error al cargar detalles de la orden:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para volver a la lista de órdenes
  const handleBackToList = () => {
    setViewingDetails(false);
    setSelectedManufacturingOrder(null);
    setSelectedCleaningOrder(null);
  };
  
  // Función para refrescar los datos
  const handleRefresh = () => {
    if (mainTab === 0) {
      // Estamos en el dashboard, refrescar datos del dashboard
      // (El componente DashboardReports tiene su propio método de refresco)
    } else if (mainTab === 2) {
      // Estamos en la vista de reportes - limpiar vista previa
      setShowReportPreview(false);
      setReportData([]);
    } else {
      // Estamos en la vista de órdenes
      if (viewingDetails) {
        if (detailsTab === 0 && selectedManufacturingOrder) {
          fetchManufacturingOrderDetails(selectedManufacturingOrder.order.id);
        } else if (detailsTab === 1 && selectedCleaningOrder) {
          fetchCleaningOrderDetails(selectedCleaningOrder.order.id);
        }
      } else {
        fetchManufacturingOrders();
        fetchCleaningOrders();
      }
    }
  };
  
  // Función para cambiar de tab principal
  const handleMainTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
    
    // Si cambiamos a la pestaña de reportes, pero no hay una orden seleccionada
    if (newValue === 2 && !selectedManufacturingOrder) {
      // Si venimos de la vista de detalles, mantener la orden seleccionada
      if (mainTab === 1 && viewingDetails && detailsTab === 0 && selectedManufacturingOrder) {
        // Ya tenemos una orden seleccionada, no hacer nada
      } else if (manufacturingOrders.length > 0) {
        // Si no hay orden seleccionada pero hay órdenes disponibles, seleccionar la primera
        fetchManufacturingOrderDetails(manufacturingOrders[0].order_id);
      }
    } else if (newValue === 0) {
      // Si volvemos al dashboard, resetear la vista de reportes
      setShowReportPreview(false);
      setReportData([]);
    }
  };
  
  // Función para cambiar de tab de detalles
  const handleDetailsTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setDetailsTab(newValue);
    setViewingDetails(false);
    setSelectedManufacturingOrder(null);
    setSelectedCleaningOrder(null);
  };
  
  // Función para manejar cambios en el tipo de reporte
  const handleReportTypeChange = (event: SelectChangeEvent<string>): void => {
    setSelectedReportType(event.target.value);
    // Reset preview
    setShowReportPreview(false);
    setReportData([]);
  };
  
  // Función para generar el reporte a partir de los datos de orden seleccionada
  const generateReport = (): void => {
    if (!selectedManufacturingOrder) {
      setReportError('No hay una orden de fabricación seleccionada para generar el reporte');
      return;
    }
    
    setGeneratingReport(true);
    setReportError(null);
    setReportData([]);
    
    try {
      let generatedData: any[] = [];
      
      // Generar datos específicos según el tipo de reporte
      if (selectedReportType === 'manufacturing_detailed') {
        // Reporte detallado de fabricación
        generatedData = [{
          order_code: selectedManufacturingOrder.order.order_code,
          article_code: selectedManufacturingOrder.manufacturing_order.article_code,
          description: selectedManufacturingOrder.manufacturing_order.description,
          status: selectedManufacturingOrder.order.status,
          start_time: selectedManufacturingOrder.order.start_time,
          end_time: selectedManufacturingOrder.order.end_time,
          quantity: selectedManufacturingOrder.manufacturing_order.quantity,
          good_units: selectedManufacturingOrder.manufacturing_order.good_units,
          defective_units: selectedManufacturingOrder.manufacturing_order.defective_units,
          total_produced: selectedManufacturingOrder.manufacturing_order.total_produced,
          completion_percentage: selectedManufacturingOrder.manufacturing_order.completion_percentage,
          total_duration_minutes: Math.round(selectedManufacturingOrder.time_stats.total_duration / 60000),
          production_time_minutes: Math.round(selectedManufacturingOrder.time_stats.effective_production_time / 60000),
          pause_time_minutes: Math.round(selectedManufacturingOrder.time_stats.total_pause_time / 60000)
        }];
      } else if (selectedReportType === 'downtime_analysis') {
        // Para el análisis de tiempos muertos, usar las pausas
        if (selectedManufacturingOrder.pauses.length === 0) {
          throw new Error('No hay pausas registradas para esta orden');
        }
        
        generatedData = selectedManufacturingOrder.pauses.map(pause => ({
          order_code: selectedManufacturingOrder.order.order_code,
          article_code: selectedManufacturingOrder.manufacturing_order.article_code,
          reason: pause.reason,
          start_time: pause.start_time,
          end_time: pause.end_time,
          duration_minutes: pause.duration_minutes,
          comments: pause.comments || 'Sin comentarios'
        }));
      } else if (selectedReportType === 'production_efficiency') {
        // Reporte de eficiencia de producción

        const productionTimeHours = (selectedManufacturingOrder.time_stats.effective_production_time / 3600000).toFixed(2);
        
        // Calcular eficiencia (unidades/hora)
        const efficiency = parseFloat(productionTimeHours) > 0 ? 
          (selectedManufacturingOrder.manufacturing_order.total_produced / parseFloat(productionTimeHours)).toFixed(2) : '0.00';
        
        generatedData = [{
          order_code: selectedManufacturingOrder.order.order_code,
          article_code: selectedManufacturingOrder.manufacturing_order.article_code,
          description: selectedManufacturingOrder.manufacturing_order.description,
          status: selectedManufacturingOrder.order.status,
          target_rate: selectedManufacturingOrder.manufacturing_order.target_production_rate,
          actual_rate: parseFloat(efficiency),
          good_units: selectedManufacturingOrder.manufacturing_order.good_units,
          defective_units: selectedManufacturingOrder.manufacturing_order.defective_units,
          total_produced: selectedManufacturingOrder.manufacturing_order.total_produced,
          production_time_hours: productionTimeHours,
          good_units_percentage: ((selectedManufacturingOrder.manufacturing_order.good_units / selectedManufacturingOrder.manufacturing_order.total_produced) * 100).toFixed(2),
          defective_units_percentage: ((selectedManufacturingOrder.manufacturing_order.defective_units / selectedManufacturingOrder.manufacturing_order.total_produced) * 100).toFixed(2),
          completion_percentage: selectedManufacturingOrder.manufacturing_order.completion_percentage
        }];
      }
      
      // Verificar que haya datos para mostrar
      if (generatedData.length === 0) {
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
  
  // Función para exportar a PDF
  const exportToPDF = (): void => {
    if (!reportData.length) {
      setReportError('No hay datos para exportar a PDF');
      return;
    }
    
    try {
      // Crear un nuevo documento PDF con orientación horizontal
      const doc = new jsPDF('landscape');
      
      // Título del reporte
      const reportTitle = reportTypes.find(rt => rt.id === selectedReportType)?.name || 'Reporte';
      doc.setFontSize(18);
      doc.text(reportTitle, 14, 22);
      
      // Añadir información de la orden
      if (selectedManufacturingOrder) {
        doc.setFontSize(12);
        doc.text(`Orden: ${selectedManufacturingOrder.order.order_code} - ${selectedManufacturingOrder.manufacturing_order.article_code}`, 14, 30);
        
        // Información adicional
        doc.setFontSize(10);
        doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);
      }
      
      // Obtener encabezados y datos
      const headers = Object.keys(reportData[0]);
      const data = reportData.map(row => Object.values(row));
      
      // Traducir los encabezados
      const translations: Record<string, string> = {
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
        comments: 'Comentarios'
      };
      
      const translatedHeaders = headers.map(header => {
        return translations[header] || header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });
      
      // Agregar la tabla al PDF
      (doc as any).autoTable({
        head: [translatedHeaders],
        body: data,
        startY: 42,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });
      
      // Guardar el PDF
      doc.save(`${selectedManufacturingOrder?.order.order_code}_${selectedReportType}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      setReportError('Error al generar el PDF. Verifica la consola para más detalles.');
    }
  };
  
  // Función para exportar a Excel
  const exportToExcel = (): void => {
    if (!reportData.length) {
      setReportError('No hay datos para exportar a Excel');
      return;
    }
    
    try {
      // Obtener encabezados y datos
      const headers = Object.keys(reportData[0]);
      
      // Traducir los encabezados
      const translations: Record<string, string> = {
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
        comments: 'Comentarios'
      };
      
      const translatedHeaders = headers.map(header => {
        return translations[header] || header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });
      
      // Formatear datos para la exportación
      const processedData = reportData.map(row => {
        const newRow: Record<string, any> = {};
        
        // Procesar cada valor para la exportación
        Object.entries(row).forEach(([key, value]) => {
          const translatedKey = translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Formatear fechas
          if (key.includes('time') || key.includes('date')) {
            try {
              if (value && typeof value === 'string') {
                newRow[translatedKey] = format(new Date(value), 'dd/MM/yyyy HH:mm:ss');
                return;
              }
            } catch (e) {
              // Mantener el valor original si no es una fecha válida
            }
          }
          
          newRow[translatedKey] = value;
        });
        
        return newRow;
      });
      
      // Crear un libro de trabajo y una hoja
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(processedData, { header: translatedHeaders });
      
      // Añadir metadatos
      ws['!cols'] = translatedHeaders.map(() => ({ wch: 15 })); // Ancho de columna predeterminado
      
      // Añadir la hoja al libro
      const reportTitle = reportTypes.find(rt => rt.id === selectedReportType)?.name || 'Reporte';
      XLSX.utils.book_append_sheet(wb, ws, reportTitle);
      
      // Guardar el archivo
      XLSX.writeFile(wb, `${selectedManufacturingOrder?.order.order_code}_${selectedReportType}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      setReportError('Error al generar el Excel. Verifica la consola para más detalles.');
    }
  };
  
  // Función para obtener el color del chip según el estado
  const getStatusColor = (status: string): ChipProps['color'] => {
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

  // Renderizar el componente de lista de órdenes de fabricación
  const renderManufacturingOrdersList = () => (
    <TableContainer component={Paper} elevation={3}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><Typography variant="subtitle2">Código</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Artículo</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Descripción</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Cantidad</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Estado</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Fecha Inicio</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Acciones</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {manufacturingOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography>No hay órdenes de fabricación</Typography>
              </TableCell>
            </TableRow>
          ) : (
            manufacturingOrders.map((order) => (
              <TableRow key={order.id} className="hover-row">
                <TableCell>{order.order_code}</TableCell>
                <TableCell>{order.article_code}</TableCell>
                <TableCell>{order.description}</TableCell>
                <TableCell>{order.quantity.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.status} 
                    size="small" 
                    color={getStatusColor(order.status)}
                  />
                </TableCell>
                <TableCell>{formatDate(order.time.start_time)}</TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => fetchManufacturingOrderDetails(order.order_id)}
                  >
                    <InfoIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <style>{tableStyles}</style>
    </TableContainer>
    );

    // Renderizar el componente de lista de órdenes de limpieza
    const renderCleaningOrdersList = () => (
      <TableContainer component={Paper} elevation={3}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="subtitle2">Código</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Tipo</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Área</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Descripción</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Duración Est.</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Estado</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Fecha Inicio</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Acciones</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cleaningOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography>No hay órdenes de limpieza</Typography>
                </TableCell>
              </TableRow>
            ) : (
              cleaningOrders.map((order) => (
                <TableRow key={order.id} className="hover-row">
                  <TableCell>{order.order_code}</TableCell>
                  <TableCell>{order.cleaning_type}</TableCell>
                  <TableCell>{order.area_name}</TableCell>
                  <TableCell>{order.description}</TableCell>
                  <TableCell>{order.estimated_duration_minutes} min</TableCell>
                  <TableCell>
                    <Chip 
                      label={order.status} 
                      size="small" 
                      color={getStatusColor(order.status)}
                    />
                  </TableCell>
                  <TableCell>{formatDate(order.time.start_time)}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => fetchCleaningOrderDetails(order.order_id)}
                    >
                      <InfoIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  
    // Renderizar los detalles de una orden de fabricación
    const renderManufacturingOrderDetails = () => {
      if (!selectedManufacturingOrder) return null;
      
      const { order, manufacturing_order, time_stats, pauses } = selectedManufacturingOrder;
      
      // Calcular botes por minuto real con protección contra división por cero
      let realProductionRate = '0.00';
      
      if (time_stats && typeof time_stats.effective_production_time === 'number') {
        const effectiveTimeMinutes = time_stats.effective_production_time / 60000; // Convertir ms a minutos
        
        if (effectiveTimeMinutes > 0 && manufacturing_order.total_produced > 0) {
          realProductionRate = (manufacturing_order.total_produced / effectiveTimeMinutes).toFixed(2);
        }
      }
      
      return (
        <Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            variant="outlined" 
            onClick={handleBackToList}
            sx={{ mb: 2 }}
          >
            Volver a la lista
          </Button>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Información General" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    <strong>Código de Orden:</strong> {order.order_code}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Estado:</strong> <Chip 
                      label={order.status} 
                      size="small" 
                      color={getStatusColor(order.status)}
                    />
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Fecha de Creación:</strong> {formatDate(order.created_at)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Inicio:</strong> {formatDate(order.start_time)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Fin:</strong> {formatDate(order.end_time)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Notas:</strong> {order.notes || 'Sin notas'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Detalles de Producción" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    <strong>Artículo:</strong> {manufacturing_order.article_code}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Descripción:</strong> {manufacturing_order.description}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Cantidad Objetivo:</strong> {manufacturing_order.quantity.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Tasa de Producción Objetivo:</strong> {manufacturing_order.target_production_rate} unidades/min
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Tasa de Producción Real:</strong> {realProductionRate} unidades/min
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Unidades Buenas:</strong> {manufacturing_order.good_units.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Unidades Defectuosas:</strong> {manufacturing_order.defective_units.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Producido:</strong> {manufacturing_order.total_produced.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Porcentaje de Completado:</strong> {manufacturing_order.completion_percentage}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Estadísticas de Tiempo" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    <strong>Duración Total:</strong> {formatTimeInMinutes(time_stats.total_duration)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Tiempo Total de Pausa:</strong> {formatTimeInMinutes(time_stats.total_pause_time)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tiempo Efectivo de Producción:</strong> {formatTimeInMinutes(time_stats.effective_production_time)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Pausas" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  {pauses.length === 0 ? (
                    <Typography variant="body2">No hay pausas registradas</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Razón</TableCell>
                          <TableCell>Inicio</TableCell>
                          <TableCell>Fin</TableCell>
                          <TableCell>Duración</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pauses.map((pause) => (
                          <TableRow key={pause.id} className="hover-row">
                            <TableCell>{pause.reason}</TableCell>
                            <TableCell>{formatDate(pause.start_time)}</TableCell>
                            <TableCell>{formatDate(pause.end_time)}</TableCell>
                            <TableCell>{formatTimeInMinutes(pause.duration_ms)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      );
    };
  
    // Renderizar los detalles de una orden de limpieza
    const renderCleaningOrderDetails = () => {
      if (!selectedCleaningOrder) return null;
      
      const { order, cleaning_order, time_stats } = selectedCleaningOrder;
      
      return (
        <Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            variant="outlined" 
            onClick={handleBackToList}
            sx={{ mb: 2 }}
          >
            Volver a la lista
          </Button>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Información General" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    <strong>Código de Orden:</strong> {order.order_code}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Estado:</strong> <Chip 
                      label={order.status} 
                      size="small" 
                      color={getStatusColor(order.status)}
                    />
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Fecha de Creación:</strong> {formatDate(order.created_at)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Inicio:</strong> {formatDate(order.start_time)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Fin:</strong> {formatDate(order.end_time)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Notas:</strong> {order.notes || 'Sin notas'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Detalles de Limpieza" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    <strong>Tipo de Limpieza:</strong> {cleaning_order.cleaning_type}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>ID de Área:</strong> {cleaning_order.area_id}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Nombre de Área:</strong> {cleaning_order.area_name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Descripción:</strong> {cleaning_order.description}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Operador:</strong> {cleaning_order.operator_name || 'No asignado'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Duración Estimada:</strong> {cleaning_order.estimated_duration_minutes} minutos
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Completado:</strong> {cleaning_order.completed ? 'Sí' : 'No'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Notas de Finalización:</strong> {cleaning_order.completion_notes || 'Sin notas'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Productos Utilizados:</strong> {cleaning_order.products_used || 'No especificados'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Estadísticas de Tiempo" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    <strong>Duración Total:</strong> {formatTimeInMinutes(time_stats.duration_ms)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Duración en Minutos:</strong> {time_stats.duration_minutes.toFixed(2)} minutos
                  </Typography>
                  <Typography variant="body2">
                    <strong>Comparación Estimado vs Real:</strong> {(time_stats.estimated_vs_actual * 100).toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      );
    };
  
    // Renderizar la vista de reportes
    const renderReportsView = () => {
      if (!selectedManufacturingOrder) {
        return (
          <Alert severity="warning" sx={{ my: 3 }}>
            Para generar un reporte, primero debes seleccionar una orden de fabricación.
            <br />
            Ve a la pestaña "Órdenes" y haz clic en el botón de información de una orden.
          </Alert>
        );
      }
  
      return (
        <Box>
          <Card elevation={3} sx={{ mb: 4 }}>
            <CardHeader 
              title="Detalles del Reporte" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Orden:</strong> {selectedManufacturingOrder.order.order_code}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Artículo:</strong> {selectedManufacturingOrder.manufacturing_order.article_code}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Descripción:</strong> {selectedManufacturingOrder.manufacturing_order.description}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Estado:</strong> {selectedManufacturingOrder.order.status}
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
            </CardContent>
          </Card>
          
          {reportError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {reportError}
            </Alert>
          )}
          
          {showReportPreview && reportData.length > 0 && (
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
                  >
                    <thead>
                      <tr>
                        {Object.keys(reportData[0]).map(header => {
                          // Traducción de encabezados
                          const translations: Record<string, string> = {
                            order_code: 'Código de Orden',
                            article_code: 'Código de Artículo',
                            description: 'Descripción',
                            quantity: 'Cantidad',
                            status: 'Estado',
                            start_time: 'Hora Inicio',
                            end_time: 'Hora Fin',
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
                            comments: 'Comentarios'
                          };
                          
                          return (
                            <th key={header} style={{ 
                              padding: '8px 16px', 
                              backgroundColor: '#1976d2', 
                              color: 'white',
                              fontWeight: 'bold',
                              textAlign: 'left'
                            }}>
                              {translations[header] || header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, rowIndex) => (
                        <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#f5f5f5' : 'white' }}>
                          {Object.entries(row).map(([key, value], cellIndex) => {
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
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
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
  
    // Renderizar el contenido principal basado en la pestaña seleccionada
    const renderContent = () => {
      if (mainTab === 0) {
        // Mostrar el dashboard
        return <DashboardReports />;
      } else if (mainTab === 2) {
        // Mostrar la vista de reportes
        return renderReportsView();
      } else {
        // Mostrar la vista de órdenes
        if (viewingDetails) {
          return detailsTab === 0 
            ? renderManufacturingOrderDetails() 
            : renderCleaningOrderDetails();
        } else {
          return (
            <>
              <Paper sx={{ mb: 3 }} elevation={2}>
                <Tabs
                  value={detailsTab}
                  onChange={handleDetailsTabChange}
                  variant="fullWidth"
                  centered
                >
                  <Tab 
                    icon={<ShippingIcon />} 
                    label="Órdenes de Fabricación" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<CleaningIcon />} 
                    label="Órdenes de Limpieza" 
                    iconPosition="start"
                  />
                </Tabs>
              </Paper>
              
              {detailsTab === 0 ? renderManufacturingOrdersList() : renderCleaningOrdersList()}
            </>
          );
        }
      }
    };
  
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {mainTab === 0 ? 'Dashboard' : 
                mainTab === 2 ? 'Reportes' :
                (viewingDetails ? 
                  (detailsTab === 0 ? 'Detalles de Orden de Fabricación' : 'Detalles de Orden de Limpieza') : 
                  'Listado de Órdenes'
                )
              }
            </Typography>
            
            <Tooltip title="Refrescar datos">
              <IconButton onClick={handleRefresh} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {error && (
            <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: '#FFF4F4' }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          )}
          
          {/* Tabs principales */}
          <Paper sx={{ mb: 3 }} elevation={2}>
            <Tabs
              value={mainTab}
              onChange={handleMainTabChange}
              variant="fullWidth"
              centered
            >
              <Tab 
                icon={<DashboardIcon />} 
                label="Dashboard" 
                iconPosition="start"
              />
              <Tab
                icon={<ChartIcon />} 
                label="Órdenes" 
                iconPosition="start"
              />
              <Tab
                icon={<ReportIcon />} 
                label="Reportes" 
                iconPosition="start"
              />
            </Tabs>
          </Paper>
        
          {isLoading && mainTab !== 2 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderContent()
          )}
        </Box>
      </Container>
    );
  };
  
  export default CremerDetails;