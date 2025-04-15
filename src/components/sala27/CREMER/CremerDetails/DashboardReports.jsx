import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Typography, 
  Box, 
  Card, 
  CardContent,
  Grid,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Divider,
  Zoom,
  Fade,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Pause as PauseIcon,
  ProductionQuantityLimits as ProductionIcon,
  CleaningServices as CleaningIcon,
  Build as BuildIcon,
  DateRange as DateRangeIcon,
  NotificationsActive as AlertIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  DonutLarge as DonutIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Fullscreen as FullscreenIcon,
  Autorenew as AutorenewIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  Sector,
  AreaChart,
  Area,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Scatter
} from 'recharts';
import { format, subMonths, subDays, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// API URLs
const API_BASE_URL = 'http://192.168.11.25:3000/api';
const DASHBOARD_URL = `${API_BASE_URL}/reports/dashboard`;
const PRODUCTION_URL = `${API_BASE_URL}/reports/production`;
const PAUSES_URL = `${API_BASE_URL}/reports/pauses`;
const MAINTENANCE_CLEANING_URL = `${API_BASE_URL}/reports/maintenance-cleaning`;

// Constantes para configuración
const AUTO_REFRESH_INTERVAL = 60000; // Refresco cada 60 segundos

// Componente principal
const DashboardReports = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [activeCards, setActiveCards] = useState({
    production: true,
    pauses: true,
    maintenance: true,
    cleaning: true
  });
  
  // Estados para los reportes
  const [dashboardData, setDashboardData] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [pausesData, setPausesData] = useState(null);
  const [maintenanceCleaningData, setMaintenanceCleaningData] = useState(null);
  
  // Estados para los filtros
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para el índice activo de los gráficos de sectores
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [activeRadarIndex, setActiveRadarIndex] = useState(0);
  
  // Colores para gráficos
  const COLORS = {
    good: theme.palette.success.main,
    defective: theme.palette.error.main,
    pause: theme.palette.warning.main,
    maintenance: theme.palette.info.main,
    cleaning: theme.palette.primary.main,
    production: '#4caf50',
    pieColors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff5722', '#673ab7', '#03a9f4', '#9c27b0'],
    areaColors: ['rgba(0, 136, 254, 0.7)', 'rgba(0, 196, 159, 0.7)', 'rgba(255, 187, 40, 0.7)', 'rgba(255, 128, 66, 0.7)'],
    gradients: {
      production: ['#00c853', '#1de9b6'],
      pauses: ['#ffab00', '#ff6d00'],
      maintenance: ['#2196f3', '#00b0ff'],
      cleaning: ['#6a1b9a', '#9c27b0'],
    }
  };

  // Función para cargar todos los reportes
  const fetchAllReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchProductionData(),
        fetchPausesData(),
        fetchMaintenanceCleaningData()
      ]);
      
      setNotification({
        type: 'success',
        message: 'Datos actualizados correctamente',
      });
    } catch (err) {
      setError(`Error al cargar reportes: ${err.message}`);
      console.error('Error al cargar reportes:', err);
      
      setNotification({
        type: 'error',
        message: `Error al cargar datos: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Efecto para el auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAllReports();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllReports]);
  
  // Cargar datos iniciales
  useEffect(() => {
    fetchAllReports();
    
    // Comprobar si está en modo fullscreen
    const handleFullscreenChange = () => {
      setFullscreenMode(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Funciones para cargar cada reporte
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(DASHBOARD_URL);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      throw err;
    }
  };
  
  const fetchProductionData = async () => {
    try {
      const url = `${PRODUCTION_URL}?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setProductionData(data);
    } catch (err) {
      console.error('Error al cargar reporte de producción:', err);
      throw err;
    }
  };
  
  const fetchPausesData = async () => {
    try {
      const url = `${PAUSES_URL}?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setPausesData(data);
    } catch (err) {
      console.error('Error al cargar reporte de pausas:', err);
      throw err;
    }
  };
  
  const fetchMaintenanceCleaningData = async () => {
    try {
      const url = `${MAINTENANCE_CLEANING_URL}?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setMaintenanceCleaningData(data);
    } catch (err) {
      console.error('Error al cargar reporte de mantenimiento y limpieza:', err);
      throw err;
    }
  };
  
  // Función para manejar el cambio de fecha
  const handleDateChange = () => {
    fetchProductionData();
    fetchPausesData();
    fetchMaintenanceCleaningData();
    setShowFilters(false);
  };
  
  // Función para manejar el cambio de tab
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };
  
  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };
  
  // Función para formatear porcentajes
  const formatPercentage = (value) => {
    if (typeof value === 'string') {
      return `${parseFloat(value).toFixed(2)}%`;
    }
    return `${value.toFixed(2)}%`;
  };
  
  // Función para formatear tiempo en ms
  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${seconds}s`;
    
    return result;
  };

  // Función para alternar la visibilidad de las tarjetas
  const toggleCardVisibility = (cardKey) => {
    setActiveCards({
      ...activeCards,
      [cardKey]: !activeCards[cardKey]
    });
  };
  
  // Función para entrar/salir en modo pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };
  
  // Función para cerrar notificaciones
  const handleCloseNotification = () => {
    setNotification(null);
  };
  
  // Obtener la fecha y hora actual formateada
  const getCurrentDateTime = () => {
    return format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es });
  };

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

  // Componente para la tarjeta de estadísticas mejorada
  const StatsCard = ({ icon, title, mainValue, mainLabel, details, color, progress, onClick }) => (
    <Card 
      elevation={4} 
      sx={{ 
        height: '100%', 
        position: 'relative',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6
        },
        overflow: 'visible',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          left: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(45deg, ${color[0]}, ${color[1]})`,
          boxShadow: `0 4px 20px 0 rgba(${parseInt(color[0].substring(1, 3), 16)}, ${parseInt(color[0].substring(3, 5), 16)}, ${parseInt(color[0].substring(5, 7), 16)}, 0.2)`,
          zIndex: 10
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ pt: 5, px: 3, pb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" sx={{ 
          color: color[0], 
          fontWeight: 'bold', 
          mb: 1,
          fontSize: compactView ? '1.5rem' : '2.5rem'
        }}>
          {mainValue}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {mainLabel}
        </Typography>
        
        {progress && (
          <Box sx={{ 
            width: '100%', 
            height: 8, 
            bgcolor: 'rgba(0,0,0,0.08)', 
            borderRadius: 4,
            mt: 2, 
            mb: 1,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              width: `${progress}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, ${color[0]}, ${color[1]})`,
              borderRadius: 4,
              transition: 'width 1s ease-in-out'
            }} />
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mt: 1 }}>
          {details.map((detail, index) => (
            <Typography key={index} variant="body2" sx={{ 
              mb: 0.5, 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: compactView ? '0.75rem' : '0.875rem' 
            }}>
              <span>{detail.label}:</span>
              <span style={{ fontWeight: 'bold' }}>{detail.value}</span>
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  // Componente para la tarjeta de gráfico mejorada
  const ChartCard = ({ title, chart, info, icon, color }) => (
    <Card 
      elevation={4} 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6
        },
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ 
            bgcolor: color, 
            width: 32, 
            height: 32, 
            mr: 1 
          }}>
            {icon}
          </Avatar>
          <Typography variant="h6">{title}</Typography>
        </Box>
        
        {info && (
          <Tooltip title={info}>
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Box sx={{ p: 2, height: compactView ? 280 : 330 }}>
        {chart}
      </Box>
    </Card>
  );

  // Componente para tarjeta de tabla mejorada
  const TableCard = ({ title, children, icon, color }) => (
    <Card 
      elevation={4} 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 6
        },
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <Avatar sx={{ 
          bgcolor: color, 
          width: 32, 
          height: 32, 
          mr: 1 
        }}>
          {icon}
        </Avatar>
        <Typography variant="h6">{title}</Typography>
      </Box>
      
      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
        {children}
      </Box>
    </Card>
  );

  // Gráficos y tablas mejorados
  const renderImprovedDashboardOverview = () => {
    if (!dashboardData) return null;
    
    const { production, pauses, maintenance, cleaning, period } = dashboardData;
    
    return (
      <Box>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #2c3e50, #4ca1af)',
            color: 'white'
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Panel de Control - Periodo: {formatDate(period.start_date)} - {formatDate(period.end_date)}
            </Typography>
            <Typography variant="subtitle1">
              {period.days} días • Última actualización: {getCurrentDateTime()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={autoRefresh ? "Desactivar auto-refresco" : "Activar auto-refresco"}>
              <IconButton 
                onClick={() => setAutoRefresh(!autoRefresh)} 
                color="inherit"
              >
                <AutorenewIcon sx={{ opacity: autoRefresh ? 1 : 0.5 }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={compactView ? "Vista normal" : "Vista compacta"}>
              <IconButton 
                onClick={() => setCompactView(!compactView)} 
                color="inherit"
              >
                {compactView ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={fullscreenMode ? "Salir de pantalla completa" : "Pantalla completa"}>
              <IconButton 
                onClick={toggleFullscreen} 
                color="inherit"
              >
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refrescar datos">
              <IconButton 
                onClick={fetchAllReports} 
                color="inherit"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
        
        <Grid container spacing={3}>
          {/* Estadísticas principales */}
          <Grid item xs={12} md={activeCards.production && activeCards.pauses && activeCards.maintenance && activeCards.cleaning ? 3 : 4} sx={{ display: activeCards.production ? 'block' : 'none' }}>
            <Fade in={true} style={{ transitionDelay: '100ms' }}>
              <Box>
                <StatsCard 
                  icon={<ProductionIcon sx={{ color: 'white' }} />}
                  title="Producción"
                  mainValue={production.total_orders}
                  mainLabel="Órdenes totales"
                  color={COLORS.gradients.production}
                  details={[
                    { label: 'Unidades buenas', value: production.total_good_units },
                    { label: 'Defectuosas', value: production.total_defective_units },
                    { label: 'Tasa de defectos', value: formatPercentage(production.defective_rate) },
                    { label: 'Duración promedio', value: `${production.avg_duration_minutes} min` }
                  ]}
                  onClick={() => {
                    setActiveTab(1);
                  }}
                />
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={activeCards.production && activeCards.pauses && activeCards.maintenance && activeCards.cleaning ? 3 : 4} sx={{ display: activeCards.pauses ? 'block' : 'none' }}>
            <Fade in={true} style={{ transitionDelay: '200ms' }}>
              <Box>
                <StatsCard 
                  icon={<PauseIcon sx={{ color: 'white' }} />}
                  title="Pausas"
                  mainValue={pauses.by_category.reduce((sum, cat) => sum + cat.count, 0)}
                  mainLabel="Pausas totales"
                  color={COLORS.gradients.pauses}
                  details={pauses.by_category.map(category => ({
                    label: category.category,
                    value: `${category.count} (${category.total_minutes} min)`
                  }))}
                  onClick={() => {
                    setActiveTab(2);
                  }}
                />
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={activeCards.production && activeCards.pauses && activeCards.maintenance && activeCards.cleaning ? 3 : 4} sx={{ display: activeCards.maintenance ? 'block' : 'none' }}>
            <Fade in={true} style={{ transitionDelay: '300ms' }}>
              <Box>
                <StatsCard 
                  icon={<BuildIcon sx={{ color: 'white' }} />}
                  title="Mantenimiento"
                  mainValue={maintenance.total_orders}
                  mainLabel="Órdenes totales"
                  color={COLORS.gradients.maintenance}
                  progress={maintenance.completion_rate}
                  details={[
                    { label: 'Completadas', value: maintenance.completed_count },
                    { label: 'Tasa de completado', value: formatPercentage(maintenance.completion_rate) },
                    { label: 'Duración promedio', value: `${maintenance.avg_duration_minutes} min` }
                  ]}
                  onClick={() => {
                    setActiveTab(3);
                  }}
                />
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={activeCards.production && activeCards.pauses && activeCards.maintenance && activeCards.cleaning ? 3 : 4} sx={{ display: activeCards.cleaning ? 'block' : 'none' }}>
            <Fade in={true} style={{ transitionDelay: '400ms' }}>
              <Box>
                <StatsCard 
                  icon={<CleaningIcon sx={{ color: 'white' }} />}
                  title="Limpieza"
                  mainValue={cleaning.total_orders}
                  mainLabel="Órdenes totales"
                  color={COLORS.gradients.cleaning}
                  progress={parseFloat(cleaning.completion_rate)}
                  details={[
                    { label: 'Completadas', value: cleaning.completed_count },
                    { label: 'Tasa de completado', value: `${cleaning.completion_rate}%` },
                    { label: 'Duración promedio', value: `${cleaning.avg_duration_minutes} min` }
                  ]}
                  onClick={() => {
                    setActiveTab(3);
                  }}
                />
              </Box>
            </Fade>
          </Grid>
          
          {/* Gráficos mejorados */}
          <Grid item xs={12} md={6}>
            <Zoom in={true} style={{ transitionDelay: '500ms' }}>
              <Box>
                <ChartCard 
                  title="Producción y Calidad"
                  icon={<ProductionIcon fontSize="small" />}
                  color={COLORS.good}
                  info="Distribución de unidades buenas vs defectuosas"
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
          
          <Grid item xs={12} md={6}>
            <Zoom in={true} style={{ transitionDelay: '600ms' }}>
              <Box>
                <ChartCard 
                  title="Pausas por Categoría"
                  icon={<PauseIcon fontSize="small" />}
                  color={COLORS.pause}
                  info="Distribución de tiempos por categoría de pausa"
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
          
          <Grid item xs={12} md={6}>
            <Fade in={true} style={{ transitionDelay: '700ms' }}>
              <Box>
                <ChartCard 
                  title="Mantenimiento y Limpieza"
                  icon={<AssessmentIcon fontSize="small" />}
                  color={COLORS.maintenance}
                  info="Comparativa de órdenes completadas vs pendientes"
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
          
          <Grid item xs={12} md={6}>
            <Fade in={true} style={{ transitionDelay: '800ms' }}>
              <Box>
                <ChartCard 
                  title="Eficiencia Operativa"
                  icon={<SpeedIcon fontSize="small" />}
                  color={COLORS.cleaning}
                  info="Métricas de desempeño por departamento"
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
          
          
        </Grid>
      </Box>
    );
  };

  // Renderizado mejorado de los reportes de producción
  const renderImprovedProductionReport = () => {
    if (!productionData) return null;
    
    const { summary, orders, period } = productionData;
    
    // Datos para el gráfico de tiempo
    const timeData = [
      { name: 'Tiempo de Producción', value: summary.total_production_time_ms },
      { name: 'Tiempo de Pausa', value: summary.total_pause_time_ms },
      { name: 'Tiempo Efectivo', value: summary.total_effective_time_ms },
    ];
    
    return (
      <Box>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #1b5e20, #43a047)',
            color: 'white'
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Reporte de Producción: {formatDate(period.start_date)} - {formatDate(period.end_date)}
            </Typography>
            <Typography variant="subtitle1">
              Artículo: {period.article_code} • Última actualización: {getCurrentDateTime()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
              <IconButton 
                onClick={() => setShowFilters(!showFilters)} 
                color="inherit"
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refrescar datos">
              <IconButton 
                onClick={() => {
                  fetchProductionData();
                }} 
                color="inherit"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
        
        {showFilters && (
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fecha Fin"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button 
                variant="contained" 
                startIcon={<DateRangeIcon />}
                onClick={handleDateChange}
              >
                Aplicar Filtros
              </Button>
            </Box>
          </Paper>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Fade in={true} style={{ transitionDelay: '100ms' }}>
              <Box>
                <ChartCard 
                  title="Resumen de Producción"
                  icon={<ProductionIcon fontSize="small" />}
                  color={COLORS.good}
                  chart={
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
                            {summary.total_orders}
                          </Typography>
                          <Typography variant="body1" color="textSecondary">
                            Órdenes
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                            {summary.total_units.toLocaleString()}
                          </Typography>
                          <Typography variant="body1" color="textSecondary">
                            Unidades
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Unidades buenas:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {summary.total_good_units.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Unidades defectuosas:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {summary.total_defective_units.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Tasa de defectos:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color={summary.defective_rate > 5 ? 'error.main' : 'success.main'}>
                            {summary.defective_rate}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Tasa de producción:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {summary.production_rate_per_minute} u/min
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">Promedio por orden:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {summary.avg_good_units_per_order} unidades
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  }
                />
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Fade in={true} style={{ transitionDelay: '200ms' }}>
              <Box>
                <ChartCard 
                  title="Tiempos de Producción"
                  icon={<ScheduleIcon fontSize="small" />}
                  color="#2196f3"
                  chart={
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="info.main" fontWeight="bold" sx={{ mb: 1 }}>
                            {summary.total_production_time_hours}h
                          </Typography>
                          <Typography variant="body1" color="textSecondary">
                            Tiempo total
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                            {summary.efficiency_rate}%
                          </Typography>
                          <Typography variant="body1" color="textSecondary">
                            Eficiencia
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Tiempo de producción:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatTime(summary.total_production_time_ms)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Tiempo de pausa:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                            {formatTime(summary.total_pause_time_ms)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Tiempo efectivo:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                            {formatTime(summary.total_effective_time_ms)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Tiempo promedio:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {summary.avg_production_time_minutes} min/orden
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">Pausa promedio:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {summary.avg_pause_time_minutes} min/orden
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  }
                />
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Box>
                <ChartCard 
                  title="Distribución de Tiempo"
                  icon={<DonutIcon fontSize="small" />}
                  color={COLORS.pieColors[0]}
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
                                stopColor={COLORS.pieColors[index]}
                                stopOpacity={0.9}
                              />
                              <stop
                                offset="100%"
                                stopColor={COLORS.pieColors[index]}
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
              </Box>
            </Zoom>
          </Grid>
          
          {/* Gráfico de tendencia */}
          <Grid item xs={12}>
            <Zoom in={true} style={{ transitionDelay: '400ms' }}>
              <Box>
                <ChartCard 
                  title="Análisis de Órdenes de Producción"
                  icon={<BarChartIcon fontSize="small" />}
                  color={theme.palette.primary.main}
                  chart={
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
                  }
                />
              </Box>
            </Zoom>
          </Grid>
          
          {/* Lista de órdenes */}
          <Grid item xs={12}>
            <Fade in={true} style={{ transitionDelay: '500ms' }}>
              <Box>
                <TableCard 
                  title="Órdenes de Producción"
                  icon={<ProductionIcon fontSize="small" />}
                  color={theme.palette.success.main}
                >
                  {orders.length === 0 ? (
                    <Typography variant="body1" align="center" py={3}>
                      No hay órdenes de producción en el período seleccionado
                    </Typography>
                  ) : (
                    <Box sx={{ overflowX: 'auto', p: 2 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
                            <th style={{textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Código</th>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Artículo</th>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Descripción</th>
                            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>U. Buenas</th>
                            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Defect.</th>
                            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Total</th>
                            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>% Defect.</th>
                            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Duración</th>
                            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Prod. (u/min)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order, index) => (
                            <tr 
                              key={order.order_id} 
                              style={{ 
                                background: index % 2 === 0 ? 'white' : 'rgba(0, 0, 0, 0.02)',
                                transition: 'background-color 0.3s',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                              }}
                            >
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'medium' }}>{order.order_code}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.article_code}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.description}</td>
                              <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', color: '#2e7d32', fontWeight: 'bold' }}>
                                {order.production.good_units.toLocaleString()}
                              </td>
                              <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', color: '#c62828', fontWeight: 'bold' }}>
                                {order.production.defective_units.toLocaleString()}
                              </td>
                              <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                                {order.production.total_units.toLocaleString()}
                              </td>
                              <td style={{ 
                                textAlign: 'right', 
                                padding: '10px 12px', 
                                borderBottom: '1px solid #e0e0e0', 
                                fontWeight: 'bold',
                                color: parseFloat(order.production.defective_rate) > 5 ? '#c62828' : '#2e7d32'
                              }}>
                                {order.production.defective_rate}%
                              </td>
                              <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                                {formatTime(order.duration_ms)}
                              </td>
                              <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                                {order.rates.total_production_rate}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </TableCard>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Renderizado mejorado de reportes de pausas
  const renderImprovedPausesReport = () => {
    if (!pausesData) return null;
    
    const { summary, categories, period } = pausesData;
    
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
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #e65100, #ff9800)',
            color: 'white'
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Reporte de Pausas: {formatDate(period.start_date)} - {formatDate(period.end_date)}
            </Typography>
            <Typography variant="subtitle1">
              Categoría: {period.category || 'Todas'} • Última actualización: {getCurrentDateTime()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
              <IconButton 
                onClick={() => setShowFilters(!showFilters)} 
                color="inherit"
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refrescar datos">
              <IconButton 
                onClick={() => {
                  fetchPausesData();
                }} 
                color="inherit"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
        
        {showFilters && (
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fecha Fin"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button 
                variant="contained" 
                startIcon={<DateRangeIcon />}
                onClick={handleDateChange}
                color="warning"
              >
                Aplicar Filtros
              </Button>
            </Box>
          </Paper>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Fade in={true} style={{ transitionDelay: '100ms' }}>
              <Box>
                <ChartCard 
                  title="Resumen de Pausas"
                  icon={<PauseIcon fontSize="small" />}
                  color={COLORS.pause}
                  chart={
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="warning.main" fontWeight="bold" sx={{ mb: 1 }}>
                            {summary.total_pauses}
                          </Typography>
                          <Typography variant="body1" color="textSecondary">
                            Pausas totales
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="info.main" fontWeight="bold" sx={{ mb: 1 }}>
                            {summary.total_pause_time_hours}h
                          </Typography>
                          <Typography variant="body1" color="textSecondary">
                            Tiempo total
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Tiempo total:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatTime(summary.total_pause_time_ms)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Categorías:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {summary.categories_count}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1">Tiempo promedio:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatTime(Math.round(summary.total_pause_time_ms / summary.total_pauses))} / pausa
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">Impacto en producción:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color={
                            summary.total_pause_time_ms / (24 * 60 * 60 * 1000) > 1 ? 'error.main' : 'warning.main'
                          }>
                            {(summary.total_pause_time_ms / (24 * 60 * 60 * 1000)).toFixed(2)} días
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  }
                />
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Box>
                <ChartCard 
                  title="Pausas por Categoría"
                  icon={<AssessmentIcon fontSize="small" />}
                  color="#ff9800"
                  chart={
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoriesChartData}
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
              </Box>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Fade in={true} style={{ transitionDelay: '300ms' }}>
              <Box>
                <ChartCard 
                  title="Principales Razones de Pausa"
                  icon={<DonutIcon fontSize="small" />}
                  color="#ff5722"
                  chart={
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {topReasons.map((_, index) => (
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
                                stopColor={COLORS.pieColors[index % COLORS.pieColors.length]}
                                stopOpacity={0.9}
                              />
                              <stop
                                offset="100%"
                                stopColor={COLORS.pieColors[index % COLORS.pieColors.length]}
                                stopOpacity={0.6}
                              />
                            </radialGradient>
                          ))}
                        </defs>
                        <Pie
                          data={topReasons}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => percent > 0.05 ? `${name.substring(0, 15)}${name.length > 15 ? '...' : ''}: ${(percent * 100).toFixed(0)}%` : ''}
                        >
                          {topReasons.map((entry, index) => (
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
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Fade in={true} style={{ transitionDelay: '400ms' }}>
              <Box>
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
              </Box>
            </Fade>
          </Grid>
          
          <Grid item xs={12}>
            <Zoom in={true} style={{ transitionDelay: '500ms' }}>
              <Box>
                <TableCard 
                  title="Detalle de Pausas"
                  icon={<PauseIcon fontSize="small" />}
                  color="#ff9800"
                >
                  <Box sx={{ overflowX: 'auto', p: 2 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
                          <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Orden</th>
                          <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Categoría</th>
                          <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Razón</th>
                          <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Inicio</th>
                          <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Fin</th>
                          <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Duración</th>
                          <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Comentarios</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.flatMap((category, categoryIndex) => 
                          category.reasons.flatMap(reason => 
                            reason.pauses.map((pause, pauseIndex) => (
                              <tr 
                                key={pause.id}
                                style={{ 
                                  background: (categoryIndex + pauseIndex) % 2 === 0 ? 'white' : 'rgba(0, 0, 0, 0.02)',
                                  transition: 'background-color 0.3s',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                  }
                                }}
                              >
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'medium' }}>{pause.order_code}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                                  <Chip 
                                    label={category.category} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: COLORS.pieColors[categoryIndex % COLORS.pieColors.length],
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }} 
                                  />
                                </td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{reason.description}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(pause.start_time)}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(pause.end_time)}</td>
                                <td style={{ 
                                  textAlign: 'right', 
                                  padding: '10px 12px', 
                                  borderBottom: '1px solid #e0e0e0',
                                  fontWeight: 'bold',
                                  color: pause.duration_ms > 3600000 ? '#c62828' : '#1565c0'
                                }}>
                                  {formatTime(pause.duration_ms)}
                                </td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                                  {pause.comments || '-'}
                                </td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </Box>
                </TableCard>
              </Box>
            </Zoom>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Renderizado mejorado de reporte de mantenimiento y limpieza
  const renderImprovedMaintenanceCleaningReport = () => {
    if (!maintenanceCleaningData) return null;
    
    const { maintenance, cleaning, period } = maintenanceCleaningData;
    
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
    
    return (
      <Box>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #1565c0, #42a5f5)',
            color: 'white'
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Reporte de Mantenimiento y Limpieza: {formatDate(period.start_date)} - {formatDate(period.end_date)}
            </Typography>
            <Typography variant="subtitle1">
              Tipo: {period.type || 'Todos'} • Última actualización: {getCurrentDateTime()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
              <IconButton 
                onClick={() => setShowFilters(!showFilters)} 
                color="inherit"
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refrescar datos">
              <IconButton 
                onClick={() => {
                  fetchMaintenanceCleaningData();
                }} 
                color="inherit"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
        
        {showFilters && (
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fecha Fin"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button 
                variant="contained" 
                startIcon={<DateRangeIcon />}
                onClick={handleDateChange}
                color="primary"
              >
                Aplicar Filtros
              </Button>
            </Box>
          </Paper>
        )}
        
        <Grid container spacing={3}>
          {/* Limpieza */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ pl: 1, borderLeft: '4px solid #9c27b0', ml: 1 }}>
              Limpieza
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Fade in={true} style={{ transitionDelay: '100ms' }}>
              <Box>
                <ChartCard 
                  title="Resumen de Limpieza"
                  icon={<CleaningIcon fontSize="small" />}
                  color="#9c27b0"
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
                                stopColor={COLORS.pieColors[index % COLORS.pieColors.length]}
                                stopOpacity={0.9}
                              />
                              <stop
                                offset="100%"
                                stopColor={COLORS.pieColors[index % COLORS.pieColors.length]}
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
                        <RechartsTooltip formatter={(value, name, props) => [
                          formatTime(value),
                          `${props.payload.name}`
                        ]} />
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
                                stopColor={COLORS.pieColors[(index + 5) % COLORS.pieColors.length]}
                                stopOpacity={0.9}
                              />
                              <stop
                                offset="100%"
                                stopColor={COLORS.pieColors[(index + 5) % COLORS.pieColors.length]}
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
                        <RechartsTooltip formatter={(value, name, props) => [
                          formatTime(value),
                          `${props.payload.name}`
                        ]} />
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
                <TableCard 
                  title="Órdenes de Limpieza"
                  icon={<CleaningIcon fontSize="small" />}
                  color="#9c27b0"
                >
                  {cleaning.orders.length === 0 ? (
                    <Typography variant="body1" align="center" py={3}>
                      No hay órdenes de limpieza en el período seleccionado
                    </Typography>
                  ) : (
                    <Box sx={{ overflowX: 'auto', p: 2 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Código</th>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Tipo</th>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Área</th>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Descripción</th>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Operador</th>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Inicio</th>
                            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Fin</th>
                            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Duración</th>
                            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Est. vs Real</th>
                            <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cleaning.orders.map((order, index) => (
                            <tr 
                              key={order.order_id} 
                              style={{ 
                                background: index % 2 === 0 ? 'white' : 'rgba(0, 0, 0, 0.02)',
                                transition: 'background-color 0.3s',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                              }}
                            >
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'medium' }}>{order.order_code}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                                <Chip 
                                  label={order.cleaning_type} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: '#9c27b0',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }} 
                                />
                              </td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.area_name}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.description}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.operator_name || '-'}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(order.start_time)}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(order.end_time)}</td>
                              <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                                {formatTime(order.duration_ms)}
                              </td>
                              <td style={{ 
                                textAlign: 'right', 
                                padding: '10px 12px', 
                                borderBottom: '1px solid #e0e0e0',
                                fontWeight: 'bold',
                                color: (order.estimated_vs_actual * 100) > 110 ? '#c62828' : 
                                       (order.estimated_vs_actual * 100) < 90 ? '#2e7d32' : '#1565c0'
                              }}>
                                {(order.estimated_vs_actual * 100).toFixed(2)}%
                              </td>
                              <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                                {order.completed ? (
                                  <Chip 
                                    icon={<CheckCircleIcon />} 
                                    label="Completada" 
                                    size="small" 
                                    color="success" 
                                    variant="outlined" 
                                  />
                                ) : (
                                  <Chip 
                                    icon={<WarningIcon />} 
                                    label="Pendiente" 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined" 
                                  />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </TableCard>
              </Box>
            </Fade>
          </Grid>
          
          {/* Mantenimiento */}
          {maintenance.total_orders > 0 && (
            <>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom sx={{ pl: 1, borderLeft: '4px solid #2196f3', ml: 1, mt: 2 }}>
                  Mantenimiento
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Fade in={true} style={{ transitionDelay: '500ms' }}>
                  <Box>
                    <ChartCard 
                      title="Resumen de Mantenimiento"
                      icon={<BuildIcon fontSize="small" />}
                      color="#2196f3"
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
                                      stopColor={COLORS.pieColors[(index + 2) % COLORS.pieColors.length]}
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor={COLORS.pieColors[(index + 2) % COLORS.pieColors.length]}
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
                                      stopColor={COLORS.pieColors[(index + 7) % COLORS.pieColors.length]}
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor={COLORS.pieColors[(index + 7) % COLORS.pieColors.length]}
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
                      <TableCard 
                        title="Órdenes de Mantenimiento"
                        icon={<BuildIcon fontSize="small" />}
                        color="#2196f3"
                      >
                        <Box sx={{ overflowX: 'auto', p: 2 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Código</th>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Tipo</th>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Equipo</th>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Descripción</th>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Técnico</th>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Inicio</th>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Fin</th>
                                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Duración</th>
                                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {maintenance.orders.map((order, index) => (
                                <tr 
                                  key={order.order_id} 
                                  style={{ 
                                    background: index % 2 === 0 ? 'white' : 'rgba(0, 0, 0, 0.02)',
                                    transition: 'background-color 0.3s',
                                    '&:hover': {
                                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                  }}
                                >
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'medium' }}>{order.order_code}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                                    <Chip 
                                      label={order.maintenance_type} 
                                      size="small" 
                                      sx={{ 
                                        bgcolor: '#2196f3',
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }} 
                                    />
                                  </td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.equipment_name}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.description}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.technician_name || '-'}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(order.start_time)}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(order.end_time)}</td>
                                  <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                                    {formatTime(order.duration_ms)}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                                    {order.completed ? (
                                      <Chip 
                                        icon={<CheckCircleIcon />} 
                                        label="Completada" 
                                        size="small" 
                                        color="success" 
                                        variant="outlined" 
                                      />
                                    ) : (
                                      <Chip 
                                        icon={<WarningIcon />} 
                                        label="Pendiente" 
                                        size="small" 
                                        color="warning" 
                                        variant="outlined" 
                                      />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      </TableCard>
                    </Box>
                  </Fade>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      <Box sx={{ my: 3 }}>
      
     
          
 
        
        {error && (
          <Paper elevation={3} sx={{ p: 2, mb: 3, bgcolor: '#fff0f0', color: '#c62828', borderLeft: '4px solid #c62828' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WarningIcon color="error" />
              <Typography>{error}</Typography>
            </Box>
          </Paper>
        )}
        
        {isLoading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            my: 4, 
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={60} />
            <Typography variant="subtitle1" color="textSecondary">
              Cargando datos...
            </Typography>
          </Box>
        )}
        
        {!isLoading && (
          <>
            <Paper sx={{ mb: 3 }} elevation={3}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 72,
                    borderRight: '1px solid rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }
                }}
              >
                <Tab 
                  icon={<TrendingUpIcon />} 
                  label="Panel de Control" 
                  iconPosition="start"
                  sx={{ 
                    bgcolor: activeTab === 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                  }}
                />
                <Tab 
                icon={<ProductionIcon />} 
                  label="Producción" 
                  iconPosition="start"
                  sx={{ 
                    bgcolor: activeTab === 1 ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                  }}
                />
                <Tab 
                  icon={<PauseIcon />} 
                  label="Pausas" 
                  iconPosition="start"
                  sx={{ 
                    bgcolor: activeTab === 2 ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                  }}
                />
                <Tab 
                  icon={<CleaningIcon />} 
                  label="Mantenimiento y Limpieza" 
                  iconPosition="start"
                  sx={{ 
                    bgcolor: activeTab === 3 ? 'rgba(33, 150, 243, 0.1)' : 'transparent'
                  }}
                />
              </Tabs>
            </Paper>
            
            {activeTab === 0 && renderImprovedDashboardOverview()}
            {activeTab === 1 && renderImprovedProductionReport()}
            {activeTab === 2 && renderImprovedPausesReport()}
            {activeTab === 3 && renderImprovedMaintenanceCleaningReport()}
          </>
        )}
      </Box>
      
      {/* Estilos para las filas con efecto hover */}
      <style>
        {`
          .hover-row:hover {
            background-color: rgba(0, 0, 0, 0.04);
            transition: background-color 0.3s;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .pulse-animation {
            animation: pulse 2s infinite;
          }
        `}
      </style>
    </Container>
  );
};

export default DashboardReports;