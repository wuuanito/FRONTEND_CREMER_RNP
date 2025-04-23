// src/components/Dashboard/components/Overview/OverviewCharts.js
import React from 'react';
import { Grid, Box, Zoom, Fade } from '@mui/material';
import { 
  ProductionQuantityLimits as ProductionIcon,
  Pause as PauseIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ComposedChart, Line, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Sector
} from 'recharts';

import ChartCard from '../common/ChartCard';
import { useDashboard } from '../../context/DashboardContext';

const OverviewCharts = ({ 
  production, 
  pauses, 
  maintenance, 
  cleaning, 
  colors, 
  activePieIndex, 
  setActivePieIndex 
}) => {
  const { compactView } = useDashboard();

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
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${name}: ${value}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  return (
    <>
      {/* Gráfico de Producción y Calidad */}
      <Grid item xs={12} md={6}>
        <Zoom in={true} style={{ transitionDelay: '500ms' }}>
          <Box>
            <ChartCard 
              title="Producción y Calidad"
              icon={<ProductionIcon fontSize="small" />}
              color={colors.good}
              info="Distribución de unidades buenas vs defectuosas"
              compactView={compactView}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <radialGradient id="goodGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#48c078" />
                        <stop offset="100%" stopColor="#2e7d32" />
                      </radialGradient>
                      <radialGradient id="defectiveGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#ff867c" />
                        <stop offset="100%" stopColor="#e53935" />
                      </radialGradient>
                    </defs>
                    <Pie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={[
                        { name: 'Unidades Buenas', value: parseInt(production.total_good_units) },
                        { name: 'Unidades Defectuosas', value: parseInt(production.total_defective_units) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                    >
                      <Cell key="cell-0" fill="url(#goodGradient)" />
                      <Cell key="cell-1" fill="url(#defectiveGradient)" />
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry, index) => {
                        const count = parseInt(index === 0 ? production.total_good_units : production.total_defective_units);
                        const total = parseInt(production.total_good_units) + parseInt(production.total_defective_units);
                        const percentage = ((count / total) * 100).toFixed(1);
                        return `${value}: ${count} (${percentage}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              }
            />
          </Box>
        </Zoom>
      </Grid>
      
      {/* Gráfico de Pausas por Categoría */}
      <Grid item xs={12} md={6}>
        <Zoom in={true} style={{ transitionDelay: '600ms' }}>
          <Box>
            <ChartCard 
              title="Pausas por Categoría"
              icon={<PauseIcon fontSize="small" />}
              color={colors.pause}
              info="Distribución de tiempos por categoría de pausa"
              compactView={compactView}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pauses.by_category.map(category => ({
                      name: category.category,
                      minutes: parseInt(category.total_minutes),
                      count: category.count
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="pauseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff9800" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2196f3" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#ff9800" />
                    <YAxis yAxisId="right" orientation="right" stroke="#2196f3" />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        name === 'minutes' ? `${value} min` : value,
                        name === 'minutes' ? 'Duración' : 'Cantidad'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="minutes" name="Duración (min)" fill="url(#pauseGradient)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="count" name="Cantidad" fill="url(#countGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
            />
          </Box>
        </Zoom>
      </Grid>
      
      {/* Gráfico de Mantenimiento y Limpieza */}
      <Grid item xs={12} md={6}>
        <Fade in={true} style={{ transitionDelay: '700ms' }}>
          <Box>
            <ChartCard 
              title="Mantenimiento y Limpieza"
              icon={<AssessmentIcon fontSize="small" />}
              color={colors.maintenance}
              info="Comparativa de órdenes completadas vs pendientes"
              compactView={compactView}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[
                      { 
                        name: 'Mantenimiento', 
                        completado: maintenance.completed_count, 
                        pendiente: maintenance.total_orders - maintenance.completed_count,
                        porcentaje: maintenance.completion_rate
                      },
                      { 
                        name: 'Limpieza', 
                        completado: parseInt(cleaning.completed_count), 
                        pendiente: cleaning.total_orders - parseInt(cleaning.completed_count),
                        porcentaje: parseFloat(cleaning.completion_rate)
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="completadoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4caf50" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="pendienteGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f44336" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f44336" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" scale="band" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="completado" name="Completado" stackId="a" fill="url(#completadoGradient)" radius={[4, 0, 0, 0]} />
                    <Bar yAxisId="left" dataKey="pendiente" name="Pendiente" stackId="a" fill="url(#pendienteGradient)" radius={[0, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="porcentaje" name="% Completado" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              }
            />
          </Box>
        </Fade>
      </Grid>
      
      {/* Gráfico de Eficiencia Operativa */}
      <Grid item xs={12} md={6}>
        <Fade in={true} style={{ transitionDelay: '800ms' }}>
          <Box>
            <ChartCard 
              title="Eficiencia Operativa"
              icon={<SpeedIcon fontSize="small" />}
              color={colors.cleaning}
              info="Métricas de desempeño por departamento"
              compactView={compactView}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    cx="50%" 
                    cy="50%" 
                    outerRadius="80%" 
                    data={[
                      {
                        subject: 'Producción',
                        A: parseFloat(production.defective_rate) > 0 ? 100 - parseFloat(production.defective_rate) : 100,
                        fullMark: 100,
                      },
                      {
                        subject: 'Mantenimiento',
                        A: maintenance.completion_rate,
                        fullMark: 100,
                      },
                      {
                        subject: 'Limpieza',
                        A: parseFloat(cleaning.completion_rate),
                        fullMark: 100,
                      },
                      {
                        subject: 'Pausas',
                        A: 100 - Math.min(100, (pauses.by_category.reduce((sum, cat) => sum + cat.count, 0) / 10) * 5),
                        fullMark: 100,
                      },
                      {
                        subject: 'Calidad',
                        A: parseInt(production.total_good_units) / (parseInt(production.total_good_units) + parseInt(production.total_defective_units)) * 100 || 0,
                        fullMark: 100,
                      },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Eficiencia"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              }
            />
          </Box>
        </Fade>
      </Grid>
    </>
  );
};

export default OverviewCharts;