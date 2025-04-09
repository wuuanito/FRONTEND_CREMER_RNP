import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  LinearProgress,
  useTheme
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
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
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
  Sector
} from 'recharts';
import { format, parseISO, subMonths, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// API URLs
const API_BASE_URL = 'http://192.168.11.25:3000/api';
const DASHBOARD_URL = `${API_BASE_URL}/reports/dashboard`;
const PRODUCTION_URL = `${API_BASE_URL}/reports/production`;
const PAUSES_URL = `${API_BASE_URL}/reports/pauses`;
const MAINTENANCE_CLEANING_URL = `${API_BASE_URL}/reports/maintenance-cleaning`;

// Interfaces para los datos
interface DashboardData {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  production: {
    total_orders: number;
    total_good_units: string;
    total_defective_units: string;
    defective_rate: number;
    avg_duration_minutes: string;
  };
  pauses: {
    by_category: {
      category: string;
      count: number;
      total_minutes: string;
    }[];
  };
  maintenance: {
    total_orders: number;
    completed_count: number;
    avg_duration_minutes: number;
    completion_rate: number;
  };
  cleaning: {
    total_orders: number;
    completed_count: string;
    avg_duration_minutes: string;
    completion_rate: string;
  };
  charts: {
    production_by_day: any[];
  };
}

interface ProductionReportData {
  period: {
    start_date: string;
    end_date: string;
    article_code: string;
  };
  summary: {
    total_orders: number;
    total_good_units: number;
    total_defective_units: number;
    total_units: number;
    defective_rate: string;
    total_production_time_ms: number;
    total_production_time_hours: string;
    total_pause_time_ms: number;
    total_pause_time_hours: string;
    total_effective_time_ms: number;
    total_effective_time_hours: string;
    efficiency_rate: string;
    avg_production_time_minutes: string;
    avg_pause_time_minutes: string;
    avg_effective_time_minutes: string;
    avg_good_units_per_order: string;
    production_rate_per_minute: string;
  };
  orders: {
    order_id: number;
    order_code: string;
    article_code: string;
    description: string;
    start_time: string;
    end_time: string;
    duration_ms: number;
    duration_minutes: number;
    production: {
      good_units: number;
      defective_units: number;
      total_units: number;
      defective_rate: string;
    };
    times: {
      total_pause_time_ms: number;
      total_pause_time_minutes: number;
      effective_production_time_ms: number;
      effective_production_time_minutes: number;
    };
    rates: {
      good_production_rate: string;
      total_production_rate: string;
    };
  }[];
}

interface PausesReportData {
  period: {
    start_date: string;
    end_date: string;
    category: string;
  };
  summary: {
    total_pauses: number;
    total_pause_time_ms: number;
    total_pause_time_minutes: number;
    total_pause_time_hours: string;
    categories_count: number;
  };
  categories: {
    category: string;
    count: number;
    total_duration_ms: number;
    total_duration_minutes: number;
    total_duration_hours: string;
    percentage_of_total: string;
    reasons: {
      id: number;
      description: string;
      count: number;
      total_duration_ms: number;
      total_duration_minutes: number;
      percentage_of_category: string;
      percentage_of_total: string;
      pauses: {
        id: number;
        order_code: string;
        start_time: string;
        end_time: string;
        duration_ms: number;
        duration_minutes: number;
        comments: string;
      }[];
    }[];
  }[];
}

interface MaintenanceCleaningReportData {
  period: {
    start_date: string;
    end_date: string;
    type: string;
  };
  maintenance: {
    total_orders: number;
    total_time_ms: number;
    total_time_hours: string;
    avg_time_minutes: number;
    by_type: {
      type: string;
      count: number;
      total_duration_ms: number;
      total_duration_hours: string;
      percentage: string;
    }[];
    by_equipment: {
      equipment_id: string;
      equipment_name: string;
      count: number;
      total_duration_ms: number;
      total_duration_hours: string;
      percentage: string;
    }[];
    orders: any[];
  };
  cleaning: {
    total_orders: number;
    total_time_ms: number;
    total_time_hours: string;
    avg_time_minutes: number;
    by_type: {
      type: string;
      count: number;
      total_duration_ms: number;
      total_duration_hours: string;
      percentage: string;
    }[];
    by_area: {
      area_id: string;
      area_name: string;
      count: number;
      total_duration_ms: number;
      total_duration_hours: string;
      percentage: string;
    }[];
    orders: {
      order_id: number;
      order_code: string;
      cleaning_type: string;
      area_id: string;
      area_name: string;
      description: string;
      operator_name: string | null;
      associated_manufacturing_order_id: number | null;
      start_time: string;
      end_time: string;
      duration_ms: number;
      duration_minutes: number;
      completed: boolean;
      completion_notes: string | null;
      products_used: string | null;
      estimated_vs_actual: number;
    }[];
  };
}
// Componente principal
const DashboardReports: React.FC = () => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados para los reportes
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [productionData, setProductionData] = useState<ProductionReportData | null>(null);
    const [pausesData, setPausesData] = useState<PausesReportData | null>(null);
    const [maintenanceCleaningData, setMaintenanceCleaningData] = useState<MaintenanceCleaningReportData | null>(null);
    
    // Estados para los filtros
    const [startDate, setStartDate] = useState<string>(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    
    // Estado para el índice activo de los gráficos de sectores (corregido: movido al nivel superior)
    const [activePieIndex, setActivePieIndex] = useState<number>(0);
    
    // Colores para gráficos
    const COLORS = {
      good: theme.palette.success.main,
      defective: theme.palette.error.main,
      pause: theme.palette.warning.main,
      maintenance: theme.palette.info.main,
      cleaning: theme.palette.primary.main,
      production: '#4caf50',
      pieColors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'],
    };
    
    // Cargar datos iniciales
    useEffect(() => {
      fetchAllReports();
    }, []);
    
    // Función para cargar todos los reportes
    const fetchAllReports = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchProductionData(),
          fetchPausesData(),
          fetchMaintenanceCleaningData()
        ]);
      } catch (err: any) {
        setError(`Error al cargar reportes: ${err.message}`);
        console.error('Error al cargar reportes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Funciones para cargar cada reporte
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(DASHBOARD_URL);
        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status}`);
        }
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (err: any) {
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
        const data: ProductionReportData = await response.json();
        setProductionData(data);
      } catch (err: any) {
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
        const data: PausesReportData = await response.json();
        setPausesData(data);
      } catch (err: any) {
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
        const data: MaintenanceCleaningReportData = await response.json();
        setMaintenanceCleaningData(data);
      } catch (err: any) {
        console.error('Error al cargar reporte de mantenimiento y limpieza:', err);
        throw err;
      }
    };
    
    // Función para manejar el cambio de fecha
    const handleDateChange = () => {
      fetchProductionData();
      fetchPausesData();
      fetchMaintenanceCleaningData();
    };
    
    // Función para manejar el cambio de tab
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    };
    
    // Función para formatear fechas
    const formatDate = (dateString: string | null): string => {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    };
    
    // Función para formatear porcentajes
    const formatPercentage = (value: string | number): string => {
      if (typeof value === 'string') {
        return `${parseFloat(value).toFixed(2)}%`;
      }
      return `${value.toFixed(2)}%`;
    };
    
    // Función para formatear tiempo en ms
    const formatTime = (ms: number): string => {
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      
      let result = '';
      if (hours > 0) result += `${hours}h `;
      if (minutes > 0 || hours > 0) result += `${minutes}m `;
      result += `${seconds}s`;
      
      return result;
    };
    // Componente para el gráfico de sectores con efecto de hover
  const renderActiveShape = (props: any) => {
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
  
  // COMPONENTES DE GRÁFICOS
  
  // Dashboard General
  const renderDashboardOverview = () => {
    if (!dashboardData) return null;
    
    const { production, pauses, maintenance, cleaning, period } = dashboardData;
    
    // Datos para gráfico de producción
    const productionData = [
      { name: 'Unidades Buenas', value: parseInt(production.total_good_units) },
      { name: 'Unidades Defectuosas', value: parseInt(production.total_defective_units) },
    ];
    
    // Datos para gráfico de pausas
    const pausesData = pauses.by_category.map(category => ({
      name: category.category,
      value: parseInt(category.total_minutes),
    }));
    
    // Datos para gráfico de mantenimiento/limpieza
    const maintCleanData = [
      { name: 'Mant. Completado', value: maintenance.completed_count },
      { name: 'Mant. Pendiente', value: maintenance.total_orders - maintenance.completed_count },
      { name: 'Limp. Completada', value: parseInt(cleaning.completed_count) },
      { name: 'Limp. Pendiente', value: cleaning.total_orders - parseInt(cleaning.completed_count) },
    ];
    
    // NOTA: Ya no declaramos activePieIndex aquí, lo usamos directamente del estado del componente
    
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Período de reporte: {formatDate(period.start_date)} - {formatDate(period.end_date)} ({period.days} días)
              </Typography>
            </Paper>
          </Grid>
          
          {/* Stats Cards */}
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardHeader 
                title="Producción" 
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<ProductionIcon color="primary" />}
              />
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom>
                  {production.total_orders}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Órdenes totales
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  <strong>Unidades buenas:</strong> {production.total_good_units}
                </Typography>
                <Typography variant="body2">
                  <strong>Defectuosas:</strong> {production.total_defective_units}
                </Typography>
                <Typography variant="body2">
                  <strong>Tasa de defectos:</strong> {formatPercentage(production.defective_rate)}
                </Typography>
                <Typography variant="body2">
                  <strong>Duración promedio:</strong> {production.avg_duration_minutes} min
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardHeader 
                title="Pausas" 
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<PauseIcon color="warning" />}
              />
              <CardContent>
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {pauses.by_category.reduce((sum, cat) => sum + cat.count, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pausas totales
                </Typography>
                <Divider sx={{ my: 1 }} />
                {pauses.by_category.map((category, idx) => (
                  <Typography key={idx} variant="body2">
                    <strong>{category.category}:</strong> {category.count} ({category.total_minutes} min)
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardHeader 
                title="Mantenimiento" 
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<BuildIcon color="info" />}
              />
              <CardContent>
                <Typography variant="h4" color="info.main" gutterBottom>
                  {maintenance.total_orders}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Órdenes totales
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  <strong>Completadas:</strong> {maintenance.completed_count}
                </Typography>
                <Typography variant="body2">
                  <strong>Tasa de completado:</strong> {formatPercentage(maintenance.completion_rate)}
                </Typography>
                <Typography variant="body2">
                  <strong>Duración promedio:</strong> {maintenance.avg_duration_minutes} min
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={maintenance.completion_rate}
                  color="info"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardHeader 
                title="Limpieza" 
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<CleaningIcon color="success" />}
              />
              <CardContent>
                <Typography variant="h4" color="success.main" gutterBottom>
                  {cleaning.total_orders}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Órdenes totales
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  <strong>Completadas:</strong> {cleaning.completed_count}
                </Typography>
                <Typography variant="body2">
                  <strong>Tasa de completado:</strong> {cleaning.completion_rate}%
                </Typography>
                <Typography variant="body2">
                  <strong>Duración promedio:</strong> {cleaning.avg_duration_minutes} min
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(cleaning.completion_rate)}
                  color="success"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Charts */}
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Producción" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  {productionData.reduce((sum, item) => sum + item.value, 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activePieIndex}
                          activeShape={renderActiveShape}
                          data={productionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          onMouseEnter={(_, index) => setActivePieIndex(index)}
                        >
                          {productionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.good : COLORS.defective} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1" color="textSecondary">
                        No hay datos de producción disponibles
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Pausas por Categoría" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  {pausesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pausesData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pausesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1" color="textSecondary">
                        No hay datos de pausas disponibles
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Mantenimiento y Limpieza" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Mantenimiento', completado: maintenance.completed_count, pendiente: maintenance.total_orders - maintenance.completed_count },
                        { name: 'Limpieza', completado: parseInt(cleaning.completed_count), pendiente: cleaning.total_orders - parseInt(cleaning.completed_count) }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="completado" name="Completado" stackId="a" fill={COLORS.good} />
                      <Bar dataKey="pendiente" name="Pendiente" stackId="a" fill={COLORS.defective} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  // Reporte de Producción
// Reporte de Producción
const renderProductionReport = () => {
    if (!productionData) return null;
    
    const { summary, orders, period } = productionData;
    
    // Datos para el gráfico de tiempo
    const timeData = [
      { name: 'Tiempo de Producción', value: summary.total_production_time_ms },
      { name: 'Tiempo de Pausa', value: summary.total_pause_time_ms },
      { name: 'Tiempo Efectivo', value: summary.total_effective_time_ms },
    ];
    
    // Datos para el gráfico de eficiencia
    const efficiencyData = {
      name: 'Eficiencia',
      value: parseFloat(summary.efficiency_rate),
    };
    
    return (
      <Box>
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6">
                Reporte de Producción: {formatDate(period.start_date)} - {formatDate(period.end_date)}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Artículo: {period.article_code}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
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
                  Filtrar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Grid container spacing={3}>
          {/* Resumen */}
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Resumen de Producción" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="primary" align="center">
                      {summary.total_orders}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Órdenes
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="success.main" align="center">
                      {summary.total_units.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Unidades totales
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" gutterBottom>
                  <strong>Unidades buenas:</strong> {summary.total_good_units.toLocaleString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Unidades defectuosas:</strong> {summary.total_defective_units.toLocaleString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tasa de defectos:</strong> {summary.defective_rate}%
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tasa de producción:</strong> {summary.production_rate_per_minute} unidades/min
                </Typography>
                <Typography variant="body2">
                  <strong>Promedio por orden:</strong> {summary.avg_good_units_per_order} unidades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Tiempos de Producción" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="info.main" align="center">
                      {summary.total_production_time_hours}h
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Tiempo total
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="success.main" align="center">
                      {summary.efficiency_rate}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Eficiencia
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" gutterBottom>
                  <strong>Tiempo de producción:</strong> {formatTime(summary.total_production_time_ms)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tiempo de pausa:</strong> {formatTime(summary.total_pause_time_ms)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tiempo efectivo:</strong> {formatTime(summary.total_effective_time_ms)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tiempo promedio:</strong> {summary.avg_production_time_minutes} min/orden
                </Typography>
                <Typography variant="body2">
                  <strong>Pausa promedio:</strong> {summary.avg_pause_time_minutes} min/orden
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Distribución de Tiempo" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {timeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatTime(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Lista de órdenes */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardHeader 
                title="Órdenes de Producción" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <Divider />
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 1100, p: 2 }}>
                  {orders.length === 0 ? (
                    <Typography variant="body1" align="center" py={3}>
                      No hay órdenes de producción en el período seleccionado
                    </Typography>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Código</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Artículo</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Descripción</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Unidades Buenas</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Defectuosas</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Total</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Defectos %</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Duración</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Tasa (u/min)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.order_id} className="hover-row">
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.order_code}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.article_code}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.description}</td>
                            <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{order.production.good_units.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{order.production.defective_units.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{order.production.total_units.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{order.production.defective_rate}%</td>
                            <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{formatTime(order.duration_ms)}</td>
                            <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{order.rates.total_production_rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  // Reporte de Pausas
  const renderPausesReport = () => {
    if (!pausesData) return null;
    
    const { summary, categories, period } = pausesData;
    
    // Datos para el gráfico de categorías
    const categoriesChartData = categories.map(cat => ({
      name: cat.category,
      value: cat.total_duration_ms,
      percentage: parseFloat(cat.percentage_of_total)
    }));
    
    // Datos para el gráfico de razones
    let reasonsChartData: any[] = [];
    categories.forEach(cat => {
      cat.reasons.forEach(reason => {
        reasonsChartData.push({
          category: cat.category,
          name: reason.description,
          value: reason.total_duration_ms,
          percentage: parseFloat(reason.percentage_of_total)
        });
      });
    });
    
    // Limitar a las principales razones para el gráfico
    reasonsChartData.sort((a, b) => b.value - a.value);
    const topReasons = reasonsChartData.slice(0, 5);
    
    return (
      <Box>
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6">
                Reporte de Pausas: {formatDate(period.start_date)} - {formatDate(period.end_date)}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Categoría: {period.category}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
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
                  Filtrar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Grid container spacing={3}>
          {/* Resumen */}
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Resumen de Pausas" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="warning.main" align="center">
                      {summary.total_pauses}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Pausas totales
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="info.main" align="center">
                      {summary.total_pause_time_hours}h
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Tiempo total
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" gutterBottom>
                  <strong>Tiempo total:</strong> {formatTime(summary.total_pause_time_ms)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Categorías:</strong> {summary.categories_count}
                </Typography>
                <Typography variant="body2">
                  <strong>Tiempo promedio:</strong> {formatTime(Math.round(summary.total_pause_time_ms / summary.total_pauses))} por pausa
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card elevation={3}>
              <CardHeader 
                title="Pausas por Categoría" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  {categoriesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoriesChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <RechartsTooltip formatter={(value, name) => [
                          name === 'value' ? formatTime(value as number) : `${value}%`,
                          name === 'value' ? 'Duración' : 'Porcentaje'
                        ]} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="value" name="Duración" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="percentage" name="Porcentaje" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1" color="textSecondary">
                        No hay datos de pausas disponibles
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Principales razones */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader 
                title="Principales Razones de Pausa" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  {topReasons.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topReasons}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {topReasons.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatTime(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1" color="textSecondary">
                        No hay datos de razones de pausa disponibles
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Detalle de categorías */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader 
                title="Detalle por Categorías" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <Divider />
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {categories.map((category) => (
                  <Box key={category.category} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>{category.category}</strong> - {category.count} pausas ({formatTime(category.total_duration_ms)})
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    {category.reasons.map((reason) => (
                      <Box key={reason.id} sx={{ ml: 2, mb: 1 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>{reason.description}:</strong> {reason.count} pausas, {formatTime(reason.total_duration_ms)} ({reason.percentage_of_category}%)
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
          
          {/* Lista de pausas */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardHeader 
                title="Detalle de Pausas" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <Divider />
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 900, p: 2 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Orden</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Categoría</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Razón</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Inicio</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Fin</th>
                        <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Duración</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Comentarios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.flatMap(category => 
                        category.reasons.flatMap(reason => 
                          reason.pauses.map(pause => (
                            <tr key={pause.id} className="hover-row">
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{pause.order_code}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{category.category}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{reason.description}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{formatDate(pause.start_time)}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{formatDate(pause.end_time)}</td>
                              <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{formatTime(pause.duration_ms)}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{pause.comments || '-'}</td>
                            </tr>
                          ))
                        )
                      )}
                    </tbody>
                  </table>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Reporte de Mantenimiento y Limpieza
  const renderMaintenanceCleaningReport = () => {
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
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6">
                Reporte de Mantenimiento y Limpieza: {formatDate(period.start_date)} - {formatDate(period.end_date)}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Tipo: {period.type}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
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
                  Filtrar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Grid container spacing={3}>
          {/* Resumen limpieza */}
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Resumen de Limpieza" 
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<CleaningIcon color="primary" />}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="primary" align="center">
                      {cleaning.total_orders}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Órdenes totales
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="info.main" align="center">
                      {cleaning.total_time_hours}h
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Tiempo total
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" gutterBottom>
                  <strong>Tiempo total:</strong> {formatTime(cleaning.total_time_ms)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Promedio:</strong> {cleaning.avg_time_minutes} min por orden
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tipos:</strong> {cleaning.by_type.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Áreas:</strong> {cleaning.by_area.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Gráficos limpieza */}
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Limpieza por Tipo" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ height: 260 }}>
                  {cleaningTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cleaningTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {cleaningTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatTime(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1" color="textSecondary">
                        No hay datos de limpieza disponibles
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader 
                title="Limpieza por Área" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ height: 260 }}>
                  {cleaningAreaData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cleaningAreaData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {cleaningAreaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatTime(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                      <Typography variant="body1" color="textSecondary">
                        No hay datos de áreas disponibles
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Lista de órdenes de limpieza */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardHeader 
                title="Órdenes de Limpieza" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <Divider />
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 1000, p: 2 }}>
                  {cleaning.orders.length === 0 ? (
                    <Typography variant="body1" align="center" py={3}>
                      No hay órdenes de limpieza en el período seleccionado
                    </Typography>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Código</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Tipo</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Área</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Descripción</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Operador</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Inicio</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Fin</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Duración</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Est. vs Real</th>
                          <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Completada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cleaning.orders.map((order) => (
                          <tr key={order.order_id} className="hover-row">
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.order_code}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.cleaning_type}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.area_name}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.description}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.operator_name || '-'}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{formatDate(order.start_time)}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{formatDate(order.end_time)}</td>
                            <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{formatTime(order.duration_ms)}</td>
                            <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{(order.estimated_vs_actual * 100).toFixed(2)}%</td>
                            <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
                              {order.completed ? (
                                <CheckCircleIcon color="success" style={{ fontSize: '1.2rem' }} />
                              ) : (
                                <WarningIcon color="warning" style={{ fontSize: '1.2rem' }} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Resumen mantenimiento */}
          {maintenance.total_orders > 0 && (
            <>
              <Grid item xs={12} md={4}>
                <Card elevation={3}>
                  <CardHeader 
                    title="Resumen de Mantenimiento" 
                    titleTypographyProps={{ variant: 'h6' }}
                    avatar={<BuildIcon color="info" />}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="h4" color="info.main" align="center">
                          {maintenance.total_orders}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" align="center">
                          Órdenes totales
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h4" color="info.main" align="center">
                          {maintenance.total_time_hours}h
                        </Typography>
                        <Typography variant="body2" color="textSecondary" align="center">
                          Tiempo total
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Tiempo total:</strong> {formatTime(maintenance.total_time_ms)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Promedio:</strong> {maintenance.avg_time_minutes} min por orden
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {maintenance.by_type.length > 0 && (
                <Grid item xs={12} md={4}>
                  <Card elevation={3}>
                    <CardHeader 
                      title="Mantenimiento por Tipo" 
                      titleTypographyProps={{ variant: 'h6' }}
                    />
                    <CardContent>
                      <Box sx={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={maintenance.by_type.map(type => ({
                                name: type.type,
                                value: type.total_duration_ms,
                                percentage: parseFloat(type.percentage)
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {maintenance.by_type.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => formatTime(value as number)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {maintenance.by_equipment.length > 0 && (
                <Grid item xs={12} md={4}>
                  <Card elevation={3}>
                    <CardHeader 
                      title="Mantenimiento por Equipo" 
                      titleTypographyProps={{ variant: 'h6' }}
                    />
                    <CardContent>
                      <Box sx={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={maintenance.by_equipment.map(equip => ({
                                name: equip.equipment_name,
                                value: equip.total_duration_ms,
                                percentage: parseFloat(equip.percentage)
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {maintenance.by_equipment.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => formatTime(value as number)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {maintenance.orders.length > 0 && (
                <Grid item xs={12}>
                  <Card elevation={3}>
                    <CardHeader 
                      title="Órdenes de Mantenimiento" 
                      titleTypographyProps={{ variant: 'h6' }}
                    />
                    <Divider />
                    <Box sx={{ overflowX: 'auto' }}>
                      <Box sx={{ minWidth: 1000, p: 2 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Código</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Tipo</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Equipo</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Descripción</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Técnico</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Inicio</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Fin</th>
                              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Duración</th>
                              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Completada</th>
                            </tr>
                          </thead>
                          <tbody>
                            {maintenance.orders.map((order: any) => (
                              <tr key={order.order_id} className="hover-row">
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.order_code}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.maintenance_type}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.equipment_name}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.description}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{order.technician_name || '-'}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{formatDate(order.start_time)}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{formatDate(order.end_time)}</td>
                                <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{formatTime(order.duration_ms)}</td>
                                <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
                                  {order.completed ? (
                                    <CheckCircleIcon color="success" style={{ fontSize: '1.2rem' }} />
                                  ) : (
                                    <WarningIcon color="warning" style={{ fontSize: '1.2rem' }} />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Box>
    );
  };
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard de Reportes
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refrescar datos">
              <IconButton onClick={fetchAllReports} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {error && (
          <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: '#FFF4F4' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ mb: 3 }} elevation={2}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab 
                  icon={<TrendingUpIcon />} 
                  label="General" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<ProductionIcon />} 
                  label="Producción" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<PauseIcon />} 
                  label="Pausas" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<CleaningIcon />} 
                  label="Limpieza y Mantenimiento" 
                  iconPosition="start"
                />
              </Tabs>
            </Paper>
            
            {activeTab === 0 && renderDashboardOverview()}
            {activeTab === 1 && renderProductionReport()}
            {activeTab === 2 && renderPausesReport()}
            {activeTab === 3 && renderMaintenanceCleaningReport()}
          </>
        )}
      </Box>
      
      {/* Estilos para las filas con efecto hover */}
      <style>
        {`
          .hover-row:hover {
            background-color: #f5f5f5;
          }
        `}
      </style>
    </Container>
  );
};

export default DashboardReports;