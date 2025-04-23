// File: src/components/CremerDetails/ManufacturingOrderDetails.js
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
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { formatDate, getStatusColor, formatTimeInMinutes, getMetricTooltip } from '../../CREMER/utils/helpers';

const ManufacturingOrderDetails = ({ order, handleBackToList, isMobile }) => {
  if (!order) return null;
  
  const { order: orderData, manufacturing_order, time_stats, pauses } = order;
  
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
              title="Detalles de Producción" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Tasa de Producción Objetivo:</strong> {manufacturing_order.target_production_rate} unidades/min
                  <Tooltip title={getMetricTooltip('target_production_rate')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Typography>
              <Typography variant="body2" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Tasa de Producción Real:</strong> {realProductionRate} unidades/min
                  <Tooltip title={getMetricTooltip('actual_rate')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Typography>
              <Typography variant="body2" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Unidades Buenas:</strong> {manufacturing_order.good_units.toLocaleString()}
                  <Tooltip title={getMetricTooltip('good_units')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Typography>
              <Typography variant="body2" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Unidades Defectuosas:</strong> {manufacturing_order.defective_units.toLocaleString()}
                  <Tooltip title={getMetricTooltip('defective_units')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Total Producido:</strong> {manufacturing_order.total_produced.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Porcentaje de Completado:</strong> {manufacturing_order.completion_percentage}%
                  <Tooltip title={getMetricTooltip('completion_percentage')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
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
              <Typography variant="body2" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Duración Total:</strong> {formatTimeInMinutes(time_stats.total_duration)}
                  <Tooltip title={getMetricTooltip('total_duration')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Typography>
              <Typography variant="body2" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Tiempo Total de Pausa:</strong> {formatTimeInMinutes(time_stats.total_pause_time)}
                  <Tooltip title={getMetricTooltip('total_pause_time')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Typography>
              <Typography variant="body2">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Tiempo Efectivo de Producción:</strong> {formatTimeInMinutes(time_stats.effective_production_time)}
                  <Tooltip title={getMetricTooltip('effective_production_time')}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Pausas" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            />
            <CardContent>
              {pauses.length === 0 ? (
                <Typography variant="body2">No hay pausas registradas</Typography>
              ) : (
                <TableContainer className="responsive-table">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Razón</TableCell>
                        {!isMobile && (
                          <>
                            <TableCell>Inicio</TableCell>
                            <TableCell>Fin</TableCell>
                          </>
                        )}
                        <TableCell>Duración</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pauses.map((pause) => (
                        <TableRow key={pause.id} className="hover-row">
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {pause.reason}
                              <Tooltip title={getMetricTooltip('reason')}>
                                <IconButton size="small" sx={{ ml: 1 }}>
                                  <HelpIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            {isMobile && (
                              <Typography variant="caption" display="block">
                                {formatDate(pause.start_time)} → {formatDate(pause.end_time)}
                              </Typography>
                            )}
                          </TableCell>
                          {!isMobile && (
                            <>
                              <TableCell>{formatDate(pause.start_time)}</TableCell>
                              <TableCell>{formatDate(pause.end_time)}</TableCell>
                            </>
                          )}
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {formatTimeInMinutes(pause.duration_ms)}
                              <Tooltip title={getMetricTooltip('duration_minutes')}>
                                <IconButton size="small" sx={{ ml: 1 }}>
                                  <HelpIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManufacturingOrderDetails;