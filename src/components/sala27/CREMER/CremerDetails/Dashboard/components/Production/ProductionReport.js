// src/components/Dashboard/components/Production/ProductionReport.js
import React, { useState } from 'react';
import { Box, Grid, Fade, Zoom } from '@mui/material';
import { 
  ProductionQuantityLimits as ProductionIcon,
  Schedule as ScheduleIcon,
  BarChart as BarChartIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';

import { useDashboard } from '../../context/DashboardContext';
import { useColors } from '../../constants';
import { formatTime, formatPercentage } from '../../utils/formatters';

// Importar componentes comunes
import DashboardHeader from '../common/DashboardHeader';
import FilterPanel from '../common/FilterPanel';
import ChartCard from '../common/ChartCard';
import TableCard from '../common/TableCard';
import ProductionStats from './ProductionStats';
import ProductionCharts from './ProductionCharts';
import ProductionTable from './ProductionTable';

const ProductionReport = ({ data }) => {
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
  
  const { summary, orders, period } = data;

  const handleApplyFilters = () => {
    fetchAllReports();
    setShowFilters(false);
  };

  return (
    <Box>
      <DashboardHeader 
        title="Reporte de Producción"
        subtitle={`Artículo: ${period.article_code}`}
        startDate={period.start_date}
        endDate={period.end_date}
        backgroundGradient="linear-gradient(90deg, #1b5e20, #43a047)"
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
          buttonColor="success"
        />
      )}
      
      <Grid container spacing={3}>
        {/* Estadísticas de producción */}
        <ProductionStats summary={summary} colors={colors} />
        
        {/* Gráficos de producción */}
        <ProductionCharts summary={summary} colors={colors} />
        
        {/* Gráfico de tendencia */}
        <Grid item xs={12}>
          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
            <Box>
              <ChartCard 
                title="Análisis de Órdenes de Producción"
                icon={<BarChartIcon fontSize="small" />}
                color={colors.production}
                chart={<ProductionCharts.TrendChart orders={orders} colors={colors} />}
              />
            </Box>
          </Zoom>
        </Grid>
        
        {/* Tabla de órdenes */}
        <Grid item xs={12}>
          <Fade in={true} style={{ transitionDelay: '500ms' }}>
            <Box>
              <ProductionTable orders={orders} />
            </Box>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductionReport;