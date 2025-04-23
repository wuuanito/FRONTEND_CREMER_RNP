// src/components/Dashboard/components/Overview/DashboardOverview.js
import React, { useState } from 'react';
import { Box, Grid, Fade, Zoom } from '@mui/material';
import { useDashboard } from '../../context/DashboardContext';
import { useColors } from '../../constants';

// Importar componentes comunes
import DashboardHeader from '../common/DashboardHeader';
import OverviewStats from './OverviewStats';
import OverviewCharts from './OverviewCharts';

const DashboardOverview = ({ data }) => {
  const { 
    autoRefresh, 
    compactView, 
    activeCards,
    setAutoRefresh, 
    setCompactView, 
    toggleFullscreen, 
    toggleCardVisibility,
    fetchAllReports,
  } = useDashboard();

  const [activePieIndex, setActivePieIndex] = useState(0);
  const [activeRadarIndex, setActiveRadarIndex] = useState(0);
  const colors = useColors();

  // Si no hay datos, no renderizar nada
  if (!data) return null;
  
  const { production, pauses, maintenance, cleaning, period } = data;

  return (
    <Box>
      <DashboardHeader 
        title="Panel de Control - Periodo"
        subtitle={`${period.days} días`}
        startDate={period.start_date}
        endDate={period.end_date}
        backgroundGradient="linear-gradient(90deg, #2c3e50, #4ca1af)"
        autoRefresh={autoRefresh}
        compactView={compactView}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onToggleCompactView={() => setCompactView(!compactView)}
        onToggleFullscreen={toggleFullscreen}
        onRefresh={fetchAllReports}
      />
      
      <Grid container spacing={3}>
        {/* Tarjetas de estadísticas */}
        <OverviewStats 
          production={production}
          pauses={pauses}
          maintenance={maintenance}
          cleaning={cleaning}
          colors={colors}
          activeCards={activeCards}
          toggleCardVisibility={toggleCardVisibility}
        />
        
        {/* Gráficos */}
        <OverviewCharts 
          production={production}
          pauses={pauses}
          maintenance={maintenance}
          cleaning={cleaning}
          colors={colors}
          activePieIndex={activePieIndex}
          setActivePieIndex={setActivePieIndex}
          activeRadarIndex={activeRadarIndex}
          setActiveRadarIndex={setActiveRadarIndex}
        />
      </Grid>
    </Box>
  );
};

export default DashboardOverview;