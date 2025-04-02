import React, { useState, useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Button, 
  IconButton, 
  Box,
  AppBar,
  Toolbar,
  Typography
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Visibility as VisibilityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { PDFViewer, BlobProvider } from '@react-pdf/renderer';
import { OrderReportPDF } from './OrderReportPDF';

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

interface PDFPreviewDialogProps {
  orderSummary: OrderSummary;
  analysis?: ProductionAnalysis | null;
  formatTimestamp: (timestamp?: string) => string;
}

// Componente para la vista previa del PDF
const PDFPreviewDialog = ({ orderSummary, analysis, formatTimestamp }: PDFPreviewDialogProps) => {
  const [open, setOpen] = useState<boolean>(false);
  // Guardar una snapshot de los datos cuando se abre el diálogo
  const [snapshotData, setSnapshotData] = useState<{
    orderSummary: OrderSummary;
    analysis?: ProductionAnalysis | null;
  } | null>(null);

  const handleOpen = useCallback(() => {
    // Tomar una captura de los datos al abrir
    // Hacemos una copia profunda para evitar problemas de referencia
    setSnapshotData({
      orderSummary: JSON.parse(JSON.stringify(orderSummary)),
      analysis: analysis ? JSON.parse(JSON.stringify(analysis)) : null
    });
    setOpen(true);
  }, [orderSummary, analysis]);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Opcional: Limpiar los datos del snapshot después de cerrar
    // setTimeout(() => setSnapshotData(null), 300);
  }, []);

  // Memoizar el botón para evitar re-renders innecesarios
  const previewButton = useMemo(() => (
    <Button
      variant="outlined"
      color="primary"
      startIcon={<VisibilityIcon />}
      onClick={handleOpen}
      sx={{ mr: 1 }}
    >
      Vista Previa
    </Button>
  ), [handleOpen]);

  // No renderizar el contenido del diálogo a menos que esté abierto
  // Esto evita que React reaccione a cambios en las props cuando el diálogo está cerrado
  if (!open) {
    return previewButton;
  }

  // Usar datos del snapshot cuando está disponible, o los props actuales
  const dataToUse = snapshotData || { orderSummary, analysis };
  const filename = `reporte_${dataToUse.orderSummary.product.replace(/\s+/g, '_')}_${dataToUse.orderSummary.id.substring(0, 8)}.pdf`;

  return (
    <>
      {previewButton}

      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        PaperProps={{
          style: { backgroundColor: '#f5f5f5' }
        }}
      >
        <AppBar position="static" color="primary" sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
              Vista Previa del Reporte - {dataToUse.orderSummary.product}
            </Typography>
            <BlobProvider
              document={
                <OrderReportPDF 
                  orderSummary={dataToUse.orderSummary} 
                  analysis={dataToUse.analysis}
                  formatTimestamp={formatTimestamp}
                />
              }
            >
              {({ url, loading, error }) => (
                <Button 
                  color="inherit" 
                  startIcon={<DownloadIcon />}
                  disabled={loading || !!error}
                  component="a" 
                  href={url || "#"}
                  download={filename}
                >
                  {loading ? 'Preparando...' : 'Descargar'}
                </Button>
              )}
            </BlobProvider>
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: 'calc(100vh - 64px)', backgroundColor: '#f5f5f5' }}>
            <PDFViewer
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            >
              <OrderReportPDF
                orderSummary={dataToUse.orderSummary}
                analysis={dataToUse.analysis}
                formatTimestamp={formatTimestamp}
              />
            </PDFViewer>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Implementamos un comparador personalizado para React.memo
const areEqual = (prevProps: PDFPreviewDialogProps, nextProps: PDFPreviewDialogProps) => {
  // Solo re-renderizar si cambia el ID de la orden o algunos datos clave
  return (
    prevProps.orderSummary.id === nextProps.orderSummary.id &&
    prevProps.analysis?.productionRate === nextProps.analysis?.productionRate
  );
};

export default React.memo(PDFPreviewDialog, areEqual);