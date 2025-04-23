// src/components/Dashboard/components/Maintenance/MaintenanceSection.js
import React, { useState } from 'react';
import { Grid, Box, Fade, Zoom, Typography } from '@mui/material';
import { 
  Build as BuildIcon,
  DonutLarge as DonutIcon
} from '@mui/icons-material';

import { 
  PieChart, Pie, Cell, ResponsiveContainer, Sector,
  Tooltip as RechartsTooltip 
} from 'recharts';

import { useDashboard } from '../../context/DashboardContext';
import { formatTime } from '../../utils/formatters';

import ChartCard from '../common/ChartCard';
import MaintenanceTables from './MaintenanceTables';

const MaintenanceSection = ({ maintenance, colors }) => {
  const { compactView } = useDashboard();
  const [activePieIndex, setActivePieIndex] = useState(0);

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

  // Resumen de mantenimiento
  const MaintenanceStats = () => (
    <ChartCard 
      title="Resumen de Mantenimiento"
      icon={<BuildIcon fontSize="small" />}
      color="#2196f3"
      compactView={compactView}
      chart={
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main" fontWeight="bold" sx={{ mb: 1 }}>
                {maintenance.total_orders}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Órdenes totales
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                {maintenance.completion_rate}%
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Completadas
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ px: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Progreso de mantenimiento
              </Typography>
              <Box sx={{ 
                width: '100%', 
                height: 10, 
                bgcolor: 'rgba(0,0,0,0.08)', 
                borderRadius: 5,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  width: `${maintenance.completion_rate}%`, 
                  height: '100%', 
                  background: `linear-gradient(90deg, #2196f3, #0d47a1)`,
                  borderRadius: 5,
                  transition: 'width 1s ease-in-out'
                }} />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Tiempo total:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {formatTime(maintenance.total_time_ms)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Promedio:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {maintenance.avg_time_minutes} min/orden
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Equipos revisados:</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {maintenance.by_equipment ? maintenance.by_equipment.length : 0}
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
        <Fade in={true} style={{ transitionDelay: '500ms' }}>
          <Box>
            <MaintenanceStats />
          </Box>
        </Fade>
      </Grid>
      
      {maintenance.by_type && maintenance.by_type.length > 0 && (
        <Grid item xs={12} md={4}>
          <Zoom in={true} style={{ transitionDelay: '600ms' }}>
            <Box>
              <ChartCard 
                title="Mantenimiento por Tipo"
                icon={<DonutIcon fontSize="small" />}
                color="#2196f3"
                compactView={compactView}
                chart={
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {maintenance.by_type.map((_, index) => (
                          <radialGradient
                            key={`maintenance-type-gradient-${index}`}
                            id={`maintenanceTypeGradient${index}`}
                            cx="50%"
                            cy="50%"
                            r="50%"
                            fx="50%"
                            fy="50%"
                          >
                            <stop
                              offset="0%"
                              stopColor={colors.pieColors[(index + 2) % colors.pieColors.length]}
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor={colors.pieColors[(index + 2) % colors.pieColors.length]}
                              stopOpacity={0.6}
                            />
                          </radialGradient>
                        ))}
                      </defs>
                      <Pie
                        data={maintenance.by_type.map(type => ({
                          name: type.type,
                          value: type.total_duration_ms,
                          percentage: parseFloat(type.percentage)
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => percent > 0.05 ? `${name.substring(0, 10)}${name.length > 10 ? '...' : ''}: ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {maintenance.by_type.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#maintenanceTypeGradient${index})`} />
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
      )}
      
      {maintenance.by_equipment && maintenance.by_equipment.length > 0 && (
        <Grid item xs={12} md={4}>
          <Zoom in={true} style={{ transitionDelay: '700ms' }}>
            <Box>
              <ChartCard 
                title="Mantenimiento por Equipo"
                icon={<DonutIcon fontSize="small" />}
                color="#2196f3"
                compactView={compactView}
                chart={
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {maintenance.by_equipment.map((_, index) => (
                          <radialGradient
                            key={`equipment-gradient-${index}`}
                            id={`equipmentGradient${index}`}
                            cx="50%"
                            cy="50%"
                            r="50%"
                            fx="50%"
                            fy="50%"
                          >
                            <stop
                              offset="0%"
                              stopColor={colors.pieColors[(index + 7) % colors.pieColors.length]}
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor={colors.pieColors[(index + 7) % colors.pieColors.length]}
                              stopOpacity={0.6}
                            />
                          </radialGradient>
                        ))}
                      </defs>
                      <Pie
                        data={maintenance.by_equipment.map(equip => ({
                          name: equip.equipment_name,
                          value: equip.total_duration_ms,
                          percentage: parseFloat(equip.percentage)
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => percent > 0.05 ? `${name.substring(0, 10)}${name.length > 10 ? '...' : ''}: ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {maintenance.by_equipment.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#equipmentGradient${index})`} />
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
      )}
      
      {maintenance.orders && maintenance.orders.length > 0 && (
        <Grid item xs={12}>
          <Fade in={true} style={{ transitionDelay: '800ms' }}>
            <Box>
              <MaintenanceTables.MaintenanceTable maintenance={maintenance} />
            </Box>
          </Fade>
        </Grid>
      )}
    </>
  );
};

export default MaintenanceSection;