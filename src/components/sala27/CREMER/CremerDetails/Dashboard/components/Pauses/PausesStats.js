// src/components/Dashboard/components/Pauses/PausesStats.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import { 
  Pause as PauseIcon,
} from '@mui/icons-material';

import ChartCard from '../common/ChartCard';
import { formatTime } from '../../utils/formatters';

const PausesStats = ({ summary }) => {
  return (
    <ChartCard 
      title="Resumen de Pausas"
      icon={<PauseIcon fontSize="small" />}
      color="#ff9800"
      chart={
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main" fontWeight="bold" sx={{ mb: 1 }}>
                {summary.total_pauses}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Pausas totales
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main" fontWeight="bold" sx={{ mb: 1 }}>
                {summary.total_pause_time_hours}h
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Tiempo total
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Tiempo total:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {formatTime(summary.total_pause_time_ms)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Categorías:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {summary.categories_count}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Tiempo promedio:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {formatTime(Math.round(summary.total_pause_time_ms / summary.total_pauses))} / pausa
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Impacto en producción:</Typography>
              <Typography variant="subtitle1" fontWeight="bold" color={
                summary.total_pause_time_ms / (24 * 60 * 60 * 1000) > 1 ? 'error.main' : 'warning.main'
              }>
                {(summary.total_pause_time_ms / (24 * 60 * 60 * 1000)).toFixed(2)} días
              </Typography>
            </Box>
          </Box>
        </Box>
      }
    />
  );
};

export default PausesStats;