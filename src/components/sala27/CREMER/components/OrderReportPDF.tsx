import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  BlobProvider,
  Font
} from '@react-pdf/renderer';
import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

// Interfaces para nuestros tipos de datos
interface Pause {
  id: string;
  orderId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  reason: string;
  isActive: boolean;
  formattedDuration?: string;
}

interface OrderSummary {
  id: string;
  product: string;
  quantity: number;
  status: string;
  times: {
    start?: string;
    end?: string;
    totalActive: number;
    totalPause: number;
    total: number;
    formattedTotalActive: string;
    formattedTotalPause: string;
    formattedTotal: string;
  };
  production: {
    countGood: number;
    countBad: number;
    total: number;
    defectRate?: number;
    productionRate?: number;
    formattedProductionRate?: string;
  };
  notes: {
    initial?: string;
    final?: string;
  };
  pauses: Array<Pause>;
}

interface ProductionAnalysis {
  timeIntervals: Array<{
    hour: string;
    good: number;
    bad: number;
    total: number;
  }>;
  productionRate: number;
  averageRate: {
    good: number;
    bad: number;
    total: number;
  };
}

interface OrderReportPDFProps {
  orderSummary: OrderSummary;
  analysis?: ProductionAnalysis | null;
  formatTimestamp: (timestamp?: string) => string;
}

interface PDFDownloadButtonProps {
  orderSummary: OrderSummary;
  analysis?: ProductionAnalysis | null;
  formatTimestamp: (timestamp?: string) => string;
}

// Definimos los estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1976d2',
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 18,
    marginBottom: 10,
    color: '#1976d2',
    borderBottom: '1px solid #eeeeee',
    paddingBottom: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
    width: '100%',
  },
  infoItem: {
    width: '50%',
    marginBottom: 5,
  },
  infoItemFull: {
    width: '100%',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 10,
    color: '#555555',
  },
  infoValue: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    flexDirection: 'column',
    width: 'auto',
    marginTop: 10,
    marginBottom: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  tableCell: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#eeeeee',
    textAlign: 'center',
    fontSize: 10,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
  notes: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    fontSize: 10,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  notesContent: {
    fontSize: 10,
  },
  summaryBox: {
    border: '1px solid #eeeeee',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555555',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#666666',
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    marginTop: 10,
    marginBottom: 10,
  },
  productionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  statLabel: {
    fontSize: 10,
    color: '#555555',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  timelineContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  timelineEvent: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  timelineTime: {
    width: '25%',
    fontSize: 10,
  },
  timelineDescription: {
    width: '75%',
    fontSize: 10,
  },
  tableWrap: {
    marginTop: 5,
    marginBottom: 5,
  },
  tableCellBad: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#eeeeee',
    textAlign: 'center',
    fontSize: 10,
    backgroundColor: '#ffebee',
  },
  tableCellGood: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#eeeeee',
    textAlign: 'center',
    fontSize: 10,
    backgroundColor: '#e8f5e9',
  },
  // Nuevo estilo para porcentajes
  percentageRow: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 5,
  },
  percentageLabel: {
    width: '65%',
    fontSize: 10,
  },
  percentageValue: {
    width: '35%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Estilo para eficiencia
  efficiencyBox: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  efficiencyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  efficiencyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  // Estilos para cabecera con info de empresa
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1px solid #eeeeee',
    paddingBottom: 10,
  },
  companyInfo: {
    width: '60%',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  companyDetails: {
    fontSize: 9,
    color: '#666666',
  },
  reportInfo: {
    width: '40%',
    textAlign: 'right',
  },
  reportLabel: {
    fontSize: 9,
    color: '#666666',
  },
  reportValue: {
    fontSize: 10,
    color: '#333333',
  }
});

// Componente para el PDF de la Orden (versión ampliada con todos los detalles)
const OrderReportPDF: React.FC<OrderReportPDFProps> = ({ orderSummary, analysis, formatTimestamp }) => {
  // Calcular algunos valores adicionales para el reporte
  const completionPercentage = orderSummary.production.total > 0 
    ? Math.min(Math.round((orderSummary.production.total / orderSummary.quantity) * 100), 100)
    : 0;
    
  const efficiencyPercentage = orderSummary.times.total > 0
    ? Math.round((orderSummary.times.totalActive / orderSummary.times.total) * 100)
    : 0;

  const goodItemsPercentage = orderSummary.production.total > 0
    ? Math.round((orderSummary.production.countGood / orderSummary.production.total) * 100)
    : 0;
  
  // Crear una cronología completa de eventos
  type TimelineEvent = {
    time: string;
    description: string;
    type: 'start' | 'pause' | 'resume' | 'end';
  };
  
  const timelineEvents: TimelineEvent[] = [];
  
  // Añadir evento de inicio
  if (orderSummary.times.start) {
    timelineEvents.push({
      time: orderSummary.times.start,
      description: 'Inicio de la producción',
      type: 'start'
    });
  }
  
  // Añadir pausas
  orderSummary.pauses.forEach(pause => {
    if (pause.startTime) {
      timelineEvents.push({
        time: pause.startTime,
        description: `Pausa iniciada: ${pause.reason}`,
        type: 'pause'
      });
    }
    
    if (pause.endTime) {
      timelineEvents.push({
        time: pause.endTime,
        description: 'Producción reanudada',
        type: 'resume'
      });
    }
  });
  
  // Añadir evento de finalización
  if (orderSummary.times.end) {
    timelineEvents.push({
      time: orderSummary.times.end,
      description: 'Finalización de la producción',
      type: 'end'
    });
  }
  
  // Ordenar eventos cronológicamente
  timelineEvents.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera con información de la empresa */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>SISTEMA DE MONITORIZACIÓN DE FABRICACIÓN</Text>
            <Text style={styles.companyDetails}>Reporte generado el {new Date().toLocaleString()}</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportLabel}>ORDEN ID:</Text>
            <Text style={styles.reportValue}>{orderSummary.id}</Text>
            <Text style={styles.reportLabel}>PRODUCTO:</Text>
            <Text style={styles.reportValue}>{orderSummary.product}</Text>
          </View>
        </View>

        {/* Encabezado */}
        <Text style={styles.header}>Reporte Completo de Producción</Text>
        
        {/* Resumen clave de la orden */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Resumen Ejecutivo</Text>
          
          <View style={styles.productionStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Cumplimiento de Objetivo</Text>
              <Text style={styles.statValue}>{completionPercentage}%</Text>
              <Text style={styles.statLabel}>{orderSummary.production.total} / {orderSummary.quantity} unidades</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Eficiencia de Producción</Text>
              <Text style={styles.statValue}>{efficiencyPercentage}%</Text>
              <Text style={styles.statLabel}>Tiempo activo vs. total</Text>
            </View>
          </View>
          
          <View style={styles.productionStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Calidad de Producción</Text>
              <Text style={styles.statValue}>{goodItemsPercentage}%</Text>
              <Text style={styles.statLabel}>Unidades buenas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tasa de Defectos</Text>
              <Text style={styles.statValue}>{orderSummary.production.defectRate ? orderSummary.production.defectRate.toFixed(2) : '0'}%</Text>
              <Text style={styles.statLabel}>Unidades defectuosas</Text>
            </View>
          </View>
        </View>
        
        {/* Información General */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Información General de la Orden</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ID de Orden:</Text>
              <Text style={styles.infoValue}>{orderSummary.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Producto:</Text>
              <Text style={styles.infoValue}>{orderSummary.product}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cantidad Objetivo:</Text>
              <Text style={styles.infoValue}>{orderSummary.quantity}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Estado Final:</Text>
              <Text style={styles.infoValue}>{orderSummary.status}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fecha de Creación:</Text>
              <Text style={styles.infoValue}>{formatTimestamp(orderSummary.times.start)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fecha de Finalización:</Text>
              <Text style={styles.infoValue}>{formatTimestamp(orderSummary.times.end)}</Text>
            </View>
          </View>
          
          {/* Notas iniciales si existen */}
          {orderSummary.notes.initial && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notas Iniciales:</Text>
              <Text style={styles.notesContent}>{orderSummary.notes.initial}</Text>
            </View>
          )}
        </View>
        
        {/* Detalle de tiempos */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Análisis Detallado de Tiempos</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Inicio de Producción:</Text>
              <Text style={styles.infoValue}>{formatTimestamp(orderSummary.times.start)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fin de Producción:</Text>
              <Text style={styles.infoValue}>{formatTimestamp(orderSummary.times.end)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tiempo Total:</Text>
              <Text style={styles.infoValue}>{orderSummary.times.formattedTotal}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tiempo Activo:</Text>
              <Text style={styles.infoValue}>{orderSummary.times.formattedTotalActive}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tiempo de Pausas:</Text>
              <Text style={styles.infoValue}>{orderSummary.times.formattedTotalPause}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tiempo Efectivo:</Text>
              <Text style={styles.infoValue}>
                {orderSummary.times.total ? 
                  `${((orderSummary.times.totalActive / orderSummary.times.total) * 100).toFixed(2)}%` : 
                  'N/A'}
              </Text>
            </View>
          </View>
          
          {/* Caja de eficiencia */}
          <View style={styles.efficiencyBox}>
            <Text style={styles.efficiencyTitle}>Eficiencia de Producción</Text>
            <Text style={styles.efficiencyValue}>{efficiencyPercentage}%</Text>
            <View style={styles.percentageRow}>
              <Text style={styles.percentageLabel}>Porcentaje de tiempo activo:</Text>
              <Text style={styles.percentageValue}>{orderSummary.times.total ? ((orderSummary.times.totalActive / orderSummary.times.total) * 100).toFixed(2) : 0}%</Text>
            </View>
            <View style={styles.percentageRow}>
              <Text style={styles.percentageLabel}>Porcentaje de tiempo en pausas:</Text>
              <Text style={styles.percentageValue}>{orderSummary.times.total ? ((orderSummary.times.totalPause / orderSummary.times.total) * 100).toFixed(2) : 0}%</Text>
            </View>
          </View>
        </View>
        
        {/* Resultados de Producción */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Resultados Detallados de Producción</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Botes Buenos:</Text>
              <Text style={styles.infoValue}>{orderSummary.production.countGood}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Botes Malos:</Text>
              <Text style={styles.infoValue}>{orderSummary.production.countBad}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total Producido:</Text>
              <Text style={styles.infoValue}>{orderSummary.production.total}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Porcentaje Completado:</Text>
              <Text style={styles.infoValue}>{completionPercentage}%</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tasa de Defectos:</Text>
              <Text style={styles.infoValue}>
                {orderSummary.production.defectRate ? `${orderSummary.production.defectRate.toFixed(2)}%` : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Producción por Minuto:</Text>
              <Text style={styles.infoValue}>
                {orderSummary.production.formattedProductionRate || 'N/A'}
              </Text>
            </View>
          </View>
          
          {/* Análisis de Producción (si está disponible) */}
          {analysis && (
            <View style={styles.tableWrap}>
              <Text style={styles.sectionTitle}>Análisis de Tasas de Producción</Text>
              <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tasa Media (unid./min):</Text>
                  <Text style={styles.infoValue}>{analysis.productionRate.toFixed(2)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Media por Hora:</Text>
                  <Text style={styles.infoValue}>{analysis.averageRate.total.toFixed(2)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Buenas/Hora:</Text>
                  <Text style={styles.infoValue}>{analysis.averageRate.good.toFixed(2)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Malas/Hora:</Text>
                  <Text style={styles.infoValue}>{analysis.averageRate.bad.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Page>
      
      {/* Segunda página - Historial de pausas y análisis por hora */}
      <Page size="A4" style={styles.page}>
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>SISTEMA DE MONITORIZACIÓN DE FABRICACIÓN</Text>
            <Text style={styles.companyDetails}>Reporte generado el {new Date().toLocaleString()}</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportLabel}>ORDEN ID:</Text>
            <Text style={styles.reportValue}>{orderSummary.id}</Text>
            <Text style={styles.reportLabel}>PRODUCTO:</Text>
            <Text style={styles.reportValue}>{orderSummary.product}</Text>
          </View>
        </View>
        
        {/* Historial detallado de pausas */}
        {orderSummary.pauses && orderSummary.pauses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subheader}>Historial Detallado de Pausas</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, { width: '20%' }]}>
                  <Text style={styles.tableHeaderCell}>Inicio</Text>
                </View>
                <View style={[styles.tableCell, { width: '20%' }]}>
                  <Text style={styles.tableHeaderCell}>Fin</Text>
                </View>
                <View style={[styles.tableCell, { width: '15%' }]}>
                  <Text style={styles.tableHeaderCell}>Duración</Text>
                </View>
                <View style={[styles.tableCell, { width: '45%' }]}>
                  <Text style={styles.tableHeaderCell}>Motivo</Text>
                </View>
              </View>
              
              {orderSummary.pauses.map((pause, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, { width: '20%' }]}>
                    <Text>{formatTimestamp(pause.startTime)}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: '20%' }]}>
                    <Text>{pause.endTime ? formatTimestamp(pause.endTime) : '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: '15%' }]}>
                    <Text>{pause.formattedDuration || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: '45%' }]}>
                    <Text>{pause.reason}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Datos adicionales sobre pausas */}
            <View style={styles.summaryBox}>
              <Text style={styles.sectionTitle}>Resumen de Pausas</Text>
              <Text style={styles.infoLabel}>Total de pausas: {orderSummary.pauses.length}</Text>
              <Text style={styles.infoLabel}>Tiempo total en pausas: {orderSummary.times.formattedTotalPause}</Text>
              <Text style={styles.infoLabel}>Tiempo medio por pausa: {orderSummary.pauses.length > 0 
                ? Math.round(orderSummary.times.totalPause / orderSummary.pauses.length) + " segundos"
                : "N/A"}</Text>
            </View>
          </View>
        )}
        
        {/* Cronología de eventos */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Cronología de Eventos</Text>
          <View style={styles.timelineContainer}>
            {timelineEvents.map((event, index) => (
              <View key={index} style={styles.timelineEvent}>
                <Text style={styles.timelineTime}>{formatTimestamp(event.time)}</Text>
                <Text style={styles.timelineDescription}>{event.description}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Análisis de Producción por Hora */}
        {analysis && analysis.timeIntervals && analysis.timeIntervals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subheader}>Análisis de Producción por Hora</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text style={styles.tableHeaderCell}>Hora</Text>
                </View>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text style={styles.tableHeaderCell}>Buenos</Text>
                </View>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text style={styles.tableHeaderCell}>Malos</Text>
                </View>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text style={styles.tableHeaderCell}>Total</Text>
                </View>
              </View>
              
              {analysis.timeIntervals.map((interval, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, { width: '25%' }]}>
                    <Text>{interval.hour}</Text>
                  </View>
                  <View style={[styles.tableCellGood, { width: '25%' }]}>
                    <Text>{interval.good}</Text>
                  </View>
                  <View style={[styles.tableCellBad, { width: '25%' }]}>
                    <Text>{interval.bad}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: '25%' }]}>
                    <Text>{interval.total}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Notas Finales */}
        {orderSummary.notes.final && (
          <View style={styles.section}>
            <Text style={styles.subheader}>Notas Finales</Text>
            <View style={styles.notes}>
              <Text style={styles.notesContent}>{orderSummary.notes.final}</Text>
            </View>
          </View>
        )}
        
        {/* Pie de página */}
        <View style={styles.footer}>
          <Text>Reporte completo de fabricación - Sistema de Monitorización - Página 2</Text>
        </View>
        <Text style={styles.pageNumber}>2</Text>
      </Page>
    </Document>
  );
};

// Componente wrapper para el botón de descarga del PDF
const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ orderSummary, analysis, formatTimestamp }) => {
  if (!orderSummary) return null;
  
  return (
    <BlobProvider 
      document={
        <OrderReportPDF 
          orderSummary={orderSummary} 
          analysis={analysis}
          formatTimestamp={formatTimestamp}
        />
      }
    >
      {({ blob, url, loading, error }) => {
        if (error) {
          return (
            <Button
              variant="contained"
              color="error"
              disabled
              startIcon={<DownloadIcon />}
            >
              Error al generar PDF
            </Button>
          );
        }
        return (
            <Button
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={<DownloadIcon />}
              component="a"
              href={url || "#"}
              download={`reporte_${orderSummary.product.replace(/\s+/g, '_')}_${orderSummary.id.substring(0, 8)}.pdf`}
            >
              {loading ? 'Generando PDF...' : 'Descargar Reporte PDF'}
            </Button>
          );
        }}
      </BlobProvider>
    );
  };
  
  export { OrderReportPDF, PDFDownloadButton };