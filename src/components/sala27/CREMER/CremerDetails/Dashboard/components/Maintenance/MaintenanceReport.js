// src/components/Dashboard/components/Maintenance/MaintenanceReport.js
import React, { useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { Build as BuildIcon, CleaningServices as CleaningIcon } from '@mui/icons-material';

import { useDashboard } from '../../context/DashboardContext';
import { useColors } from '../../constants';

// Importar componentes comunes
import DashboardHeader from '../common/DashboardHeader';
import FilterPanel from '../common/FilterPanel';
import CleaningSection from './CleaningSection';
import MaintenanceSection from './MaintenanceSection';

const MaintenanceReport = ({ data }) => {
  const { 
    startDate, 
    endDate, 
    showFilters, 
    setStartDate,
    setEndDate,
    setShowFilters,
    fetchAllReports 
  } = useDashboard();

  const colors = useColors();

  // Si no hay datos, no renderizar nada
  if (!data) return null;
  
  const { maintenance, cleaning, period } = data;

  const handleApplyFilters = () => {
    fetchAllReports();
    setShowFilters(false);
  };

  return (
    <Box>
      <DashboardHeader 
        title="Reporte de Mantenimiento y Limpieza"
        subtitle={`Tipo: ${period.type || 'Todos'}`}
        startDate={period.start_date}
        endDate={period.end_date}
        backgroundGradient="linear-gradient(90deg, #1565c0, #42a5f5)"
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={fetchAllReports}
      />
      
      {showFilters && (
        <FilterPanel 
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(value) => setStartDate(value)}
          onEndDateChange={(value) => setEndDate(value)}
          onApplyFilters={handleApplyFilters}
          buttonColor="primary"
        />
      )}
      
      <Grid container spacing={3}>
        {/* Sección de Limpieza */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ pl: 1, borderLeft: '4px solid #9c27b0', ml: 1 }}>
            Limpieza
          </Typography>
        </Grid>
        
        <CleaningSection cleaning={cleaning} colors={colors} />
        
        {/* Sección de Mantenimiento (solo si hay datos) */}
        {maintenance.total_orders > 0 && (
          <>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ pl: 1, borderLeft: '4px solid #2196f3', ml: 1, mt: 2 }}>
                Mantenimiento
              </Typography>
            </Grid>
            
            <MaintenanceSection maintenance={maintenance} colors={colors} />
          </>
        )}
      </Grid>
    </Box>
  );
};

export default MaintenanceReport;