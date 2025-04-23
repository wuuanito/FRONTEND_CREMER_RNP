// src/components/Dashboard/components/Pauses/PausesReport.js
import React, { useState } from 'react';
import { Box, Grid, Fade, Zoom } from '@mui/material';
import { 
  Pause as PauseIcon,
  Assessment as AssessmentIcon,
  DonutLarge as DonutIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import { useDashboard } from '../../context/DashboardContext';
import { useColors } from '../../constants';
import { formatTime } from '../../utils/formatters';

// Importar componentes comunes
import DashboardHeader from '../common/DashboardHeader';
import FilterPanel from '../common/FilterPanel';
import PausesStats from './PausesStats';
import PausesCharts from './PausesCharts';
import PausesTable from './PausesTable';

const PausesReport = ({ data }) => {
  const { 
    startDate, 
    endDate, 
    showFilters, 
    setStartDate,
    setEndDate,
    setShowFilters,
    fetchAllReports 
  } = useDashboard();

  const [activePieIndex, setActivePieIndex] = useState(0);
  const colors = useColors();

  // Si no hay datos, no renderizar nada
  if (!data) return null;
  
  const { summary, categories, period } = data;

  const handleApplyFilters = () => {
    fetchAllReports();
    setShowFilters(false);
  };

  // Datos para el gráfico de categorías
  const categoriesChartData = categories.map(cat => ({
    name: cat.category,
    value: cat.total_duration_ms,
    count: cat.count,
    percentage: parseFloat(cat.percentage_of_total)
  }));
  
  // Datos para el gráfico de razones
  let reasonsChartData = [];
  categories.forEach(cat => {
    cat.reasons.forEach(reason => {
      reasonsChartData.push({
        category: cat.category,
        name: reason.description,
        value: reason.total_duration_ms,
        count: reason.count,
        percentage: parseFloat(reason.percentage_of_total)
      });
    });
  });
  
  // Limitar a las principales razones para el gráfico
  reasonsChartData.sort((a, b) => b.value - a.value);
  const topReasons = reasonsChartData.slice(0, 8);

  return (
    <Box>
      <DashboardHeader 
        title="Reporte de Pausas"
        subtitle={`Categoría: ${period.category || 'Todas'}`}
        startDate={period.start_date}
        endDate={period.end_date}
        backgroundGradient="linear-gradient(90deg, #e65100, #ff9800)"
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
          buttonColor="warning"
        />
      )}
      
      <Grid container spacing={3}>
        {/* Estadísticas de pausas */}
        <Grid item xs={12} md={4}>
          <Fade in={true} style={{ transitionDelay: '100ms' }}>
            <Box>
              <PausesStats summary={summary} />
            </Box>
          </Fade>
        </Grid>
        
        {/* Gráficos de categorías de pausas */}
        <Grid item xs={12} md={8}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Box>
              <PausesCharts.CategoriesChart 
                data={categoriesChartData} 
                colors={colors} 
              />
            </Box>
          </Zoom>
        </Grid>
        
        {/* Gráficos de razones de pausas y distribución de tiempo */}
        <Grid item xs={12} md={6}>
          <Fade in={true} style={{ transitionDelay: '300ms' }}>
            <Box>
              <PausesCharts.ReasonsChart 
                data={topReasons} 
                colors={colors}
                activePieIndex={activePieIndex}
                setActivePieIndex={setActivePieIndex}
              />
            </Box>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Fade in={true} style={{ transitionDelay: '400ms' }}>
            <Box>
              <PausesCharts.TimeDistributionChart 
                categories={categories} 
                colors={colors}
              />
            </Box>
          </Fade>
        </Grid>
        
        {/* Tabla de pausas */}
        <Grid item xs={12}>
          <Zoom in={true} style={{ transitionDelay: '500ms' }}>
            <Box>
              <PausesTable categories={categories} colors={colors} />
            </Box>
          </Zoom>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PausesReport;