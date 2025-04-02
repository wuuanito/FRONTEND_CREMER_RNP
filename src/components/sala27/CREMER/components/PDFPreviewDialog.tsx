import React, { useState } from 'react';
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
const PDFPreviewDialog: React.FC<PDFPreviewDialogProps> = ({ orderSummary, analysis, formatTimestamp }) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<VisibilityIcon />}
        onClick={handleOpen}
        sx={{ mr: 1 }}
      >
        Vista Previa
      </Button>

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
              Vista Previa del Reporte - {orderSummary.product}
            </Typography>
            <BlobProvider
  document={
    <OrderReportPDF 
      orderSummary={orderSummary} 
      analysis={analysis}
      formatTimestamp={formatTimestamp}
    />
  }
>
  {({ blob, url, loading, error }) => (
    <Button 
      color="inherit" 
      startIcon={<DownloadIcon />}
      disabled={loading || !!error}
      component="a" // Aquí está la solución
      href={url || "#"}
      download={`reporte_${orderSummary.product.replace(/\s+/g, '_')}_${orderSummary.id.substring(0, 8)}.pdf`}
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
                orderSummary={orderSummary}
                analysis={analysis}
                formatTimestamp={formatTimestamp}
              />
            </PDFViewer>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFPreviewDialog;