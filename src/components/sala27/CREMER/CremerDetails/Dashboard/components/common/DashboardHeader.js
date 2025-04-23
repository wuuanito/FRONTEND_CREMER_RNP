// src/components/Dashboard/components/common/DashboardHeader.js
import React from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { 
  Autorenew as AutorenewIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';

import { formatDate, getCurrentDateTime } from '../../utils/formatters';

const DashboardHeader = ({ 
  title, 
  subtitle, 
  startDate, 
  endDate, 
  backgroundGradient, 
  showFilters, 
  autoRefresh, 
  compactView, 
  isLoading, 
  onRefresh, 
  onToggleAutoRefresh, 
  onToggleCompactView, 
  onToggleFullscreen, 
  onToggleFilters 
}) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        background: backgroundGradient || 'linear-gradient(90deg, #2c3e50, #4ca1af)',
        color: 'white'
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight="bold">
          {title}
          {startDate && endDate && `: ${formatDate(startDate)} - ${formatDate(endDate)}`}
        </Typography>
        <Typography variant="subtitle1">
          {subtitle} • Última actualización: {getCurrentDateTime()}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        {onToggleFilters && (
          <Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
            <IconButton 
              onClick={onToggleFilters} 
              color="inherit"
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {onToggleAutoRefresh && (
          <Tooltip title={autoRefresh ? "Desactivar auto-refresco" : "Activar auto-refresco"}>
            <IconButton 
              onClick={onToggleAutoRefresh} 
              color="inherit"
            >
              <AutorenewIcon sx={{ opacity: autoRefresh ? 1 : 0.5 }} />
            </IconButton>
          </Tooltip>
        )}
        
        {onToggleCompactView && (
          <Tooltip title={compactView ? "Vista normal" : "Vista compacta"}>
            <IconButton 
              onClick={onToggleCompactView} 
              color="inherit"
            >
              {compactView ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Tooltip>
        )}
        
        {onToggleFullscreen && (
          <Tooltip title="Pantalla completa">
            <IconButton 
              onClick={onToggleFullscreen} 
              color="inherit"
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {onRefresh && (
          <Tooltip title="Refrescar datos">
            <IconButton 
              onClick={onRefresh} 
              color="inherit"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

export default DashboardHeader;