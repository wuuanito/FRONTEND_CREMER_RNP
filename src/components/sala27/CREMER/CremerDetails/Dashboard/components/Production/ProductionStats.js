// src/components/Dashboard/components/Production/ProductionStats.js
import React from 'react';
import { Grid, Box, Fade, Typography } from '@mui/material';
import { 
  ProductionQuantityLimits as ProductionIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import { useDashboard } from '../../context/DashboardContext';
import { formatTime } from '../../utils/formatters';
import ChartCard from '../common/ChartCard';

const ProductionStats = ({ summary, colors }) => {
  const { compactView } = useDashboard();

  return (
    <>
      {/* Resumen de producción */}
      <Grid item xs={12} md={4}>
        <Fade in={true} style={{ transitionDelay: '100ms' }}>
          <Box>
            <ChartCard 
              title="Resumen de Producción"
              icon={<ProductionIcon fontSize="small" />}
              color={colors.good}
              compactView={compactView}
              chart={
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
                        {summary.total_orders}
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        Órdenes
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                        {summary.total_units.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        Unidades
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ px: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">Unidades buenas:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {summary.total_good_units.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">Unidades defectuosas:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {summary.total_defective_units.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">Tasa de defectos:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color={summary.defective_rate > 5 ? 'error.main' : 'success.main'}>
                        {summary.defective_rate}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">Tasa de producción:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {summary.production_rate_per_minute} u/min
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">Promedio por orden:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {summary.avg_good_units_per_order} unidades
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              }
            />
          </Box>
        </Fade>
      </Grid>
      
      {/* Tiempos de producción */}
      <Grid item xs={12} md={4}>
        <Fade in={true} style={{ transitionDelay: '200ms' }}>
          <Box>
            <ChartCard 
              title="Tiempos de Producción"
              icon={<ScheduleIcon fontSize="small" />}
              color="#2196f3"
              compactView={compactView}
              chart={
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="info.main" fontWeight="bold" sx={{ mb: 1 }}>
                        {summary.total_production_time_hours}h
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        Tiempo total
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                        {summary.efficiency_rate}%
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        Eficiencia
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ px: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">Tiempo de producción:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatTime(summary.total_production_time_ms)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">Tiempo de pausa:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                        {formatTime(summary.total_pause_time_ms)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">Tiempo efectivo:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                        {formatTime(summary.total_effective_time_ms)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">Tiempo promedio:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {summary.avg_production_time_minutes} min/orden
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">Pausa promedio:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {summary.avg_pause_time_minutes} min/orden
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              }
            />
          </Box>
        </Fade>
      </Grid>
    </>
  );
};

export default ProductionStats;