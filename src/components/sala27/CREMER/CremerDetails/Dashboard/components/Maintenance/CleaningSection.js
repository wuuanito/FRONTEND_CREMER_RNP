// src/components/Dashboard/components/Maintenance/CleaningSection.js
import React, { useState } from 'react';
import { Grid, Box, Fade, Zoom } from '@mui/material';
import { 
  CleaningServices as CleaningIcon,
  DonutLarge as DonutIcon
} from '@mui/icons-material';

import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';

import { useDashboard } from '../../context/DashboardContext';
import { formatTime } from '../../utils/formatters';

import ChartCard from '../common/ChartCard';
import TableCard from '../common/TableCard';
import MaintenanceTables from './MaintenanceTables';

const CleaningSection = ({ cleaning, colors }) => {
  const { compactView } = useDashboard();
  const [activePieIndex, setActivePieIndex] = useState(0);

  // Datos para gráficos de limpieza
  const cleaningTypeData = cleaning.by_type.map(type => ({
    name: type.type,
    value: type.total_duration_ms,
    percentage: parseFloat(type.percentage)
  }));
  
  const cleaningAreaData = cleaning.by_area.map(area => ({
    name: area.area_name,
    value: area.total_duration_ms,
    percentage: parseFloat(area.percentage)
  }));

  // Componente para el gráfico de sectores con efecto de hover
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value, name } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${name}: ${formatTime(value)}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  // Resumen de limpieza
  const CleaningStats = () => (
    <ChartCard 
      title="Resumen de Limpieza"
      icon={<CleaningIcon fontSize="small" />}
      color="#9c27b0"
      compactView={compactView}
      chart={
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
                {cleaning.total_orders}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Órdenes totales
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                {parseFloat(cleaning.completion_rate).toFixed(1)}%
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Completadas
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ px: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Progreso de limpieza
              </Typography>
              <Box sx={{ 
                width: '100%', 
                height: 10, 
                bgcolor: 'rgba(0,0,0,0.08)', 
                borderRadius: 5,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  width: `${parseFloat(cleaning.completion_rate)}%`, 
                  height: '100%', 
                  background: `linear-gradient(90deg, #9c27b0, #6a1b9a)`,
                  borderRadius: 5,
                  transition: 'width 1s ease-in-out'
                }} />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Tiempo total:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {formatTime(cleaning.total_time_ms)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Promedio:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {cleaning.avg_time_minutes} min/orden
              </Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Tipos:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {cleaning.by_type.length}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Áreas:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {cleaning.by_area.length}
              </Typography>
            </Box>
          </Box>
        </Box>
      }
    />
  );

  return (
    <>
      <Grid item xs={12} md={4}>
        <Fade in={true} style={{ transitionDelay: '100ms' }}>
          <Box>
            <CleaningStats />
          </Box>
        </Fade>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Zoom in={true} style={{ transitionDelay: '200ms' }}>
          <Box>
            <ChartCard 
              title="Limpieza por Tipo"
              icon={<DonutIcon fontSize="small" />}
              color="#9c27b0"
              compactView={compactView}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {cleaningTypeData.map((_, index) => (
                        <radialGradient
                          key={`cleaning-type-gradient-${index}`}
                          id={`cleaningTypeGradient${index}`}
                          cx="50%"
                          cy="50%"
                          r="50%"
                          fx="50%"
                          fy="50%"
                        >
                          <stop
                            offset="0%"
                            stopColor={colors.pieColors[index % colors.pieColors.length]}
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor={colors.pieColors[index % colors.pieColors.length]}
                            stopOpacity={0.6}
                          />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={cleaningTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                    >
                      {cleaningTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#cleaningTypeGradient${index})`} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatTime(value)} />
                  </PieChart>
                </ResponsiveContainer>
              }
            />
          </Box>
        </Zoom>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Zoom in={true} style={{ transitionDelay: '300ms' }}>
          <Box>
            <ChartCard 
              title="Limpieza por Área"
              icon={<DonutIcon fontSize="small" />}
              color="#9c27b0"
              compactView={compactView}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {cleaningAreaData.map((_, index) => (
                        <radialGradient
                          key={`cleaning-area-gradient-${index}`}
                          id={`cleaningAreaGradient${index}`}
                          cx="50%"
                          cy="50%"
                          r="50%"
                          fx="50%"
                          fy="50%"
                        >
                          <stop
                            offset="0%"
                            stopColor={colors.pieColors[(index + 5) % colors.pieColors.length]}
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor={colors.pieColors[(index + 5) % colors.pieColors.length]}
                            stopOpacity={0.6}
                          />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={cleaningAreaData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0.05 ? `${name.substring(0, 10)}${name.length > 10 ? '...' : ''}: ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {cleaningAreaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#cleaningAreaGradient${index})`} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatTime(value)} />
                  </PieChart>
                </ResponsiveContainer>
              }
            />
          </Box>
        </Zoom>
      </Grid>
      
      {/* Lista de órdenes de limpieza */}
      <Grid item xs={12}>
        <Fade in={true} style={{ transitionDelay: '400ms' }}>
          <Box>
            <MaintenanceTables.CleaningTable cleaning={cleaning} />
          </Box>
        </Fade>
      </Grid>
    </>
  );
};

export default CleaningSection;