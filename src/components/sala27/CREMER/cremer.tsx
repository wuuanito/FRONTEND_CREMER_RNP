import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import { 
  FiberManualRecord as FiberManualRecordIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
// Importamos estilos
import './styles/cremer.scss';

// URL base para la API
const API_BASE_URL = 'http://192.168.11.116:3000/api';

// Interfaces
interface Order {
  id: string;
  product: string;
  quantity: number;
  status: 'pending' | 'active' | 'paused' | 'completed';
  countGood: number;
  countBad: number;
  startTime?: string;
  lastStartOrResumeTime?: string;
  totalActiveTime: number;
}

// Componente simplificado según diseño de referencia
const Cremer: React.FC = () => {
  // Estados básicos
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [counters, setCounters] = useState({
    countGood: 0, 
    countBad: 0, 
    total: 0, 
    progress: 0
  });
  const [productionRate, setProductionRate] = useState<number>(0);
  const [estimatedEndTime, setEstimatedEndTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<boolean>(false);
  const [machineStatus, setMachineStatus] = useState({
    verde: false,
    amarillo: false,
    rojo: false
  });
  const [qualityRate, setQualityRate] = useState<number>(0);
  
  // Cargar datos iniciales y configurar intervalos de actualización
  useEffect(() => {
    loadData();
    
    // Intervalo para recargar datos generales cada 10 segundos
    const dataInterval = setInterval(() => {
      loadData();
    }, 10000);
    
    // Intervalo para actualizar el cálculo de rendimiento cada 60 segundos (1 minuto)
    // Esto actualiza el rendimiento incluso sin nueva información de la API
    const rateUpdateInterval = setInterval(() => {
      calculateRealTimeProductionRate();
    }, 60000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(rateUpdateInterval);
    };
  }, []);

  // Calcular tasa de producción en tiempo real cada vez que cambian los contadores o la orden
  useEffect(() => {
    calculateRealTimeProductionRate();
    calculateQualityRate();
  }, [counters, activeOrder]);

  // Calcular tasa de producción en tiempo real
  const calculateRealTimeProductionRate = () => {
    if (!activeOrder || !activeOrder.startTime) return;

    // Verificamos que la orden esté activa
    if (activeOrder.status !== 'active') {
      setProductionRate(0);
      return;
    }

    // Obtener el tiempo de inicio de la orden
    let startTimeMs;
    
    try {
      // Intentamos usar lastStartOrResumeTime si está disponible (más preciso para órdenes pausadas)
      if (activeOrder.lastStartOrResumeTime) {
        startTimeMs = new Date(activeOrder.lastStartOrResumeTime).getTime();
      } else {
        // Si no, usamos el tiempo de inicio original
        startTimeMs = new Date(activeOrder.startTime).getTime();
      }
    } catch (error) {
      console.error('Error al parsear fecha de inicio:', error);
      return;
    }

    // Obtener la hora actual para un cálculo preciso en tiempo real
    const now = new Date().getTime();
    
    // Calcular el tiempo transcurrido en minutos
    let elapsedMinutes;
    
    // Si hay tiempo activo total, usarlo directamente (considerando las pausas)
    if (activeOrder.totalActiveTime > 0) {
      // totalActiveTime normalmente viene en segundos, convertir a minutos
      const baseMinutes = activeOrder.totalActiveTime / 60;
      
      // Para órdenes activas, añadir el tiempo desde la última actualización
      if (activeOrder.status === 'active' && activeOrder.lastStartOrResumeTime) {
        const lastResumeTime = new Date(activeOrder.lastStartOrResumeTime).getTime();
        const additionalMinutes = (now - lastResumeTime) / 60000;
        elapsedMinutes = baseMinutes + additionalMinutes;
      } else {
        elapsedMinutes = baseMinutes;
      }
    } else {
      // Si no hay tiempo activo registrado, calcular desde el inicio
      elapsedMinutes = (now - startTimeMs) / 60000;
    }

    // Calcular la tasa solo si el tiempo transcurrido es válido
    if (elapsedMinutes > 0) {
      // La tasa es el total de unidades dividido por el tiempo transcurrido
      const rate = counters.total / elapsedMinutes;
      console.log(`Cálculo en tiempo real: ${counters.total} unidades en ${elapsedMinutes.toFixed(2)} minutos = ${rate.toFixed(2)} u/min (${new Date().toLocaleTimeString()})`);
      
      // Actualizar el estado si es un número válido
      if (!isNaN(rate) && isFinite(rate) && rate >= 0) {
        setProductionRate(rate);
        
        // Actualizar tiempo estimado
        if (rate > 0) {
          const remainingItems = activeOrder.quantity - counters.total;
          const minutesRemaining = remainingItems / rate;
          const estimatedEnd = new Date();
          estimatedEnd.setMinutes(estimatedEnd.getMinutes() + minutesRemaining);
          setEstimatedEndTime(estimatedEnd);
        }
      }
    }
  };

  // Calcular tasa de calidad
  const calculateQualityRate = () => {
    if (counters.total > 0) {
      const rate = (counters.countGood / counters.total) * 100;
      setQualityRate(rate);
    } else {
      setQualityRate(0);
    }
  };

  // Cargar datos básicos
  const loadData = async () => {
    try {
      setLoading(true);
      await loadActiveOrder();
      await checkWebSocketStatus();
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar orden activa
  const loadActiveOrder = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      if (response.data.success) {
        const allOrders = response.data.data;
        const active: Order | undefined = allOrders.find((o: Order) => o.status === 'active' || o.status === 'paused');
        
        if (active) {
          setActiveOrder(active);
          updateMachineStatus(active.status);
          await loadCounters(active.id);
        } else {
          setActiveOrder(null);
          setCounters({ countGood: 0, countBad: 0, total: 0, progress: 0 });
          setProductionRate(0);
          setEstimatedEndTime(null);
          setMachineStatus({ verde: false, amarillo: false, rojo: true });
        }
      }
    } catch (error) {
      console.error('Error al cargar orden activa:', error);
      setMachineStatus({ verde: false, amarillo: false, rojo: true });
    }
  };

  // Cargar contadores
  interface CountersResponse {
    success: boolean;
    data: {
      countGood: number;
      countBad: number;
      total: number;
      progress: number;
    };
  }

  const loadCounters = async (orderId: string): Promise<void> => {
    try {
      const response = await axios.get<CountersResponse>(`${API_BASE_URL}/counters/order/${orderId}/current`);
      if (response.data.success) {
        setCounters(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar contadores:', error);
    }
  };

  // Verificar estado de websocket
  const checkWebSocketStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ws/status`);
      if (response.data.success) {
        setWsStatus(response.data.connected);
      } else {
        setWsStatus(false);
      }
    } catch (error) {
      setWsStatus(false);
      console.error('Error al verificar estado WebSocket:', error);
    }
  };

  // Actualizar estado de la máquina
  const updateMachineStatus = (status: string) => {
    if (status === 'active') {
      setMachineStatus({ verde: true, amarillo: false, rojo: false });
    } else if (status === 'paused') {
      setMachineStatus({ verde: false, amarillo: true, rojo: false });
    } else {
      setMachineStatus({ verde: false, amarillo: false, rojo: true });
    }
  };

  // Formatear hora
  const formatTime = (date: Date | null) => {
    if (!date) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card 
      sx={{ 
        width: '100%', 
        height: 'auto',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        borderRadius: 1,
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.06)'
      }}
    >
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />}
      
      <CardContent sx={{ p: 2, pb: '16px !important' }}>
        {/* Header - Nombre y estado de conexión */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle1" fontWeight="500" sx={{ color: '#212121' }}>
              Cremer
            </Typography>
            <Tooltip title="Actualizar datos">
              <IconButton 
                size="small" 
                onClick={loadData} 
                sx={{ ml: 0.5, p: 0.25 }}
              >
                <RefreshIcon sx={{ fontSize: 16, color: '#757575' }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          {wsStatus && (
            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />
          )}
        </Box>
        
        {/* Semáforo */}
        <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
          <FiberManualRecordIcon 
            sx={{ 
              fontSize: 14, 
              color: machineStatus.rojo ? '#ef5350' : '#e0e0e0'
            }}
          />
          <FiberManualRecordIcon 
            sx={{ 
              fontSize: 14, 
              color: machineStatus.amarillo ? '#ff9800' : '#e0e0e0'
            }}
          />
          <FiberManualRecordIcon 
            sx={{ 
              fontSize: 14, 
              color: machineStatus.verde ? '#4caf50' : '#e0e0e0'
            }}
          />
          
          {activeOrder && (
            <Box flexGrow={1} display="flex" justifyContent="flex-end">
              <Chip 
                label={activeOrder.status === 'paused' ? "Pausada" : 
                      (activeOrder.status === 'active' ? "Producción" : "Detenida")} 
                size="small"
                sx={{ 
                  borderRadius: '12px',
                  backgroundColor: activeOrder.status === 'paused' ? '#ff9800' : 
                                  (activeOrder.status === 'active' ? '#4caf50' : '#ef5350'),
                  color: 'white',
                  height: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          )}
        </Stack>
        
        {activeOrder && (
          <>
            {/* Nombre del producto y progreso */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#424242',
                mb: 0.5,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={activeOrder.product}
            >
              {activeOrder.product}
            </Typography>
            
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                {counters.total} / {activeOrder.quantity}
              </Typography>
              
              <Typography 
                variant="body2" 
                fontWeight="medium" 
                sx={{ 
                  color: '#f44336',
                  fontSize: '0.8rem'
                }}
              >
                {typeof counters.progress === 'number' ? counters.progress.toFixed(1) : counters.progress}%
              </Typography>
            </Box>
            
            {/* Barra de progreso */}
            <LinearProgress 
              variant="determinate" 
              value={Math.min(counters.progress, 100)} 
              sx={{ 
                height: 5, 
                borderRadius: 2, 
                mb: 2,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4caf50'
                }
              }}
            />
            
            {/* Buenos y Malos */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                  Buenos
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="medium" 
                  sx={{ 
                    color: '#4caf50',
                    fontSize: '1.25rem'
                  }}
                >
                  {counters.countGood}
                </Typography>
              </Box>
              
              <Box textAlign="right">
                <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                  Malos
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="medium" 
                  sx={{ 
                    color: '#f44336',
                    fontSize: '1.25rem'
                  }}
                >
                  {counters.countBad}
                </Typography>
              </Box>
            </Box>
            
            {/* Métricas finales */}
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {/* Velocidad */}
<Box display="flex" alignItems="center">
  <SpeedIcon sx={{ fontSize: 14, color: '#9e9e9e', mr: 0.5 }} />
  <Typography variant="caption" color="text.secondary">
    Vel.
  </Typography>
  <Typography 
    variant="body2" 
    sx={{ 
      ml: 0.5, 
      color: '#212121',
      fontWeight: 'medium' 
    }}
    
    // Forzar actualización del componente cada segundo usando Date.now
    key={activeOrder.status === 'active' ? Date.now() : 'static-rate'}
  >
    {productionRate > 0 ? `${Math.round(productionRate)} bpm` : '—'}
  </Typography>
</Box>

{/* Calidad */}
<Box display="flex" alignItems="center">
  <BarChartIcon sx={{ fontSize: 14, color: '#4caf50', mr: 0.5 }} />
  <Typography variant="caption" color="text.secondary">
    Cal.
  </Typography>
  <Typography 
    variant="body2" 
    sx={{ ml: 0.5, color: '#4caf50', fontWeight: 'medium' }}
  >
    {qualityRate > 0 ? `${Math.round(qualityRate)}%` : '—'}
  </Typography>
</Box>
              
              {/* Fin estimado */}
              <Box display="flex" alignItems="center">
                <AccessTimeIcon sx={{ fontSize: 14, color: '#9e9e9e', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Fin
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ ml: 0.5, color: '#212121' }}
                >
                  {activeOrder.status === 'active' && productionRate > 0 ? formatTime(estimatedEndTime) : '—'}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Cremer;