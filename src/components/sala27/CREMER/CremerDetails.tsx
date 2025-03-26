import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Pause as PauseIcon, 
  Stop as StopIcon, 
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,

  Error as ErrorIcon
} from '@mui/icons-material';

// URL base para la API
const API_BASE_URL = 'http://192.168.11.116:3000/api';

// Interfaces para los tipos de datos
interface Order {
  id: string;
  product: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'active' | 'paused' | 'completed';
  startTime?: string;
  endTime?: string;
  totalActiveTime: number;
  totalPauseTime: number;
  totalTime: number;
  countGood: number;
  countBad: number;
  finishNotes?: string;
  averageProductionRate?: number;
  defectRate?: number;
  lastStartOrResumeTime?: string;
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



interface OrderSummary {
  id: string;
  product: string;
  quantity: number;
  status: string;
  times: {
    start?: string;
    end?: string;
    totalActive: number;
    totalPause: number;
    total: number;
    formattedTotalActive: string;
    formattedTotalPause: string;
    formattedTotal: string;
  };
  production: {
    countGood: number;
    countBad: number;
    total: number;
    defectRate?: number;
    productionRate?: number;
    formattedProductionRate?: string;
  };
  notes: {
    initial?: string;
    final?: string;
  };
  pauses: Array<Pause>;
}

interface ProductionAnalysis {
  timeIntervals: Array<{
    hour: string;
    good: number;
    bad: number;
    total: number;
  }>;
  productionRate: number;
  averageRate: {
    good: number;
    bad: number;
    total: number;
  };
}

interface Alert {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  open: boolean;
}

// Componente principal
const CremerDetails: React.FC = () => {
  // Estados para los datos
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [pauses, setPauses] = useState<Pause[]>([]);
  const [counters, setCounters] = useState<{ countGood: number, countBad: number, total: number, progress: number }>(
    { countGood: 0, countBad: 0, total: 0, progress: 0 }
  );
  const [analysis, setAnalysis] = useState<ProductionAnalysis | null>(null);
  const [wsStatus, setWsStatus] = useState<boolean>(false);

  // Estados para la UI
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<Alert>({ type: 'info', message: '', open: false });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Estados para diálogos
  const [createOrderDialog, setCreateOrderDialog] = useState(false);
  const [pauseDialog, setPauseDialog] = useState(false);
  const [finishDialog, setFinishDialog] = useState(false);
  const [newOrderData, setNewOrderData] = useState({ product: '', quantity: 0, notes: '' });
  const [pauseReason, setPauseReason] = useState('');
  const [finishNotes, setFinishNotes] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadOrders();
    checkWebSocketStatus();
    
    // Iniciar intervalo de actualización (cada 10 segundos)
    const interval = setInterval(() => {
      if (activeOrder) {
        refreshActiveOrderData(activeOrder.id);
      }
      checkWebSocketStatus();
    }, 10000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Efecto para actualizar datos cuando cambia la orden activa
  useEffect(() => {
    if (activeOrder) {
      refreshActiveOrderData(activeOrder.id);
    }
  }, [activeOrder]);

  // Funciones para cargar datos
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/orders`);
      if (response.data.success) {
        setOrders(response.data.data);
        
        // Establecer orden activa si hay alguna en producción
        const active = response.data.data.find((o: Order) => o.status === 'active' || o.status === 'paused');
        if (active) {
          setActiveOrder(active);
        }
      }
    } catch (error) {
      showAlert('error', 'Error al cargar órdenes');
      console.error('Error al cargar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveOrderData = async (orderId: string) => {
    try {
      // Obtener datos actualizados de la orden
      const orderResponse = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
      if (orderResponse.data.success) {
        setActiveOrder(orderResponse.data.data);
      }
      
      // Obtener contadores actuales
      const countersResponse = await axios.get(`${API_BASE_URL}/counters/order/${orderId}/current`);
      if (countersResponse.data.success) {
        setCounters(countersResponse.data.data);
      }
      
      // Obtener pausas
      const pausesResponse = await axios.get(`${API_BASE_URL}/pauses/order/${orderId}`);
      if (pausesResponse.data.success) {
        setPauses(pausesResponse.data.data);
      }
    } catch (error) {
      console.error('Error al actualizar datos:', error);
    }
  };

  const loadOrderSummary = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}/summary`);
      if (response.data.success) {
        setOrderSummary(response.data.data);
        setTabValue(3); // Cambiar a la pestaña de resumen
      }
    } catch (error) {
      showAlert('error', 'Error al cargar resumen de la orden');
      console.error('Error al cargar resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductionAnalysis = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/counters/order/${orderId}/analysis`);
      if (response.data.success) {
        setAnalysis(response.data.data);
        setTabValue(4); // Cambiar a la pestaña de análisis
      }
    } catch (error) {
      showAlert('error', 'Error al cargar análisis de producción');
      console.error('Error al cargar análisis:', error);
    } finally {
      setLoading(false);
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

  // Funciones de acción para órdenes
  const createOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/orders`, newOrderData);
      if (response.data.success) {
        showAlert('success', 'Orden creada correctamente');
        setCreateOrderDialog(false);
        setNewOrderData({ product: '', quantity: 0, notes: '' });
        await loadOrders();
      }
    } catch (error) {
      showAlert('error', 'Error al crear la orden');
      console.error('Error al crear orden:', error);
    } finally {
      setLoading(false);
    }
  };

  const startProduction = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/start`);
      if (response.data.success) {
        showAlert('success', 'Producción iniciada correctamente');
        setActiveOrder(response.data.data);
        await loadOrders();
        setTabValue(1); // Cambiar a la pestaña de producción
      }
    } catch (error) {
      showAlert('error', 'Error al iniciar producción');
      console.error('Error al iniciar producción:', error);
    } finally {
      setLoading(false);
    }
  };

  const pauseProduction = async () => {
    if (!activeOrder) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/orders/${activeOrder.id}/pause`, {
        reason: pauseReason
      });
      
      if (response.data.success) {
        showAlert('success', 'Producción pausada');
        setPauseDialog(false);
        setPauseReason('');
        setActiveOrder(response.data.data.order);
        await loadOrders();
      }
    } catch (error) {
      showAlert('error', 'Error al pausar producción');
      console.error('Error al pausar producción:', error);
    } finally {
      setLoading(false);
    }
  };

  const resumeProduction = async () => {
    if (!activeOrder) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/orders/${activeOrder.id}/resume`);
      
      if (response.data.success) {
        showAlert('success', 'Producción reanudada');
        setActiveOrder(response.data.data);
        await loadOrders();
      }
    } catch (error) {
      showAlert('error', 'Error al reanudar producción');
      console.error('Error al reanudar producción:', error);
    } finally {
      setLoading(false);
    }
  };

  const finishProduction = async () => {
    if (!activeOrder) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/orders/${activeOrder.id}/finish`, {
        finishNotes: finishNotes
      });
      
      if (response.data.success) {
        showAlert('success', 'Producción finalizada');
        setFinishDialog(false);
        setFinishNotes('');
        setActiveOrder(null);
        await loadOrders();
        await loadOrderSummary(response.data.data.id);
      }
    } catch (error) {
      showAlert('error', 'Error al finalizar producción');
      console.error('Error al finalizar producción:', error);
    } finally {
      setLoading(false);
    }
  };

  const reconnectWebSocket = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/ws/reconnect`);
      if (response.data.success) {
        showAlert('info', 'Reconexión iniciada');
        // Verificar estado después de un breve retraso
        setTimeout(checkWebSocketStatus, 2000);
      }
    } catch (error) {
      showAlert('error', 'Error al reconectar WebSocket');
      console.error('Error al reconectar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares para la UI
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showAlert = (type: 'success' | 'info' | 'warning' | 'error', message: string) => {
    setAlert({ type, message, open: true });
  };

  const closeAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    
    // Intenta parsear la fecha y verifica si es válida
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleString();
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

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Renderizado de componentes para cada pestaña
  const renderOrdersTab = () => (
    <Box mt={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Lista de Órdenes</Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => setCreateOrderDialog(true)}
            sx={{ mr: 1 }}
          >
            Nueva Orden
          </Button>
          <IconButton color="primary" onClick={loadOrders}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay órdenes registradas</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} sx={{ 
                  backgroundColor: activeOrder?.id === order.id ? 'rgba(144, 202, 249, 0.1)' : 'inherit' 
                }}>
                  <TableCell>{order.id.substring(0, 8)}...</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{formatTimestamp(order.createdAt)}</TableCell>
                  <TableCell>{getStatusChip(order.status)}</TableCell>
                  <TableCell>
                    {order.status === 'pending' && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="success"
                        startIcon={<PlayIcon />}
                        onClick={() => startProduction(order.id)}
                      >
                        Iniciar
                      </Button>
                    )}
                    {(order.status === 'active' || order.status === 'paused') && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => {
                          setActiveOrder(order);
                          setTabValue(1);
                        }}
                      >
                        Ver Producción
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="info"
                        onClick={() => loadOrderSummary(order.id)}
                      >
                        Ver Resumen
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderProductionTab = () => (
    <Box mt={3}>
      {!activeOrder ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No hay una orden en producción
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => setTabValue(0)}
          >
            Ir a Órdenes
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Detalles de la Orden
                </Typography>
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
                    <Typography variant="body2" color="textSecondary">Cantidad Objetivo:</Typography>
                    <Typography variant="body1">{activeOrder.quantity}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Estado:</Typography>
                    <Typography variant="body1">{getStatusChip(activeOrder.status)}</Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Tiempos
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="body2" color="textSecondary">Inicio:</Typography>
                    <Typography variant="body1">{formatTimestamp(activeOrder.startTime)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="body2" color="textSecondary">Tiempo Activo:</Typography>
                    <Typography variant="body1">{formatDuration(activeOrder.totalActiveTime)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="body2" color="textSecondary">Tiempo de Pausas:</Typography>
                    <Typography variant="body1">{formatDuration(activeOrder.totalPauseTime)}</Typography>
                  </Grid>
                </Grid>
                
                <Box mt={2} display="flex" justifyContent="center">
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<PlayIcon />}
                    disabled={activeOrder.status !== 'paused' || !wsStatus}
                    onClick={resumeProduction}
                    sx={{ mx: 1 }}
                  >
                    Reanudar
                  </Button>
                  <Button 
                    variant="contained" 
                    color="warning" 
                    startIcon={<PauseIcon />}
                    disabled={activeOrder.status !== 'active' || !wsStatus}
                    onClick={() => setPauseDialog(true)}
                    sx={{ mx: 1 }}
                  >
                    Pausar
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={<StopIcon />}
                    disabled={!['active', 'paused'].includes(activeOrder.status) || !wsStatus}
                    onClick={() => setFinishDialog(true)}
                    sx={{ mx: 1 }}
                  >
                    Finalizar
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Botes Buenos" 
                  sx={{ 
                    backgroundColor: 'success.light', 
                    color: 'success.contrastText'
                  }} 
                />
                <CardContent>
                  <Typography variant="h3" align="center">
                    {counters.countGood}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Botes Malos" 
                  sx={{ 
                    backgroundColor: 'error.light', 
                    color: 'error.contrastText'
                  }} 
                />
                <CardContent>
                  <Typography variant="h3" align="center">
                    {counters.countBad}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Progreso: {counters.progress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(counters.progress, 100)} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2" color="textSecondary">
                    Total: {counters.total} / {activeOrder.quantity}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
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
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Historial de Pausas
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Inicio</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell>Duración</TableCell>
                    <TableCell>Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pauses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No hay pausas registradas</TableCell>
                    </TableRow>
                  ) : (
                    pauses.map((pause) => (
                      <TableRow key={pause.id}>
                        <TableCell>{formatTimestamp(pause.startTime)}</TableCell>
                        <TableCell>{pause.endTime ? formatTimestamp(pause.endTime) : '-'}</TableCell>
                        <TableCell>{pause.formattedDuration || '-'}</TableCell>
                        <TableCell>{pause.reason}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );

  const renderSummaryTab = () => (
    <Box mt={3}>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="order-select-label">Seleccionar Orden</InputLabel>
        <Select
          labelId="order-select-label"
          value={selectedOrderId}
          label="Seleccionar Orden"
          onChange={(e) => {
            const orderId = e.target.value as string;
            setSelectedOrderId(orderId);
            if (orderId) {
              loadOrderSummary(orderId);
            } else {
              setOrderSummary(null);
            }
          }}
        >
          <MenuItem value="">
            <em>Seleccionar una orden</em>
          </MenuItem>
          {orders
            .filter(order => order.status === 'completed')
            .map(order => (
              <MenuItem key={order.id} value={order.id}>
                {order.product} - {formatTimestamp(order.createdAt)}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      
      {orderSummary ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Información General</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Producto:</Typography>
                  <Typography variant="body1">{orderSummary.product}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Cantidad Objetivo:</Typography>
                  <Typography variant="body1">{orderSummary.quantity}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Inicio:</Typography>
                  <Typography variant="body1">{formatTimestamp(orderSummary.times.start)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Fin:</Typography>
                  <Typography variant="body1">{formatTimestamp(orderSummary.times.end)}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Producción</Typography>
              <Typography variant="body2" color="textSecondary">Botes Buenos:</Typography>
              <Typography variant="body1">{orderSummary.production.countGood}</Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>Botes Malos:</Typography>
              <Typography variant="body1">{orderSummary.production.countBad}</Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>Total Producido:</Typography>
              <Typography variant="body1">{orderSummary.production.total}</Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>Tasa de Defectos:</Typography>
              <Typography variant="body1">
                {orderSummary.production.defectRate ? `${orderSummary.production.defectRate.toFixed(2)}%` : 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>Producción por Unidad:</Typography>
              <Typography variant="body1">
                {orderSummary.production.formattedProductionRate || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Tiempos</Typography>
              <Typography variant="body2" color="textSecondary">Tiempo Total:</Typography>
              <Typography variant="body1">{orderSummary.times.formattedTotal}</Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>Tiempo Activo:</Typography>
              <Typography variant="body1">{orderSummary.times.formattedTotalActive}</Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>Tiempo de Pausas:</Typography>
              <Typography variant="body1">{orderSummary.times.formattedTotalPause}</Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>Porcentaje Efectivo:</Typography>
              <Typography variant="body1">
                {orderSummary.times.total ? 
                  `${((orderSummary.times.totalActive / orderSummary.times.total) * 100).toFixed(2)}%` : 
                  'N/A'}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>Historial de Pausas</Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Inicio</TableCell>
            <TableCell>Fin</TableCell>
            <TableCell>Duración</TableCell>
            <TableCell>Motivo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orderSummary.pauses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">No hay pausas registradas</TableCell>
            </TableRow>
          ) : (
            orderSummary.pauses.map((pause) => (
              <TableRow key={pause.id}>
                <TableCell>{pause.startTime ? formatTimestamp(pause.startTime) : 'N/A'}</TableCell>
                <TableCell>{pause.endTime ? formatTimestamp(pause.endTime) : '-'}</TableCell>
                <TableCell>{pause.formattedDuration || '-'}</TableCell>
                <TableCell>{pause.reason}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
</Grid>
          
          {(orderSummary.notes.initial || orderSummary.notes.final) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Notas</Typography>
                {orderSummary.notes.initial && (
                  <>
                    <Typography variant="body2" color="textSecondary">Notas Iniciales:</Typography>
                    <Typography variant="body1" paragraph>{orderSummary.notes.initial}</Typography>
                  </>
                )}
                {orderSummary.notes.final && (
                  <>
                    <Typography variant="body2" color="textSecondary">Notas Finales:</Typography>
                    <Typography variant="body1">{orderSummary.notes.final}</Typography>
                  </>
                )}
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center">
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => loadProductionAnalysis(orderSummary.id)}
              >
                Ver Análisis de Producción
              </Button>
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Seleccione una orden completada para ver su resumen
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderAnalysisTab = () => (
    <Box mt={3}>
      {analysis ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Análisis de Producción</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Tasa de Producción (unidades/minuto):</Typography>
                  <Typography variant="body1">{analysis.productionRate.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Producción Media por Hora:</Typography>
                  <Typography variant="body1">{analysis.averageRate.total.toFixed(2)} unidades</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Buenas / Malas por Hora:</Typography>
                  <Typography variant="body1">
                    {analysis.averageRate.good.toFixed(2)} / {analysis.averageRate.bad.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Producción por Hora</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Hora</TableCell>
                      <TableCell>Buenos</TableCell>
                      <TableCell>Malos</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.timeIntervals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No hay datos de producción por intervalos</TableCell>
                      </TableRow>
                    ) : (
                      analysis.timeIntervals.map((interval, index) => (
                        <TableRow key={index}>
                          <TableCell>{interval.hour}</TableCell>
                          <TableCell>{interval.good}</TableCell>
                          <TableCell>{interval.bad}</TableCell>
                          <TableCell>{interval.total}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Seleccione una orden y utilice "Ver Análisis de Producción" para visualizar estadísticas
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderConfigTab = () => (
    <Box mt={3}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Estado de Conexión</Typography>
            <Box display="flex" alignItems="center" my={2}>
              <Typography variant="body1" mr={2}>WebSocket:</Typography>
              {wsStatus ? (
                <Chip 
                  label="Conectado" 
                  color="success" 
                  icon={<CheckCircleIcon />}
                />
              ) : (
                <Chip 
                  label="Desconectado" 
                  color="error" 
                  icon={<ErrorIcon />}
                />
              )}
            </Box>
            <Button 
              variant="contained" 
              color="primary"
              onClick={reconnectWebSocket}
              disabled={wsStatus}
            >
              Reconectar
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Configuración de Actualización</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="refresh-interval-label">Intervalo de Actualización</InputLabel>
              <Select
                labelId="refresh-interval-label"
                value="10000"
                label="Intervalo de Actualización"
                onChange={(e) => {
                  const value = parseInt(e.target.value as string);
                  if (refreshInterval) {
                    clearInterval(refreshInterval);
                  }
                  
                  if (value > 0) {
                    const interval = setInterval(() => {
                      if (activeOrder) {
                        refreshActiveOrderData(activeOrder.id);
                      }
                      checkWebSocketStatus();
                    }, value);
                    
                    setRefreshInterval(interval);
                    showAlert('success', `Intervalo actualizado a ${value/1000} segundos`);
                  }
                }}
              >
                <MenuItem value="5000">5 segundos</MenuItem>
                <MenuItem value="10000">10 segundos</MenuItem>
                <MenuItem value="30000">30 segundos</MenuItem>
                <MenuItem value="60000">1 minuto</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sistema de Monitorización de Fabricación
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Órdenes" />
          <Tab label="Producción" />
          <Tab label="Históricos" disabled />
          <Tab label="Resumen" />
          <Tab label="Análisis" />
          <Tab label="Configuración" />
        </Tabs>
      </Box>
      
      {loading && <LinearProgress sx={{ mt: 1 }} />}
      
      <Box role="tabpanel" hidden={tabValue !== 0}>
        {tabValue === 0 && renderOrdersTab()}
      </Box>
      <Box role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && renderProductionTab()}
      </Box>
      <Box role="tabpanel" hidden={tabValue !== 3}>
        {tabValue === 3 && renderSummaryTab()}
      </Box>
      <Box role="tabpanel" hidden={tabValue !== 4}>
        {tabValue === 4 && renderAnalysisTab()}
      </Box>
      <Box role="tabpanel" hidden={tabValue !== 5}>
        {tabValue === 5 && renderConfigTab()}
      </Box>
      
      {/* Diálogo para crear orden */}
      <Dialog 
        open={createOrderDialog} 
        onClose={() => setCreateOrderDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Crear Nueva Orden</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Complete la información para crear una nueva orden de fabricación.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Producto"
            fullWidth
            variant="outlined"
            value={newOrderData.product}
            onChange={(e) => setNewOrderData({ ...newOrderData, product: e.target.value })}
            required
          />
          <TextField
            margin="dense"
            label="Cantidad Objetivo"
            type="number"
            fullWidth
            variant="outlined"
            value={newOrderData.quantity || ''}
            onChange={(e) => setNewOrderData({ ...newOrderData, quantity: parseInt(e.target.value) })}
            required
          />
          <TextField
            margin="dense"
            label="Notas"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newOrderData.notes}
            onChange={(e) => setNewOrderData({ ...newOrderData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOrderDialog(false)}>Cancelar</Button>
          <Button 
            onClick={createOrder} 
            variant="contained" 
            color="primary"
            disabled={!newOrderData.product || !newOrderData.quantity}
          >
            Crear Orden
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para pausar */}
      <Dialog 
        open={pauseDialog} 
        onClose={() => setPauseDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Pausar Producción</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingrese el motivo de la pausa.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Motivo de la Pausa"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPauseDialog(false)}>Cancelar</Button>
          <Button 
            onClick={pauseProduction} 
            variant="contained" 
            color="warning"
            disabled={!pauseReason}
          >
            Confirmar Pausa
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para finalizar */}
      <Dialog 
        open={finishDialog} 
        onClose={() => setFinishDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Finalizar Producción</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            ¿Está seguro de que desea finalizar la producción de esta orden?
          </DialogContentText>
          <TextField
            margin="dense"
            label="Notas de Finalización"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={finishNotes}
            onChange={(e) => setFinishNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinishDialog(false)}>Cancelar</Button>
          <Button 
            onClick={finishProduction} 
            variant="contained" 
            color="error"
          >
            Finalizar Producción
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para alertas */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={closeAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeAlert} 
          severity={alert.type} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CremerDetails;