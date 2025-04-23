// src/components/Dashboard/components/Production/ProductionCharts.js
import React from 'react';
import { Grid, Box, Zoom } from '@mui/material';
import { 
  DonutLarge as DonutIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, 
  ComposedChart, Line, Scatter
} from 'recharts';

import ChartCard from '../common/ChartCard';
import { useDashboard } from '../../context/DashboardContext';
import { formatTime } from '../../utils/formatters';

// Gráfico de distribución de tiempo
const TimeDistributionChart = ({ summary, colors }) => {
  const { compactView } = useDashboard();

  // Datos para el gráfico de tiempo
  const timeData = [
    { name: 'Tiempo de Producción', value: summary.total_production_time_ms },
    { name: 'Tiempo de Pausa', value: summary.total_pause_time_ms },
    { name: 'Tiempo Efectivo', value: summary.total_effective_time_ms },
  ];

  return (
    <ChartCard 
      title="Distribución de Tiempo"
      icon={<DonutIcon fontSize="small" />}
      color={colors.pieColors[0]}
      compactView={compactView}
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {timeData.map((_, index) => (
                <radialGradient
                  key={`gradient-${index}`}
                  id={`timeGradient${index}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop
                    offset="0%"
                    stopColor={colors.pieColors[index]}
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="100%"
                    stopColor={colors.pieColors[index]}
                    stopOpacity={0.6}
                  />
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={timeData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              fill="#8884d8"
              dataKey="value"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {timeData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#timeGradient${index})`} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value) => formatTime(value)} />
          </PieChart>
        </ResponsiveContainer>
      }
    />
  );
};

// Gráfico de tendencia de producción
const TrendChart = ({ orders, colors }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={orders.map(order => ({
          name: order.order_code,
          buenas: order.production.good_units,
          defectuosas: order.production.defective_units,
          tasa: parseFloat(order.production.defective_rate),
          duracion: order.duration_ms / 60000, // Convertir a minutos
          produccion: parseFloat(order.rates.total_production_rate)
        }))}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          tick={{ fontSize: 10 }}
          height={70}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <RechartsTooltip 
          formatter={(value, name) => {
            switch(name) {
              case 'buenas': return [`${value} unidades`, 'Unidades buenas'];
              case 'defectuosas': return [`${value} unidades`, 'Unidades defectuosas'];
              case 'tasa': return [`${value}%`, 'Tasa de defectos'];
              case 'duracion': return [`${value.toFixed(2)} min`, 'Duración'];
              case 'produccion': return [`${value} u/min`, 'Tasa de producción'];
              default: return [value, name];
            }
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="buenas" name="Unidades buenas" fill="#4caf50" stackId="a" barSize={20} />
        <Bar yAxisId="left" dataKey="defectuosas" name="Unidades defectuosas" fill="#f44336" stackId="a" barSize={20} />
        <Line yAxisId="right" type="monotone" dataKey="tasa" name="Tasa de defectos (%)" stroke="#ff9800" dot={{ stroke: '#ff9800', strokeWidth: 2, r: 4 }} />
        <Line yAxisId="right" type="monotone" dataKey="produccion" name="Tasa de producción (u/min)" stroke="#2196f3" dot={{ stroke: '#2196f3', strokeWidth: 2, r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Componente principal que contiene todos los gráficos
const ProductionCharts = ({ summary, colors }) => {
  return (
    <Grid item xs={12} md={4}>
      <Zoom in={true} style={{ transitionDelay: '300ms' }}>
        <Box>
          <TimeDistributionChart summary={summary} colors={colors} />
        </Box>
      </Zoom>
    </Grid>
  );
};

// Exportar subcomponentes
ProductionCharts.TimeDistributionChart = TimeDistributionChart;
ProductionCharts.TrendChart = TrendChart;

export default ProductionCharts;