// src/components/Dashboard/components/Pauses/PausesCharts.js
import React from 'react';
import { 
  Assessment as AssessmentIcon,
  DonutLarge as DonutIcon,
  Schedule as ScheduleIcon 
} from '@mui/icons-material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, Sector,
  AreaChart, Area
} from 'recharts';

import ChartCard from '../common/ChartCard';
import { formatTime } from '../../utils/formatters';

// Gráfico de categorías de pausas
const CategoriesChart = ({ data, colors }) => {
  return (
    <ChartCard 
      title="Pausas por Categoría"
      icon={<AssessmentIcon fontSize="small" />}
      color="#ff9800"
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="pauseDurationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ff9800" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="pauseCountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2196f3" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#ff9800" />
            <YAxis yAxisId="right" orientation="right" stroke="#2196f3" />
            <RechartsTooltip formatter={(value, name, props) => {
              if (name === 'value') return [formatTime(value), 'Duración'];
              if (name === 'count') return [value, 'Cantidad'];
              if (name === 'percentage') return [`${value.toFixed(2)}%`, 'Porcentaje'];
              return [value, name];
            }} />
            <Legend />
            <Bar yAxisId="left" dataKey="value" name="Duración" fill="url(#pauseDurationGradient)" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="count" name="Cantidad" fill="url(#pauseCountGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      }
    />
  );
};

// Gráfico de razones de pausas
const ReasonsChart = ({ data, colors, activePieIndex, setActivePieIndex }) => {
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

  return (
    <ChartCard 
      title="Principales Razones de Pausa"
      icon={<DonutIcon fontSize="small" />}
      color="#ff5722"
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {data.map((_, index) => (
                <radialGradient
                  key={`reason-gradient-${index}`}
                  id={`reasonGradient${index}`}
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
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActivePieIndex(index)}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#reasonGradient${index})`} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value, name, props) => [
              formatTime(value),
              `${props.payload.name} (${props.payload.category})`
            ]} />
            <Legend layout="vertical" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      }
    />
  );
};

// Gráfico de distribución de tiempo de pausa
const TimeDistributionChart = ({ categories, colors }) => {
  return (
    <ChartCard 
      title="Distribución de Tiempo de Pausa"
      icon={<ScheduleIcon fontSize="small" />}
      color="#673ab7"
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={categories.map(category => ({
              name: category.category,
              ms: category.total_duration_ms,
              horas: category.total_duration_ms / 3600000
            }))}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="pauseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#673ab7" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#673ab7" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip formatter={(value, name) => [
              name === 'ms' ? formatTime(value) : `${value.toFixed(2)} h`,
              name === 'ms' ? 'Tiempo total' : 'Horas'
            ]} />
            <Area 
              type="monotone" 
              dataKey="horas" 
              name="Horas" 
              stroke="#673ab7" 
              fillOpacity={1} 
              fill="url(#pauseTimeGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      }
    />
  );
};

// Exportar todos los componentes de gráficos
const PausesCharts = {
  CategoriesChart,
  ReasonsChart,
  TimeDistributionChart
};

export default PausesCharts;