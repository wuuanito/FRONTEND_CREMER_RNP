import React, { useState, useRef } from 'react';
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
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  DateRange as DateRangeIcon,
  HelpOutline as HelpIcon 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getMetricTooltip } from '../../CREMER/utils/helpers';
import logoImg from '../../../../assets/logo.png'; // Asegúrate de tener un logo en esta ruta
// Logo alternativo en caso de que no exista el archivo

// Tipos de reportes disponibles
const reportTypes = [
  { id: 'manufacturing_detailed', name: 'Fabricación Detallado' },
  { id: 'production_efficiency', name: 'Eficiencia de Producción' },
  { id: 'downtime_analysis', name: 'Análisis de Tiempos Muertos' }
];

const ReportsView = ({ selectedManufacturingOrder, fetchManufacturingOrderDetails, manufacturingOrders }) => {
  const [selectedReportType, setSelectedReportType] = useState('manufacturing_detailed');
  const [reportData, setReportData] = useState([]);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Referencia para la tabla de vista previa
  const previewTableRef = useRef(null);
  
  // Función para manejar cambios en el tipo de reporte
  const handleReportTypeChange = (event) => {
    setSelectedReportType(event.target.value);
    // Reset preview
    setShowReportPreview(false);
    setReportData([]);
  };
  // Función para generar el reporte a partir de los datos de orden seleccionada
  const generateReport = () => {
    if (!selectedManufacturingOrder) {
      setReportError('No hay una orden de fabricación seleccionada para generar el reporte');
      return;
    }
    
    setGeneratingReport(true);
    setReportError(null);
    setReportData([]);
    
    try {
      let generatedData = [];
      
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
  
  // Función para exportar a PDF mejorada
  // Función para exportar a PDF mejorada
  const exportToPDF = () => {
    if (!reportData.length) {
      setReportError('No hay datos para exportar a PDF');
      return;
    }
    
    try {
      // Obtener encabezados y crear datos formateados
      const headers = Object.keys(reportData[0]);
      
      // Traducir los encabezados
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
        comments: 'Comentarios'
      };
      
      const translatedHeaders = headers.map(header => {
        return translations[header] || header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });
      
      // Formatear datos para la exportación
      const formattedData = reportData.map(row => {
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
      
      // Crear un nuevo documento PDF con orientación horizontal
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Paleta de colores profesional en tonos de gris
      const colors = {
        headerBackground: [240, 240, 240],     // Gris muy claro para el encabezado
        borderColor: [200, 200, 200],          // Gris medio para bordes
        alternateRowColor: [248, 248, 248],    // Gris ultra claro para filas alternadas
        textColor: [50, 50, 50]                // Gris oscuro para texto
      };
      
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
      
      // Fecha de generación en la parte derecha superior
      doc.setFontSize(10);
      doc.setTextColor(colors.textColor[0], colors.textColor[1], colors.textColor[2]);
      doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 230, 20);
      
      // Definir estilos de columnas para el PDF
      const columnStyles = {};
      translatedHeaders.forEach((header, index) => {
        columnStyles[index] = { 
          cellWidth: 'auto',
          halign: header.includes('%') || header.includes('Número') ? 'right' : 'left'
        };
      });
      
      // Agregar la tabla al PDF directamente después del encabezado
      doc.autoTable({
        head: [translatedHeaders],
        body: formattedData,
        startY: 40, // Comienza justo después del encabezado
        theme: 'grid',
        headStyles: {
          fillColor: colors.headerBackground,
          textColor: colors.textColor,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 8,
          cellPadding: 2
        },
        styles: {
          fontSize: 8,
          cellPadding: 1,
          lineColor: colors.borderColor,
          lineWidth: 0.1,
          valign: 'middle',
          textColor: colors.textColor
        },
        columnStyles: columnStyles,
        alternateRowStyles: {
          fillColor: colors.alternateRowColor
        },
        margin: { top: 40, right: 5, bottom: 15, left: 5 },
        didDrawPage: function(data) {
          // Añadir pie de página
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
          }
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
  const exportToExcel = () => {
    if (!reportData.length) {
      setReportError('No hay datos para exportar a Excel');
      return;
    }
    
    try {
      // Obtener encabezados
      const headers = Object.keys(reportData[0]);
      
      // Traducir los encabezados
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
        comments: 'Comentarios'
      };
      
      const translatedHeaders = headers.map(header => {
        return translations[header] || header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });
      
      // Formatear datos para la exportación
      const processedData = reportData.map(row => {
        const newRow = {};
        
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
  
  // Renderizado de la vista de reportes
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
                className="responsive-table"
              >
                <thead>
                  <tr>
                    {Object.keys(reportData[0]).map(header => {
                      // Traducción de encabezados
                      const translations = {
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
                      
                      const headerText = translations[header] || header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      
                      return (
                        <th key={header} style={{ 
                          padding: '8px 16px', 
                          backgroundColor: '#2e7d32', // Verde primario para coincider con el PDF
                          color: 'white',
                          fontWeight: 'bold',
                          textAlign: 'left'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {headerText}
                            {getMetricTooltip(header) !== 'No hay información adicional disponible.' && (
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