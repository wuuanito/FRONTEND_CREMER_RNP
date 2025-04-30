import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardHeader,
  CardContent,
  Grid,
  Button,
  IconButton,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
// Componentes de iconos
import RefreshIcon from '@mui/icons-material/Refresh';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from '@mui/material';
// API URLs - Usando tus endpoints reales
const API_BASE_URL = 'http://192.168.11.25:3000/api';
const DASHBOARD_URL = `${API_BASE_URL}/reports/dashboard`;
const PRODUCTION_URL = `${API_BASE_URL}/reports/production`;
const PAUSES_URL = `${API_BASE_URL}/reports/pauses`;
const MANUFACTURING_URL = `${API_BASE_URL}/manufacturing`;

// Colores para los gráficos
const COLORS = {
  good: '#4caf50',
  defective: '#f44336',
  pause: '#ff9800',
  maintenance: '#2196f3',
  cleaning: '#9c27b0',
  chartColors: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#673ab7', '#3f51b5', '#00bcd4']
};

// Componente principal
const DashboardReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para los reportes
  const [dashboardData, setDashboardData] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [pausesData, setPausesData] = useState(null);
  const [manufacturingData, setManufacturingData] = useState(null);
  
  // Estados para los filtros
  const [startDate, setStartDate] = useState(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para los filtros del timeline
  const [timelineStartDate, setTimelineStartDate] = useState(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo.toISOString().split('T')[0];
  });
  const [timelineEndDate, setTimelineEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  
  // Función para cargar datos del dashboard
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(DASHBOARD_URL);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setDashboardData(data);
      return data;
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      throw err;
    }
  };
  
  // Función para cargar datos de producción
  const fetchProductionData = async () => {
    try {
      const url = `${PRODUCTION_URL}?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setProductionData(data);
      return data;
    } catch (err) {
      console.error('Error al cargar reporte de producción:', err);
      throw err;
    }
  };
  
  // Función para cargar datos de pausas
  const fetchPausesData = async () => {
    try {
      const url = `${PAUSES_URL}?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setPausesData(data);
      return data;
    } catch (err) {
      console.error('Error al cargar reporte de pausas:', err);
      throw err;
    }
  };
  
  // Función para cargar datos de fabricación
  const fetchManufacturingData = async () => {
    try {
      const response = await fetch(MANUFACTURING_URL);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setManufacturingData(data);
      return data;
    } catch (err) {
      console.error('Error al cargar datos de fabricación:', err);
      throw err;
    }
  };// Función para cargar todos los reportes
  const fetchAllReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargamos los datos en paralelo
      const [dashboardResult, productionResult, pausesResult, manufacturingResult] = await Promise.all([
        fetchDashboardData(),
        fetchProductionData(),
        fetchPausesData(),
        fetchManufacturingData()
      ]);
    } catch (err) {
      setError(`Error al cargar reportes: ${err.message}`);
      console.error('Error al cargar reportes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);
  
  // Función para manejar el cambio de tab
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Función para formatear tiempo en milisegundos
  const formatTime = (ms) => {
    if (!ms) return '0s';
    
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${seconds}s`;
    
    return result;
  };
  
  // Función para aplicar filtros
  const applyFilters = () => {
    fetchAllReports();
    setShowFilters(false);
  };
  
  // Componente simplificado para tarjetas de estadísticas
  const StatsCard = ({ title, mainValue, mainLabel, details, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title={title}
        sx={{ 
          backgroundColor: color, 
          color: 'white',
          padding: '12px 16px'
        }}
      />
      <CardContent>
        <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', color: color, mb: 1 }}>
          {mainValue}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
          {mainLabel}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {details.map((detail, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mb: 1 
          }}>
            <Typography variant="body2">{detail.label}:</Typography>
            <Typography variant="body2" fontWeight="bold">{detail.value}</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
  
  // Componente simplificado para tarjetas de gráficos
  const ChartCard = ({ title, chart, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title={title}
        sx={{ 
          backgroundColor: color, 
          color: 'white',
          padding: '12px 16px'
        }}
      />
      <CardContent sx={{ height: 300 }}>
        {chart}
      </CardContent>
    </Card>
  );
  
  // Componente para tarjetas de tabla
  const TableCard = ({ title, color, children }) => (
    <Card>
      <CardHeader 
        title={title}
        sx={{ 
          backgroundColor: color, 
          color: 'white',
          padding: '12px 16px'
        }}
      />
      <CardContent sx={{ maxHeight: 500, overflow: 'hidden' }}>
        {children}
      </CardContent>
    </Card>
  );// Renderizar timeline de producción
  const renderProductionTimeline = () => {
    if (!manufacturingData || !manufacturingData.orders) return null;
    
    // Filtrar órdenes por fecha
    const filteredOrders = manufacturingData.orders.filter(order => {
      const orderStartTime = new Date(order.time.start_time);
      const orderEndTime = order.time.end_time ? new Date(order.time.end_time) : new Date();
      
      const filterStart = new Date(timelineStartDate);
      const filterEnd = new Date(timelineEndDate);
      filterEnd.setHours(23, 59, 59, 999); // Final del día
      
      // Comprobar si la orden está dentro del rango de fechas
      return (orderStartTime >= filterStart && orderStartTime <= filterEnd) || 
             (orderEndTime >= filterStart && orderEndTime <= filterEnd) ||
             (orderStartTime <= filterStart && orderEndTime >= filterEnd);
    });
    
    // Crear datos para una única línea de tiempo
    const timelineData = Array.from({ length: 24 }, (_, hour) => {
      // Verificar si hay órdenes activas en esta hora
      const activeOrders = filteredOrders.filter(order => {
        const orderStart = new Date(order.time.start_time);
        const orderEnd = order.time.end_time ? new Date(order.time.end_time) : new Date();
        
        const currentHourStart = new Date(timelineStartDate);
        currentHourStart.setHours(hour, 0, 0, 0);
        const currentHourEnd = new Date(timelineStartDate);
        currentHourEnd.setHours(hour, 59, 59, 999);
  
        return (
          orderStart <= currentHourEnd && 
          orderEnd >= currentHourStart &&
          hour >= startHour && 
          hour <= endHour
        );
      });
  
      return {
        hour,
        active: activeOrders.length > 0,
        orders: activeOrders
      };
    });
  
    return (
      <Card sx={{ 
        mb: 3, 
        width: '100%', 
        overflow: 'hidden' 
      }}>
        <CardHeader 
          title="Timeline de Producción"
          sx={{ 
            backgroundColor: COLORS.chartColors[1], 
            color: 'white',
            padding: '12px 16px'
          }}
        />
        <CardContent>
          {/* Controles de fecha y hora */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            mb: 3, 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Fecha"
                type="date"
                value={timelineStartDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setTimelineStartDate(newDate);
                  // También puedes agregar aquí cualquier lógica adicional si es necesario
                }}
                sx={{ minWidth: 150 }}
                InputLabelProps={{ shrink: true }}
              />
              <IconButton 
                onClick={() => {
                  const prevDate = new Date(timelineStartDate);
                  prevDate.setDate(prevDate.getDate() - 1);
                  setTimelineStartDate(prevDate.toISOString().split('T')[0]);
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton 
                onClick={() => {
                  const nextDate = new Date(timelineStartDate);
                  nextDate.setDate(nextDate.getDate() + 1);
                  setTimelineStartDate(nextDate.toISOString().split('T')[0]);
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
  
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => {
                  const newStartHour = Math.max(0, startHour - 1);
                  setStartHour(newStartHour);
                }}
                disabled={startHour === 0}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="body1">
                {startHour}:00 - {endHour}:00
              </Typography>
              <IconButton 
                onClick={() => {
                  const newEndHour = Math.min(23, endHour + 1);
                  setEndHour(newEndHour);
                }}
                disabled={endHour === 23}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
  
          {/* Línea de tiempo */}
          <Box sx={{ 
            width: '100%', 
            overflowX: 'auto',
            position: 'relative',
            mb: 2
          }}>
            <Box sx={{ 
              display: 'flex', 
              minWidth: '800px',
              height: 80,
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {timelineData.map((hourData) => (
                <Box
                  key={`hour-${hourData.hour}`}
                  sx={{
                    flex: 1,
                    height: '100%',
                    backgroundColor: hourData.active 
                      ? COLORS.good 
                      : '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      zIndex: 10,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                    }
                  }}
                  onClick={() => {
                    // Abrir modal con las órdenes de esta hora
                    if (hourData.active) {
                      setSelectedOrdersModal({
                        hour: hourData.hour,
                        orders: hourData.orders
                      });
                    }
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: hourData.active ? 'white' : 'text.secondary' 
                    }}
                  >
                    {hourData.hour}:00
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
  
          {/* Resumen */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2, 
            p: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1 
          }}>
            <Typography variant="body2">
              Órdenes totales: {filteredOrders.length}
            </Typography>
            <Typography variant="body2">
              Horas productivas: {timelineData.filter(h => h.active).length}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };
  // Renderizar panel de control
  const renderDashboardOverview = () => {
    if (!dashboardData) return null;
    
    const { production, pauses, maintenance, cleaning } = dashboardData;
    
    // Datos para el gráfico de pastel de producción
    const productionPieData = [
      { name: 'Unidades buenas', value: parseInt(production.total_good_units) },
      { name: 'Unidades defectuosas', value: parseInt(production.total_defective_units) }
    ];
    
    // Datos para el gráfico de pausas
    const pausesBarData = pauses.by_category.map(cat => ({
      name: cat.category,
      minutos: cat.total_minutes,
      cantidad: cat.count
    }));
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Panel de Control
        </Typography>
        
        {/* Timeline de producción */}
        {renderProductionTimeline()}
        
        <Grid container spacing={3}>
          {/* Tarjetas de resumen */}
          <Grid item xs={12} md={6}>
            <StatsCard 
              title="Producción"
              mainValue={production.total_orders}
              mainLabel="Órdenes totales"
              color={COLORS.good}
              details={[
                { label: 'Unidades buenas', value: production.total_good_units },
                { label: 'Unidades defectuosas', value: production.total_defective_units },
                { label: 'Tasa de defectos', value: `${production.defective_rate}%` },
                { label: 'Duración promedio', value: `${production.avg_duration_minutes} min` }
              ]}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <StatsCard 
              title="Pausas"
              mainValue={pauses.by_category.reduce((sum, cat) => sum + cat.count, 0)}
              mainLabel="Pausas totales"
              color={COLORS.pause}
              details={pauses.by_category.map(category => ({
                label: category.category,
                value: `${category.count} (${category.total_minutes} min)`
              }))}
            />
          </Grid>
          
          {/* Gráficos principales */}
          <Grid item xs={12} md={6}>
            <ChartCard 
              title="Producción y Calidad"
              color={COLORS.good}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productionPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.good : COLORS.defective} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              }
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <ChartCard 
              title="Pausas por Categoría"
              color={COLORS.pause}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pausesBarData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="minutos" name="Minutos" fill={COLORS.pause} />
                    <Bar dataKey="cantidad" name="Cantidad" fill={COLORS.maintenance} />
                  </BarChart>
                </ResponsiveContainer>
              }
            />
          </Grid>
        </Grid>
      </Box>
    );
  };// Renderizar reporte de producción
  const renderProductionReport = () => {
    if (!productionData) return null;
    
    const { summary, orders } = productionData;
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h5">
            Reporte de Producción
          </Typography>
          
          <Box>
            <Button 
              startIcon={<FilterAltIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
            
            <IconButton onClick={fetchAllReports} disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Box>
        </Box>
        
        {showFilters && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Fecha Fin"
                  type="date"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button 
                  variant="contained" 
                  startIcon={<DateRangeIcon />}
                  onClick={applyFilters}
                  fullWidth
                >
                  Aplicar Filtros
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
        
        <Grid container spacing={3}>
          {/* Resumen de producción */}
          <Grid item xs={12} md={4}>
            <StatsCard 
              title="Resumen de Producción"
              mainValue={summary.total_units.toLocaleString()}
              mainLabel="Unidades totales"
              color={COLORS.good}
              details={[
                { label: 'Órdenes totales', value: summary.total_orders },
                { label: 'Unidades buenas', value: summary.total_good_units.toLocaleString() },
                { label: 'Unidades defectuosas', value: summary.total_defective_units.toLocaleString() },
                { label: 'Tasa de defectos', value: `${summary.defective_rate}%` },
                { label: 'Tasa de producción', value: `${summary.production_rate_per_minute} u/min` }
              ]}
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <ChartCard 
              title="Producción por Orden"
              color={COLORS.good}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={orders.map(order => ({
                      name: order.order_code,
                      buenas: order.production.good_units,
                      defectuosas: order.production.defective_units,
                      tasa: parseFloat(order.production.defective_rate)
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="buenas" name="U. Buenas" fill={COLORS.good} />
                    <Bar yAxisId="left" dataKey="defectuosas" name="U. Defectuosas" fill={COLORS.defective} />
                    <Line yAxisId="right" type="monotone" dataKey="tasa" name="% Defectos" stroke={COLORS.pause} />
                  </BarChart>
                </ResponsiveContainer>
              }
            />
          </Grid>
          
          {/* Tabla de órdenes de producción con scroll */}
          <Grid item xs={12}>
            <TableCard 
              title="Órdenes de Producción"
              color={COLORS.good}
            >
              <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Código</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Artículo</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Descripción</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>U. Buenas</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>U. Defect.</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Total</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>% Defect.</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr key={order.order_id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.order_code}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.article_code}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.description}</td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd', color: COLORS.good }}>
                          {order.production.good_units.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd', color: COLORS.defective }}>
                          {order.production.defective_units.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>
                          {order.production.total_units.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>
                          {order.production.defective_rate}%
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>
                          {formatTime(order.duration_ms)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </TableCard>
          </Grid>
        </Grid>
      </Box>
    );
  };// Renderizar reporte de pausas
  const renderPausesReport = () => {
    if (!pausesData) return null;
    
    const { summary, categories } = pausesData;
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h5">
            Reporte de Pausas
          </Typography>
          
          <Box>
            <Button 
              startIcon={<FilterAltIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
            
            <IconButton onClick={fetchAllReports} disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Box>
        </Box>
        
        {showFilters && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Fecha Fin"
                  type="date"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button 
                  variant="contained" 
                  startIcon={<DateRangeIcon />}
                  onClick={applyFilters}
                  fullWidth
                  color="warning"
                >
                  Aplicar Filtros
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatsCard 
              title="Resumen de Pausas"
              mainValue={summary.total_pauses}
              mainLabel="Pausas totales"
              color={COLORS.pause}
              details={[
                { label: 'Tiempo total', value: `${summary.total_pause_time_hours}h` },
                { label: 'Tiempo por pausa', value: formatTime(Math.round(summary.total_pause_time_ms / summary.total_pauses)) },
                { label: 'Categorías', value: summary.categories_count }
              ]}
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <ChartCard 
              title="Pausas por Categoría"
              color={COLORS.pause}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categories.map(cat => ({
                      name: cat.category,
                      duration: cat.total_duration_ms / 60000, // convertir a minutos
                      count: cat.count,
                      porcentaje: parseFloat(cat.percentage_of_total)
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'duration') return [`${value.toFixed(0)} min`, 'Duración'];
                      if (name === 'count') return [value, 'Cantidad'];
                      if (name === 'porcentaje') return [`${value.toFixed(2)}%`, 'Porcentaje'];
                      return [value, name];
                    }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="duration" name="Duración (min)" fill={COLORS.pause} />
                    <Bar yAxisId="right" dataKey="count" name="Cantidad" fill={COLORS.maintenance} />
                  </BarChart>
                </ResponsiveContainer>
              }
            />
          </Grid>
          
          <Grid item xs={12}>
            <TableCard 
              title="Detalle de Pausas por Categoría"
              color={COLORS.pause}
            >
              <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Categoría</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Cantidad</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Duración Total</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>% del Total</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Razones Principales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                          <Chip 
                            label={category.category} 
                            size="small" 
                            sx={{ backgroundColor: COLORS.pause, color: 'white' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>
                          {category.count}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>
                          {formatTime(category.total_duration_ms)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>
                          {category.percentage_of_total}%
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                          {category.reasons.slice(0, 2).map((reason, idx) => (
                            <div key={idx}>
                              {reason.description} ({reason.count})
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </TableCard>
          </Grid>
        </Grid>
      </Box>
    );
  };// Componente principal con pestañas
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Industrial
      </Typography>
      
      {error && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#ffebee', borderRadius: 1, color: '#c62828' }}>
          <Typography variant="body1">
            <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            {error}
          </Typography>
        </Box>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Panel de Control" />
              <Tab label="Producción" />
              <Tab label="Pausas" />
            </Tabs>
          </Box>
          
          {activeTab === 0 && renderDashboardOverview()}
          {activeTab === 1 && renderProductionReport()}
          {activeTab === 2 && renderPausesReport()}
        </>
      )}
    </Box>
  );
};

export default DashboardReports;