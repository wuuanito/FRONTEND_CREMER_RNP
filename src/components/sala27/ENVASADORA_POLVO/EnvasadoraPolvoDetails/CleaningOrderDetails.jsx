// File: src/components/CremerDetails/CleaningOrderDetails.js
import React from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Chip, 
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { formatDate, getStatusColor, getMetricTooltip } from '../../CREMER/utils/helpers';

const CleaningOrderDetails = ({ order, handleBackToList, isMobile }) => {
  if (!order) return null;
  
  const { order: orderData, cleaning_order, time_stats } = order;
  
  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        variant="outlined" 
        onClick={handleBackToList}
        sx={{ mb: 2 }}
        fullWidth={isMobile}
      >
        Volver a la lista
      </Button>
      
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Información General" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            />
            <CardContent>
              <Typography variant="body2" gutterBottom>
                <strong>Código de Orden:</strong> {orderData.order_code}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Estado:</strong> <Chip 
                  label={orderData.status} 
                  size="small" 
                  color={getStatusColor(orderData.status)}
                />
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Fecha de Creación:</strong> {formatDate(orderData.created_at)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Inicio:</strong> {formatDate(orderData.start_time)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Fin:</strong> {formatDate(orderData.end_time)}
              </Typography>
              <Typography variant="body2">
                <strong>Notas:</strong> {orderData.notes || 'Sin notas'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Detalles de Limpieza" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Duración Estimada:</strong> {cleaning_order.estimated_duration_minutes} minutos
                  <Tooltip title={getMetricTooltip('estimated_duration_minutes')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
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
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            />
            <CardContent>
              {time_stats ? (
                <>
                  <Typography variant="body2" gutterBottom>
                    <strong>Duración Total:</strong> {time_stats.duration_ms ? 
                      formatDate(time_stats.duration_ms) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Duración en Minutos:</strong> {time_stats.duration_minutes !== undefined && 
                      time_stats.duration_minutes !== null
                      ? time_stats.duration_minutes.toFixed(2) + ' minutos'
                      : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <strong>Comparación Estimado vs Real:</strong> {time_stats.estimated_vs_actual !== undefined && 
                        time_stats.estimated_vs_actual !== null
                        ? (time_stats.estimated_vs_actual * 100).toFixed(2) + '%'
                        : 'N/A'}
                      <Tooltip title={getMetricTooltip('estimated_vs_actual')}>
                        <IconButton size="small" sx={{ ml: 1 }}>
                          <HelpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Typography>
                </>
              ) : (
                <Typography variant="body2">
                  No hay estadísticas de tiempo disponibles
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CleaningOrderDetails;