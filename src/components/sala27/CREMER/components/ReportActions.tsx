import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  ButtonGroup, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Snackbar,
  Alert,
  Divider,
  AlertColor
} from '@mui/material';
import { 
  InsertDriveFile as FileIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import PDFPreviewDialog from './PDFPreviewDialog';
import { PDFDownloadButton } from './OrderReportPDF';

// Interfaces
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

interface ReportActionsProps {
  orderSummary: OrderSummary;
  analysis?: ProductionAnalysis | null;
  formatTimestamp: (timestamp?: string) => string;
}

// Componente centralizado para acciones relacionadas con reportes
const ReportActions: React.FC<ReportActionsProps> = ({ orderSummary, analysis, formatTimestamp }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<AlertColor>('success');
  
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const showAlert = (message: string, severity: AlertColor = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };
  
  const handleCloseAlert = () => {
    setAlertOpen(false);
  };
  
  const handlePrint = () => {
    handleMenuClose();
    showAlert('Funcionalidad de impresión en desarrollo');
  };
  
  const handleShare = () => {
    handleMenuClose();
    
    // Simular compartir vía correo electrónico u otra plataforma
    if (navigator.share) {
      navigator.share({
        title: `Reporte de producción: ${orderSummary.product}`,
        text: `Reporte de producción para la orden de ${orderSummary.product} completada el ${formatTimestamp(orderSummary.times.end)}`,
      }).then(() => {
        showAlert('Reporte compartido correctamente');
      }).catch(() => {
        showAlert('Error al compartir el reporte', 'error');
      });
    } else {
      showAlert('La funcionalidad de compartir no está disponible en este navegador', 'warning');
    }
  };
  
  const handleExportExcel = () => {
    handleMenuClose();
    showAlert('Exportación a Excel en desarrollo');
  };
  
  if (!orderSummary) return null;
  
  return (
    <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
      <Box>
        <ButtonGroup variant="contained">
          {/* Vista Previa del Reporte */}
          <PDFPreviewDialog 
            orderSummary={orderSummary}
            analysis={analysis}
            formatTimestamp={formatTimestamp}
          />
          
          {/* Botón de Descarga Directa */}
          <PDFDownloadButton 
            orderSummary={orderSummary} 
            analysis={analysis}
            formatTimestamp={formatTimestamp}
          />
          
          {/* Menú de Opciones Adicionales */}
          <Button color="primary" onClick={handleMenuClick}>
            <ArrowDownIcon />
          </Button>
        </ButtonGroup>
        
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handlePrint}>
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Imprimir</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Compartir</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleExportExcel}>
            <ListItemIcon>
              <FileIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Exportar a Excel</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
      
      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportActions;