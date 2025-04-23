// src/components/Dashboard/components/Overview/OverviewStats.js
import React from 'react';
import { Grid, Box, Fade } from '@mui/material';
import { 
  ProductionQuantityLimits as ProductionIcon,
  Pause as PauseIcon,
  CleaningServices as CleaningIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import StatsCard from '../common/StatsCard';
import { formatPercentage } from '../../utils/formatters';
import { useDashboard } from '../../context/DashboardContext';

const OverviewStats = ({ production, pauses, maintenance, cleaning, colors, activeCards }) => {
  const { compactView } = useDashboard();

  // Calcular tamaño de columna según las tarjetas activas
  const gridSize = () => {
    const activeCount = Object.values(activeCards).filter(Boolean).length;
    return activeCount > 0 ? 12 / activeCount : 12;
  };

  return (
    <>
      {/* Estadística de producción */}
      <Grid 
        item 
        xs={12} 
        md={gridSize()} 
        sx={{ display: activeCards.production ? 'block' : 'none' }}
      >
        <Fade in={true} style={{ transitionDelay: '100ms' }}>
          <Box>
            <StatsCard 
              icon={<ProductionIcon sx={{ color: 'white' }} />}
              title="Producción"
              mainValue={production.total_orders}
              mainLabel="Órdenes totales"
              color={colors.gradients.production}
              details={[
                { label: 'Unidades buenas', value: production.total_good_units },
                { label: 'Defectuosas', value: production.total_defective_units },
                { label: 'Tasa de defectos', value: formatPercentage(production.defective_rate) },
                { label: 'Duración promedio', value: `${production.avg_duration_minutes} min` }
              ]}
              compactView={compactView}
              onClick={() => {
                // Función para cambiar a la pestaña de producción
              }}
            />
          </Box>
        </Fade>
      </Grid>
      
      {/* Estadística de pausas */}
      <Grid 
        item 
        xs={12} 
        md={gridSize()} 
        sx={{ display: activeCards.pauses ? 'block' : 'none' }}
      >
        <Fade in={true} style={{ transitionDelay: '200ms' }}>
          <Box>
            <StatsCard 
              icon={<PauseIcon sx={{ color: 'white' }} />}
              title="Pausas"
              mainValue={pauses.by_category.reduce((sum, cat) => sum + cat.count, 0)}
              mainLabel="Pausas totales"
              color={colors.gradients.pauses}
              details={pauses.by_category.map(category => ({
                label: category.category,
                value: `${category.count} (${category.total_minutes} min)`
              }))}
              compactView={compactView}
              onClick={() => {
                // Función para cambiar a la pestaña de pausas
              }}
            />
          </Box>
        </Fade>
      </Grid>
      
      {/* Estadística de mantenimiento */}
      <Grid 
        item 
        xs={12} 
        md={gridSize()} 
        sx={{ display: activeCards.maintenance ? 'block' : 'none' }}
      >
        <Fade in={true} style={{ transitionDelay: '300ms' }}>
          <Box>
            <StatsCard 
              icon={<BuildIcon sx={{ color: 'white' }} />}
              title="Mantenimiento"
              mainValue={maintenance.total_orders}
              mainLabel="Órdenes totales"
              color={colors.gradients.maintenance}
              progress={maintenance.completion_rate}
              details={[
                { label: 'Completadas', value: maintenance.completed_count },
                { label: 'Tasa de completado', value: formatPercentage(maintenance.completion_rate) },
                { label: 'Duración promedio', value: `${maintenance.avg_duration_minutes} min` }
              ]}
              compactView={compactView}
              onClick={() => {
                // Función para cambiar a la pestaña de mantenimiento
              }}
            />
          </Box>
        </Fade>
      </Grid>
      
      {/* Estadística de limpieza */}
      <Grid 
        item 
        xs={12} 
        md={gridSize()} 
        sx={{ display: activeCards.cleaning ? 'block' : 'none' }}
      >
        <Fade in={true} style={{ transitionDelay: '400ms' }}>
          <Box>
            <StatsCard 
              icon={<CleaningIcon sx={{ color: 'white' }} />}
              title="Limpieza"
              mainValue={cleaning.total_orders}
              mainLabel="Órdenes totales"
              color={colors.gradients.cleaning}
              progress={parseFloat(cleaning.completion_rate)}
              details={[
                { label: 'Completadas', value: cleaning.completed_count },
                { label: 'Tasa de completado', value: `${cleaning.completion_rate}%` },
                { label: 'Duración promedio', value: `${cleaning.avg_duration_minutes} min` }
              ]}
              compactView={compactView}
              onClick={() => {
                // Función para cambiar a la pestaña de mantenimiento/limpieza
              }}
            />
          </Box>
        </Fade>
      </Grid>
    </>
  );
};

export default OverviewStats;