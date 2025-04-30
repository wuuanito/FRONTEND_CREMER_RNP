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
  Divider,
  Paper
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { formatDate, getStatusColor, formatTimeInMinutes } from '../../CREMER/utils/helpers';

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

  // Función para determinar el color de la discrepancia
  const getDiscrepancyColor = (percentage) => {
    if (percentage === null || percentage === undefined) return 'default';
    
    const absPercentage = Math.abs(percentage);
    if (absPercentage < 1) return 'success';
    if (absPercentage < 5) return 'warning';
    return 'error';
  };
  
  return (
    <Box sx={{ maxWidth: '100%' }}>
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
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader 
              title="Información General" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6', fontWeight: 'bold' }}
              sx={{ 
                pb: 1,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: 'rgba(0, 0, 0, 0.02)'
              }}
            />
            <CardContent sx={{ pt: 2 }}>
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
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader 
              title="Detalles de Producción" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6', fontWeight: 'bold' }}
              sx={{ 
                pb: 1,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: 'rgba(0, 0, 0, 0.02)'
              }}
            />
            <CardContent sx={{ pt: 2 }}>
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
        
        {/* Tarjeta para información de conteo por operario - UI mejorada */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
            <CardHeader 
              title="Conteo Manual del Operario" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6', fontWeight: 'bold' }}
              sx={{ 
                pb: 1,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: 'rgba(0, 0, 0, 0.02)'
              }}
            />
            <CardContent sx={{ pt: 2 }}>
              {manufacturing_order.operator_registered_units !== null && 
               manufacturing_order.operator_registered_units !== undefined ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Botes registrados por operario
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {manufacturing_order.operator_registered_units.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Botes registrados automáticamente
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {manufacturing_order.total_produced.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: Math.abs(manufacturing_order.discrepancy_percentage) < 1 
                      ? 'success.lighter' 
                      : Math.abs(manufacturing_order.discrepancy_percentage) < 5
                      ? 'warning.lighter'
                      : 'error.lighter'
                  }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Discrepancia
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`${manufacturing_order.unit_discrepancy > 0 ? '+' : ''}${manufacturing_order.unit_discrepancy} unidades`} 
                        size="small" 
                        color={getDiscrepancyColor(manufacturing_order.discrepancy_percentage)}
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Chip 
                        label={`${manufacturing_order.discrepancy_percentage > 0 ? '+' : ''}${manufacturing_order.discrepancy_percentage}%`} 
                        size="small" 
                        color={getDiscrepancyColor(manufacturing_order.discrepancy_percentage)}
                        sx={{ fontWeight: 'bold' }}
                        icon={Math.abs(manufacturing_order.discrepancy_percentage) > 5 ? <WarningIcon /> : undefined}
                      />
                    </Box>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No hay información de conteo manual disponible para esta orden
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader 
              title="Estadísticas de Tiempo" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6', fontWeight: 'bold' }}
              sx={{ 
                pb: 1,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: 'rgba(0, 0, 0, 0.02)'
              }}
            />
            <CardContent sx={{ pt: 2 }}>
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
        
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardHeader 
              title="Pausas" 
              titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6', fontWeight: 'bold' }}
              sx={{ 
                pb: 1,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: 'rgba(0, 0, 0, 0.02)'
              }}
            />
            <CardContent sx={{ pt: 0 }}>
              {pauses.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4 }}>No hay pausas registradas</Typography>
              ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 'none' }}>
                  <TableContainer 
                    sx={{ 
                      maxHeight: 300, 
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': {
                        width: '8px'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px'
                      }
                    }}
                  >
                    <Table 
                      size="small" 
                      stickyHeader 
                      aria-label="tabla de pausas"
                      sx={{ minWidth: isMobile ? 300 : 650 }}
                    >
                      <TableHead>
                        <TableRow sx={{ 
                          backgroundColor: 'primary.lighter',
                          '& th': { borderBottom: 'none' }
                        }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Razón</TableCell>
                          {!isMobile && (
                            <>
                              <TableCell sx={{ fontWeight: 'bold' }}>Inicio</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Fin</TableCell>
                            </>
                          )}
                          <TableCell sx={{ fontWeight: 'bold' }}>Duración</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pauses.map((pause, index) => (
                          <TableRow 
                            key={pause.id} 
                            hover
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                              transition: 'background-color 0.2s ease',
                              backgroundColor: index % 2 === 0 ? 'background.default' : 'background.paper'
                            }}
                          >
                            <TableCell sx={{ 
                              maxWidth: isMobile ? 150 : 'none',
                              whiteSpace: 'normal', 
                              wordBreak: 'break-word'
                            }}>
                              {pause.reason}
                              {isMobile && (
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
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
                              {formatTimeInMinutes(pause.duration_ms)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManufacturingOrderDetails;