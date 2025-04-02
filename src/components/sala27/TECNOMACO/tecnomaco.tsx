import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
  Badge
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 

  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  FiberManualRecord as FiberManualRecordIcon
} from '@mui/icons-material';

// URL base para la API
const API_BASE_URL = 'http://localhost:3000/api';

// Interfaces
interface Order {
  id: string;
  product: string;
  quantity: number;
  status: 'pending' | 'active' | 'paused' | 'completed';
  startTime?: string;
  totalActiveTime: number;
  totalPauseTime: number;
  countGood: number;
  countBad: number;
  createdAt: string;
  updatedAt: string;
}

interface Pause {
  id: string;
  orderId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  reason: string;
  isActive: boolean;
  formattedDuration?: string;
}

// Componente principal
const tecnomaco: React.FC = () => {
  // Estados para los datos
  const [, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [counters, setCounters] = useState<{ countGood: number, countBad: number, total: number, progress: number }>(
    { countGood: 0, countBad: 0, total: 0, progress: 0 }
  );
  const [recentPauses, setRecentPauses] = useState<Pause[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [productionStats, setProductionStats] = useState({
    totalProductionToday: 0,
    averageDefectRate: 0,
    averageProductionRate: 0
  });
  
  // Estados para las luces indicadoras
  const [machineStatus, setMachineStatus] = useState({
    verde: false,
    amarillo: false,
    rojo: false
  });
  
  // Estado para UI
  const [loading, setLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
    checkWebSocketStatus();
    simulateMachineStatus(); // Simulamos el estado de las luces inicialmente
    
    // Iniciar intervalo de actualización (cada 15 segundos)
    const interval = setInterval(() => {
      loadDashboardData();
      checkWebSocketStatus();
      simulateMachineStatus(); // Actualizamos el estado periódicamente
    }, 15000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Funciones para cargar datos
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadOrders(),
        loadProductionStats()
      ]);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      if (response.data.success) {
        const allOrders = response.data.data;
        setOrders(allOrders);
        
        // Filtrar órdenes por estado
        const pendingOrdersList = allOrders.filter((o: Order) => o.status === 'pending');
        const completedOrdersList = allOrders.filter((o: Order) => o.status === 'completed');
        
        // Establecer orden activa si hay alguna en producción
        const active = allOrders.find((o: Order) => o.status === 'active' || o.status === 'paused');
        
        setPendingOrders(pendingOrdersList);
        setCompletedOrders(completedOrdersList);
        
        if (active) {
          setActiveOrder(active);
          // Cargar contadores y pausas para la orden activa
          await loadActiveOrderData(active.id);
        } else {
          setActiveOrder(null);
          setCounters({ countGood: 0, countBad: 0, total: 0, progress: 0 });
          setRecentPauses([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    }
  };

  const loadActiveOrderData = async (orderId: string) => {
    try {
      // Obtener contadores actuales
      const countersResponse = await axios.get(`${API_BASE_URL}/counters/order/${orderId}/current`);
      if (countersResponse.data.success) {
        setCounters(countersResponse.data.data);
      }
      
      // Obtener pausas recientes (limitado a las últimas 3)
      const pausesResponse = await axios.get(`${API_BASE_URL}/pauses/order/${orderId}`);
      if (pausesResponse.data.success) {
        const allPauses = pausesResponse.data.data;
        // Ordenar pausas por fecha y limitar a las 3 más recientes
        const sortedPauses = allPauses.sort((a: Pause, b: Pause) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        ).slice(0, 3);
        
        setRecentPauses(sortedPauses);
      }
    } catch (error) {
      console.error('Error al actualizar datos de orden activa:', error);
    }
  };

  const loadProductionStats = async () => {
    try {
      // Simulando estadísticas de producción (en una implementación real, estos datos vendrían de la API)
      // Aquí deberías hacer una llamada a una API que devuelva estadísticas generales
      
      // Ejemplo de llamada a la API (comentado ya que asumimos que no existe este endpoint):
      // const response = await axios.get(`${API_BASE_URL}/stats/production/today`);
      // if (response.data.success) {
      //   setProductionStats(response.data.data);
      // }
      
      // Simulación de datos
      
      let totalGood = 0;
      let totalBad = 0;
      let totalProduction = 0;
      let totalTime = 0;
      
      completedOrders.forEach(order => {
        totalGood += order.countGood;
        totalBad += order.countBad;
        totalProduction += order.countGood + order.countBad;
        totalTime += order.totalActiveTime;
      });
      
      const avgDefectRate = totalProduction > 0 ? (totalBad / totalProduction) * 100 : 0;
      const avgProductionRate = totalTime > 0 ? (totalProduction / (totalTime / 60)) : 0; // unidades por minuto
      
      setProductionStats({
        totalProductionToday: totalProduction,
        averageDefectRate: avgDefectRate,
        averageProductionRate: avgProductionRate
      });
      
    } catch (error) {
      console.error('Error al cargar estadísticas de producción:', error);
    }
  };

  const checkWebSocketStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ws/status`);
      if (response.data.success) {
        setWsStatus(response.data.connected);
      }
    } catch (error) {
      setWsStatus(false);
      console.error('Error al verificar estado WebSocket:', error);
    }
  };

  const reconnectWebSocket = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/ws/reconnect`);
      if (response.data.success) {
        // Verificar estado después de un breve retraso
        setTimeout(checkWebSocketStatus, 2000);
      }
    } catch (error) {
      console.error('Error al reconectar WebSocket:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de formato
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    
    // Intenta parsear la fecha y verifica si es válida
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pendiente" color="default" size="small" />;
      case 'active':
        return <Chip label="En Producción" color="success" size="small" />;
      case 'paused':
        return <Chip label="Pausada" color="warning" size="small" />;
      case 'completed':
        return <Chip label="Completada" color="primary" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Navegación a detalles
  const navigateToDetails = () => {
    // En una implementación real, utilizaríamos React Router o similar
    console.log('Navegando a detalles completos');
    // Por ejemplo: history.push('/cremer/details');
    // O window.location.href = '/cremer/details';
  };

  // Simulación del estado de la máquina (en un caso real, esto vendría de la API o WebSocket)
  const simulateMachineStatus = () => {
    if (activeOrder) {
      if (activeOrder.status === 'active') {
        setMachineStatus({
          verde: true,
          amarillo: false,
          rojo: false
        });
      } else if (activeOrder.status === 'paused') {
        setMachineStatus({
          verde: false,
          amarillo: true,
          rojo: false
        });
      } else {
        setMachineStatus({
          verde: false,
          amarillo: false,
          rojo: false
        });
      }
    } else {
      // Estado default cuando no hay orden activa
      setMachineStatus({
        verde: false,
        amarillo: false,
        rojo: true
      });
    }
  };

  const refreshData = () => {
    loadDashboardData();
    simulateMachineStatus();
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Sistema de Monitorización de Fabricación
        </Typography>
        <Box>
          <IconButton color="primary" onClick={refreshData}>
            <RefreshIcon />
          </IconButton>
          <Button 
            variant="outlined" 
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={navigateToDetails}
            sx={{ ml: 1 }}
          >
            Ver Detalles Completos
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Estado de conexión y monitor de estado */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center">
              <Typography variant="body1" mr={2}>Estado de Conexión:</Typography>
              {wsStatus ? (
                <Chip 
                  label="Conectado" 
                  color="success" 
                  size="small" 
                  icon={<CheckCircleIcon />}
                />
              ) : (
                <Chip 
                  label="Desconectado" 
                  color="error" 
                  size="small" 
                  icon={<ErrorIcon />}
                  onClick={reconnectWebSocket}
                />
              )}
            </Box>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={reconnectWebSocket}
              disabled={wsStatus}
              size="small"
            >
              Reconectar
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Estado de la Máquina" 
              sx={{ 
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
              }}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 3 }}>
              <Box display="flex" justifyContent="center" mb={3} gap={3}>
                <Badge 
                  badgeContent=" " 
                  color="error" 
                  variant="dot" 
                  invisible={!machineStatus.rojo}
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%',
                      boxShadow: machineStatus.rojo ? '0 0 8px #f44336' : 'none'
                    } 
                  }}
                >
                  <FiberManualRecordIcon 
                    sx={{ 
                      fontSize: 32, 
                      color: machineStatus.rojo ? '#f44336' : '#e0e0e0',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Badge>
                
                <Badge 
                  badgeContent=" " 
                  color="warning" 
                  variant="dot" 
                  invisible={!machineStatus.amarillo}
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%',
                      boxShadow: machineStatus.amarillo ? '0 0 8px #ff9800' : 'none'
                    } 
                  }}
                >
                  <FiberManualRecordIcon 
                    sx={{ 
                      fontSize: 32, 
                      color: machineStatus.amarillo ? '#ff9800' : '#e0e0e0',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Badge>
                
                <Badge 
                  badgeContent=" " 
                  color="success" 
                  variant="dot" 
                  invisible={!machineStatus.verde}
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%',
                      boxShadow: machineStatus.verde ? '0 0 8px #4caf50' : 'none'
                    } 
                  }}
                >
                  <FiberManualRecordIcon 
                    sx={{ 
                      fontSize: 32, 
                      color: machineStatus.verde ? '#4caf50' : '#e0e0e0',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Badge>
              </Box>
              
              <Typography variant="h6" align="center">
                {machineStatus.verde 
                  ? 'En Producción' 
                  : machineStatus.amarillo 
                    ? 'Pausada' 
                    : machineStatus.rojo 
                      ? 'Detenida' 
                      : 'Sin estado'}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" align="center" mt={1}>
                {new Date().toLocaleTimeString()}
              </Typography>
              
              <Button 
                variant="outlined" 
                color="primary"
                size="small"
                onClick={navigateToDetails}
                sx={{ mt: 3 }}
              >
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Información de orden activa */}
        <Grid item xs={12} md={6} lg={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Orden Activa
            </Typography>
            
            {activeOrder ? (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">ID:</Typography>
                    <Typography variant="body1">{activeOrder.id.substring(0, 8)}...</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Producto:</Typography>
                    <Typography variant="body1">{activeOrder.product}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Cantidad:</Typography>
                    <Typography variant="body1">{activeOrder.quantity}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Estado:</Typography>
                    <Typography variant="body1">{getStatusChip(activeOrder.status)}</Typography>
                  </Grid>
                </Grid>
                
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Progreso: {counters.progress}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(counters.progress, 100)} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Total: {counters.total} / {activeOrder.quantity}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Botes Buenos</Typography>
                      <Typography variant="h5" color="success.main">{counters.countGood}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Botes Malos</Typography>
                      <Typography variant="h5" color="error.main">{counters.countBad}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Tiempo Activo</Typography>
                      <Typography variant="h6">{formatDuration(activeOrder.totalActiveTime)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Tiempo Pausado</Typography>
                      <Typography variant="h6">{formatDuration(activeOrder.totalPauseTime)}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="textSecondary">
                  No hay órdenes activas en este momento
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={navigateToDetails}
                  sx={{ mt: 2 }}
                >
                  Iniciar Producción
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Contadores de producción */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Estadísticas de Producción" 
              sx={{ backgroundColor: '#f5f5f5' }}
              action={
                <IconButton aria-label="estadísticas">
                  <AssessmentIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Producción Total Hoy:</Typography>
                  <Typography variant="h6">{productionStats.totalProductionToday} unidades</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Tasa de Defectos:</Typography>
                  <Typography variant="h6">{productionStats.averageDefectRate.toFixed(2)}%</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Tasa de Producción:</Typography>
                  <Typography variant="h6">{productionStats.averageProductionRate.toFixed(2)} u/min</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Órdenes Pendientes */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Órdenes Pendientes" 
              sx={{ backgroundColor: '#f5f5f5' }}
              action={
                <IconButton aria-label="órdenes pendientes">
                  <PlayIcon />
                </IconButton>
              }
            />
            <CardContent>
              {pendingOrders.length > 0 ? (
                pendingOrders.slice(0, 3).map((order) => (
                  <Box key={order.id} mb={2} p={1} sx={{ borderBottom: '1px solid #eee' }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight="bold">
                        {order.product}
                      </Typography>
                      {getStatusChip(order.status)}
                    </Box>
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="body2" color="textSecondary">
                        Cantidad: {order.quantity}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatTimestamp(order.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body1" textAlign="center" py={2} color="textSecondary">
                  No hay órdenes pendientes
                </Typography>
              )}
              
              {pendingOrders.length > 3 && (
                <Button 
                  variant="text" 
                  size="small" 
                  fullWidth 
                  onClick={navigateToDetails}
                  sx={{ mt: 1 }}
                >
                  Ver todas ({pendingOrders.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Últimas Pausas */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Últimas Pausas" 
              sx={{ backgroundColor: '#f5f5f5' }}
              action={
                <IconButton aria-label="historial">
                  <HistoryIcon />
                </IconButton>
              }
            />
            <CardContent>
              {activeOrder && recentPauses.length > 0 ? (
                recentPauses.map((pause) => (
                  <Box key={pause.id} mb={2} p={1} sx={{ borderBottom: '1px solid #eee' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {pause.reason}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="body2" color="textSecondary">
                        {formatTimestamp(pause.startTime)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {pause.formattedDuration || (pause.isActive ? 'Activa' : 'N/A')}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body1" textAlign="center" py={2} color="textSecondary">
                  {activeOrder ? 'No hay pausas registradas' : 'No hay orden activa'}
                </Typography>
              )}
              
              {activeOrder && recentPauses.length > 0 && (
                <Button 
                  variant="text" 
                  size="small" 
                  fullWidth 
                  onClick={navigateToDetails}
                  sx={{ mt: 1 }}
                >
                  Ver todas las pausas
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Órdenes completadas recientes */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Órdenes Completadas Recientes" 
              sx={{ backgroundColor: '#f5f5f5' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                {completedOrders.length > 0 ? (
                  completedOrders.slice(0, 3).map((order) => (
                    <Grid item xs={12} md={4} key={order.id}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {order.product}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Cantidad:</Typography>
                            <Typography variant="body2">{order.quantity}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Producidos:</Typography>
                            <Typography variant="body2">{order.countGood + order.countBad}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Buenos:</Typography>
                            <Typography variant="body2" color="success.main">{order.countGood}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Malos:</Typography>
                            <Typography variant="body2" color="error.main">{order.countBad}</Typography>
                          </Grid>
                        </Grid>
                        <Box textAlign="right" mt={1}>
                          <Button 
                            size="small" 
                            onClick={() => console.log(`Ver detalles de orden ${order.id}`)}
                          >
                            Ver Detalles
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body1" textAlign="center" py={2} color="textSecondary">
                      No hay órdenes completadas
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              {completedOrders.length > 3 && (
                <Box textAlign="center" mt={2}>
                  <Button 
                    variant="outlined" 
                    onClick={navigateToDetails}
                  >
                    Ver todas las órdenes completadas
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default tecnomaco;