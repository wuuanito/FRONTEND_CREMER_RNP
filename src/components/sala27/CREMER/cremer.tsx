import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Stack,
  Divider
} from '@mui/material';
import { 
  FiberManualRecord as FiberManualRecordIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  CleaningServices as CleaningIcon,
  PauseCircle as PauseCircleIcon
} from '@mui/icons-material';
// Importamos estilos
import './styles/cremer.scss';

// URL base para la API
const API_BASE_URL = 'http://192.168.11.25:3000/api';

// Interfaces para las nuevas estructuras de datos
interface ManufacturingOrderSummary {
  id: number;
  order_id: number;
  order_code: string;
  status: string;
  article_code: string;
  description: string;
  quantity: number;
  produced: {
    good_units: number;
    defective_units: number;
    total: number;
    completion_percentage: number;
  };
  time: {
    start_time: string;
    end_time: string | null;
    created_at: string;
    updated_at: string;
  };
}

interface ManufacturingOrderList {
  total: number;
  limit: number;
  offset: number;
  orders: ManufacturingOrderSummary[];
}

// Interfaces para órdenes de limpieza
interface CleaningOrderSummary {
  id: number;
  order_id: number;
  order_code: string;
  status: string;
  cleaning_type: string;
  area_id: string;
  area_name: string;
  description: string;
  associated_manufacturing_order_id: number | null;
  operator_name: string | null;
  completed: boolean;
  estimated_duration_minutes: number;
  time: {
    start_time: string;
    end_time: string | null;
    created_at: string;
    updated_at: string;
    duration: number;
  };
}

interface CleaningOrderList {
  total: number;
  limit: number;
  offset: number;
  orders: CleaningOrderSummary[];
}

// Interfaz para el registro de producción
interface ProductionRecord {
  timestamp: number;
  total: number;
}

// Interfaz para detalles de pausa
interface PauseInfo {
  id: number;
  reason: string;
  start_time: string;
  end_time: string | null;
  duration_ms: number;
  duration_minutes: number;
  comments: string;
}

// Interfaz para la respuesta detallada de la orden
interface OrderDetailResponse {
  order: {
    id: number;
    order_code: string;
    type: string;
    status: string;
    start_time: string;
    end_time: string | null;
    created_at: string;
    updated_at: string;
    notes: string | null;
  };
  manufacturing_order: {
    id: number;
    article_code: string;
    description: string;
    quantity: number;
    target_production_rate: number;
    good_units: number;
    defective_units: number;
    total_produced: number;
    completion_percentage: number;
  };
  time_stats: {
    total_duration: number;
    total_pause_time: number;
    effective_production_time: number;
  };
  pauses: PauseInfo[];
  recent_production_entries: any[];
}

// Componente simplificado según diseño de referencia
const Cremer: React.FC = () => {
  // Estados básicos
  const [activeOrder, setActiveOrder] = useState<ManufacturingOrderSummary | null>(null);
  const [activeCleaningOrder, setActiveCleaningOrder] = useState<CleaningOrderSummary | null>(null);
  const [counters, setCounters] = useState({
    countGood: 0, 
    countBad: 0, 
    total: 0, 
    progress: 0
  });
  const [productionRate, setProductionRate] = useState<number>(0);
  const [estimatedEndTime, setEstimatedEndTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [wsStatus] = useState<boolean>(true); // Simplificado
  const [machineStatus, setMachineStatus] = useState({
    verde: false,
    amarillo: false,
    rojo: true // Por defecto, sin orden activa
  });
  const [qualityRate, setQualityRate] = useState<number>(0);
  
  // Estado para almacenar la razón de pausa
  const [pauseReason, setPauseReason] = useState<string>('');
  
  // Ref para almacenar el historial de producción del último minuto
  const productionHistoryRef = useRef<ProductionRecord[]>([]);
  // Ref para almacenar el id de la orden activa anterior
  const previousOrderIdRef = useRef<number | null>(null);
  
  // Cargar datos iniciales y configurar intervalos de actualización
  useEffect(() => {
    loadData();
    
    // Actualizar datos cada 5 segundos en lugar de 2
    const dataInterval = setInterval(() => {
      loadData();
    }, 5000);
    
    // Actualizar cálculos de rendimiento cada 10 segundos
    const rateUpdateInterval = setInterval(() => {
      if (activeOrder) {
        calculateRealTimeProductionRate();
        calculateOverallProductionRate();
        calculateQualityRate();
      }
    }, 10000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(rateUpdateInterval);
    };
  }, []);

  // Actualizar historial de producción cuando cambian los contadores o la orden
  useEffect(() => {
    if (activeOrder) {
      // Verificar si cambió el ID de la orden activa
      if (previousOrderIdRef.current !== activeOrder.id) {
        // Resetear el historial de producción si cambió la orden
        productionHistoryRef.current = [];
        previousOrderIdRef.current = activeOrder.id;
      }
      
      // Registrar el contador actual en el historial
      recordProduction(counters.total);
      
      // Calcular tasas inmediatamente cuando hay cambios
      calculateRealTimeProductionRate();
      calculateOverallProductionRate();
      calculateQualityRate();

      // Cargar la razón de pausa si la orden está pausada
      if (activeOrder.status === 'PAUSED') {
        loadPauseReason(activeOrder.order_id);
      } else {
        // Limpiar la razón de pausa si no está pausada
        setPauseReason('');
      }
    } else {
      // Resetear cuando no hay orden activa
      productionHistoryRef.current = [];
      previousOrderIdRef.current = null;
      setPauseReason('');
    }
  }, [counters, activeOrder]);

  // Registrar la producción actual en el historial
  const recordProduction = (total: number) => {
    const now = Date.now();
    
    // Añadir nuevo registro solo si el total ha cambiado
    const lastRecord = productionHistoryRef.current[productionHistoryRef.current.length - 1];
    if (!lastRecord || lastRecord.total !== total) {
      productionHistoryRef.current.push({
        timestamp: now,
        total: total
      });
      
      // Mantener solo los registros del último minuto
      const oneMinuteAgo = now - 60000;
      productionHistoryRef.current = productionHistoryRef.current.filter(
        record => record.timestamp >= oneMinuteAgo
      );
    }
  };

  // Cargar la razón de la última pausa
  const loadPauseReason = async (orderId: number) => {
    try {
      console.log(`Cargando detalles de la orden ${orderId} para obtener razón de pausa...`);
      
      const response = await fetch(`${API_BASE_URL}/manufacturing/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      
      const data: OrderDetailResponse = await response.json();
      console.log("Datos detallados recibidos:", data);
      
      // Verificar si hay pausas registradas
      if (data.pauses && data.pauses.length > 0) {
        // Ordenar las pausas por fecha de inicio (la más reciente primero)
        const sortedPauses = [...data.pauses].sort((a, b) => {
          const timeA = new Date(a.start_time).getTime();
          const timeB = new Date(b.start_time).getTime();
          return timeB - timeA;
        });
        
        // Obtener la razón de la pausa más reciente
        const latestPause = sortedPauses[0];
        console.log("Pausa más reciente:", latestPause);
        
        // Actualizar el estado con la razón de pausa
        setPauseReason(latestPause.reason);
      } else {
        console.log("No se encontraron pausas registradas");
        setPauseReason('Sin información de pausa');
      }
    } catch (error) {
      console.error('Error al cargar razón de pausa:', error);
      setPauseReason('Error al cargar información');
    }
  };

  // Calcular tasa de producción basada en el último minuto
  const calculateRealTimeProductionRate = () => {
    if (!activeOrder || !activeOrder.time.start_time) return;
  
    if (activeOrder.status === 'FINISHED' || activeOrder.status === 'CANCELLED') {
      setProductionRates(prev => ({ ...prev, realTime: 0 }));
      return;
    }

    if (activeOrder.status === 'PAUSED') {
      setProductionRates(prev => ({ ...prev, realTime: -1 }));
      return;
    }
  
    const history = productionHistoryRef.current;
    if (history.length < 2) return;
  
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Filtrar registros del último minuto
    const recentRecords = history.filter(record => record.timestamp >= oneMinuteAgo);
    
    if (recentRecords.length >= 2) {
      const oldestRecord = recentRecords[0];
      const latestRecord = recentRecords[recentRecords.length - 1];
      
      // Calcular botes en el último minuto
      const botesEnUltimoMinuto = latestRecord.total - oldestRecord.total;
      
      // La velocidad real es botes por minuto
      const velocidadReal = botesEnUltimoMinuto;
      
      if (!isNaN(velocidadReal) && isFinite(velocidadReal) && velocidadReal >= 0) {
        setProductionRates(prev => ({ 
          ...prev, 
          realTime: Math.round(velocidadReal)
        }));
        
        // Actualizar tiempo estimado
        if (velocidadReal > 0 && ['STARTED', 'IN_PROGRESS', 'RESUMED'].includes(activeOrder.status)) {
          const remainingItems = activeOrder.quantity - latestRecord.total;
          const minutesRemaining = remainingItems / velocidadReal;
          const estimatedEnd = new Date();
          estimatedEnd.setMinutes(estimatedEnd.getMinutes() + minutesRemaining);
          setEstimatedEndTime(estimatedEnd);
          setProductionRate(velocidadReal);
        }
      }
    }
  };

  // Calcular tasa de producción media desde el inicio
  const calculateOverallProductionRate = () => {
    if (!activeOrder || !activeOrder.time.start_time) return;
  
    if (activeOrder.status === 'FINISHED' || activeOrder.status === 'CANCELLED') {
      setProductionRates(prev => ({ ...prev, overall: { total: 0, good: 0 } }));
      return;
    }

    if (activeOrder.status === 'PAUSED') {
      setProductionRates(prev => ({ ...prev, overall: { total: -1, good: -1 } }));
      return;
    }
  
    const startTime = new Date(activeOrder.time.start_time).getTime();
    const now = Date.now();
    const timeDiffMinutes = (now - startTime) / 60000;
    
    if (timeDiffMinutes > 0) {
      // Velocidad media = total de botes / tiempo transcurrido en minutos
      const velocidadMediaTotal = counters.total / timeDiffMinutes;
      const velocidadMediaBuenos = counters.countGood / timeDiffMinutes;
      
      if (!isNaN(velocidadMediaTotal) && isFinite(velocidadMediaTotal) && velocidadMediaTotal >= 0) {
        setProductionRates(prev => ({ 
          ...prev, 
          overall: {
            total: Math.round(velocidadMediaTotal),
            good: Math.round(velocidadMediaBuenos)
          }
        }));
      }
    }
  };

  // Calcular tasa de calidad
  const calculateQualityRate = () => {
    if (activeOrder && activeOrder.produced.total > 0) {
      const goodUnits = activeOrder.produced.good_units;
      const total = activeOrder.produced.total;
      const rate = (goodUnits / total) * 100;
      setQualityRate(rate);
    } else {
      setQualityRate(0);
    }
  };

  // Cargar datos básicos
  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLatestActiveOrder(),
        loadLatestActiveCleaningOrder()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };


  const [productionRates, setProductionRates] = useState({
      realTime: 0,  // Tasa de producción en el último minuto
      overall: {
        total: 0,   // Total production rate
        good: 0     // Good production rate
      }
    });

  // Cargar la última orden iniciada no completada
  const loadLatestActiveOrder = async () => {
    try {
      console.log("Cargando órdenes de fabricación...");
      
      const response = await fetch(`${API_BASE_URL}/manufacturing`);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      
      const data: ManufacturingOrderList = await response.json();
      console.log("Datos recibidos:", data);
      
      // Filtrar para obtener solo órdenes no completadas
      const activeOrders = data.orders.filter(order => 
        order.status === 'STARTED' || 
        order.status === 'IN_PROGRESS' || 
        order.status === 'PAUSED' || 
        order.status === 'RESUMED'
      );
      
      console.log("Órdenes activas encontradas:", activeOrders.length);
      
      if (activeOrders.length > 0) {
        // Ordenar por start_time (la más reciente primero)
        activeOrders.sort((a, b) => {
          const timeA = new Date(a.time.start_time).getTime();
          const timeB = new Date(b.time.start_time).getTime();
          return timeB - timeA;
        });
        
        const latestOrder = activeOrders[0];
        console.log("Orden activa seleccionada:", latestOrder);
        
        setActiveOrder(latestOrder);
        
        const calculatedProgress = latestOrder.produced.total / latestOrder.quantity;
        
        setCounters({
          countGood: latestOrder.produced.good_units,
          countBad: latestOrder.produced.defective_units,
          total: latestOrder.produced.total,
          progress: calculatedProgress
        });
        
        // Actualizar estado de máquina solo basado en la orden de producción
        updateMachineStatus(latestOrder.status);
        
        // Si la orden está pausada, cargar la razón de pausa
        if (latestOrder.status === 'PAUSED') {
          loadPauseReason(latestOrder.order_id);
        } else {
          setPauseReason('');
        }
      } else {
        // No hay órdenes activas
        console.log("No se encontraron órdenes activas");
        
        setActiveOrder(null);
        setCounters({ countGood: 0, countBad: 0, total: 0, progress: 0 });
        setProductionRate(0);
        setEstimatedEndTime(null);
        setPauseReason('');
        
        // Siempre rojo cuando no hay orden de producción activa
        setMachineStatus({ verde: false, amarillo: false, rojo: true });
      }
    } catch (error) {
      console.error('Error al cargar orden activa:', error);
      setActiveOrder(null);
      setPauseReason('');
      // Error = semáforo en rojo
      setMachineStatus({ verde: false, amarillo: false, rojo: true });
    }
  };

  // Cargar la última orden de limpieza activa
  const loadLatestActiveCleaningOrder = async () => {
    try {
      console.log("Cargando órdenes de limpieza...");
      
      const response = await fetch(`${API_BASE_URL}/cleaning`);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      
      const data: CleaningOrderList = await response.json();
      console.log("Datos de limpieza recibidos:", data);
      
      const activeCleaningOrders = data.orders.filter(order => 
        order.status === 'STARTED' || 
        order.status === 'IN_PROGRESS' || 
        order.status === 'RESUMED'
      );
      
      console.log("Órdenes de limpieza activas encontradas:", activeCleaningOrders.length);
      
      if (activeCleaningOrders.length > 0) {
        activeCleaningOrders.sort((a, b) => {
          const timeA = new Date(a.time.start_time).getTime();
          const timeB = new Date(b.time.start_time).getTime();
          return timeB - timeA;
        });
        
        const latestCleaningOrder = activeCleaningOrders[0];
        console.log("Orden de limpieza activa seleccionada:", latestCleaningOrder);
        
        setActiveCleaningOrder(latestCleaningOrder);
        // Ya no actualizamos el estado de la máquina aquí
      } else {
        console.log("No se encontraron órdenes de limpieza activas");
        setActiveCleaningOrder(null);
      }
    } catch (error) {
      console.error('Error al cargar orden de limpieza activa:', error);
      setActiveCleaningOrder(null);
    }
  };

  // Actualizar estado de la máquina según el estado de la orden
  const updateMachineStatus = (status: string) => {
    // Solo consideramos estados de producción
    if (status === 'STARTED' || status === 'IN_PROGRESS' || status === 'RESUMED') {
      setMachineStatus({ verde: true, amarillo: false, rojo: false });
    } else if (status === 'PAUSED') {
      setMachineStatus({ verde: false, amarillo: true, rojo: false });
    } else {
      // Cualquier otro estado o sin orden activa
      setMachineStatus({ verde: false, amarillo: false, rojo: true });
    }
  };

  // Formatear hora
  const formatTime = (date: Date | null) => {
    if (!date) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Mapear el estado de la orden a un texto más amigable
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'STARTED':
      case 'IN_PROGRESS':
      case 'RESUMED':
        return 'Producción';
      case 'PAUSED':
        return 'Pausada';
      case 'FINISHED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'CLEANING':
        return 'Limpieza';
      default:
        return 'Detenida';
    }
  };
  
  // Calcular el tiempo restante para la orden de limpieza
  const getCleaningTimeRemaining = (): string => {
    if (!activeCleaningOrder) return '—';
    
    // Obtener el tiempo de inicio
    const startTime = new Date(activeCleaningOrder.time.start_time).getTime();
    const now = new Date().getTime();
    
    // Calcular duración estimada en milisegundos
    const estimatedDurationMs = activeCleaningOrder.estimated_duration_minutes * 60 * 1000;
    
    // Calcular tiempo transcurrido
    const elapsedTime = now - startTime;
    
    // Calcular tiempo restante
    const remainingTime = estimatedDurationMs - elapsedTime;
    
    if (remainingTime <= 0) {
      return 'Completando...';
    }
    
    // Convertir a minutos para mostrar
    const remainingMinutes = Math.round(remainingTime / 60000);
    return `${remainingMinutes} min`;
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
                label={getStatusText(activeOrder.status)}
                size="small"
                sx={{ 
                  borderRadius: '12px',
                  backgroundColor: activeOrder.status === 'PAUSED' ? '#ff9800' : 
                                  (activeOrder.status === 'STARTED' || activeOrder.status === 'IN_PROGRESS' || activeOrder.status === 'RESUMED') ? '#4caf50' : '#ef5350',
                  color: 'white',
                  height: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          )}
          
          {!activeOrder && activeCleaningOrder && (
            <Box flexGrow={1} display="flex" justifyContent="flex-end">
              <Chip 
                label="Limpieza"
                size="small"
                sx={{ 
                  borderRadius: '12px',
                  backgroundColor: '#ff9800',
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
        
        {/* Mostrar razón de pausa cuando la orden está pausada */}
        {activeOrder && activeOrder.status === 'PAUSED' && pauseReason && (
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 1.5,
              backgroundColor: '#fff8e1',
              p: 1,
              borderRadius: 1,
              border: '1px solid #ffe0b2'
            }}
          >
            <PauseCircleIcon sx={{ fontSize: 16, color: '#ff9800', mr: 0.5 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#e65100',
                fontSize: '0.75rem',
                fontWeight: 'medium'
              }}
            >
              Motivo de pausa: {pauseReason}
            </Typography>
          </Box>
        )}
        
        {activeOrder ? (
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
              title={activeOrder.description}
            >
              {activeOrder.article_code} - {activeOrder.description}
            </Typography>
            
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                {counters.total} / {activeOrder.quantity}
              </Typography>
              
              <Typography 
                variant="body2" 
                fontWeight="medium" 
                sx={{ 
                  color: '#4caf50',
                  fontSize: '0.8rem'
                }}
              >
                {/* Multiplicamos por 100 para mostrar correctamente el porcentaje */}
                {(counters.progress * 100).toFixed(1)}%
              </Typography>
            </Box>
            
            {/* Barra de progreso - Usamos el valor decimal correcto y lo multiplicamos por 100 para el componente */}
            <LinearProgress 
              variant="determinate" 
              value={Math.min(counters.progress * 100, 100)} 
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
           {/* Velocidad en tiempo real */}
           <Box display="flex" alignItems="center">
  <SpeedIcon sx={{ fontSize: 14, color: '#9e9e9e', mr: 0.5 }} />
  <Typography variant="caption" color="text.secondary">
    Vel. Actual
  </Typography>
  <Typography 
  variant="body2" 
  sx={{ 
    ml: 0.5, 
    color: '#212121',
    fontWeight: 'medium' 
  }}
>
  {activeOrder?.status === 'PAUSED' 
    ? 'Pausada' 
    : productionRates.realTime > 0 
      ? `${productionRates.realTime} bpm` 
      : '—'}
</Typography>
</Box>

{/* Velocidad media */}
<Box display="flex" alignItems="center">
<SpeedIcon sx={{ fontSize: 14, color: '#666666', mr: 0.5 }} />
<Typography variant="caption" color="text.secondary">
  Vel. Media
</Typography>
<Typography 
  variant="body2" 
  sx={{ 
    ml: 0.5, 
    color: '#212121',
    fontWeight: 'medium' 
  }}
>
  {activeOrder?.status === 'PAUSED' 
    ? 'Pausada' 
    : productionRates.overall && productionRates.overall.good > 0 
      ? `${productionRates.overall.good} bpm` 
      : '—'}
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
                {(activeOrder.status === 'STARTED' || activeOrder.status === 'IN_PROGRESS' || activeOrder.status === 'RESUMED') && productionRate > 0 ? formatTime(estimatedEndTime) : '—'}
              </Typography>
            </Box>
          </Box>
          
          {/* Mostrar orden de limpieza activa si existe */}
          {activeCleaningOrder && (
            <>
              <Divider sx={{ my: 1.5 }} />
              
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mb: 0.5,
                  backgroundColor: '#fff9c4',
                  p: 1,
                  borderRadius: 1,
                }}
              >
                <CleaningIcon sx={{ fontSize: 16, color: '#ff9800', mr: 1 }} />
                <Box flexGrow={1}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#424242',
                      fontSize: '0.75rem',
                      fontWeight: 'medium'
                    }}
                  >
                    Limpieza en curso: {activeCleaningOrder.cleaning_type}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#757575',
                      fontSize: '0.7rem',
                      display: 'block'
                    }}
                  >
                    {activeCleaningOrder.area_name} • Tiempo restante: {getCleaningTimeRemaining()}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </>
      ) : activeCleaningOrder ? (
        // Vista principal cuando solo hay orden de limpieza activa
        <Box>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              backgroundColor: '#fff9c4',
              p: 1,
              borderRadius: 1,
            }}
          >
            <CleaningIcon sx={{ fontSize: 20, color: '#ff9800', mr: 1 }} />
            <Box flexGrow={1}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#424242',
                  fontWeight: 'medium'
                }}
              >
                Limpieza en curso
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#424242',
                  fontSize: '0.875rem',
                  mt: 0.5
                }}
              >
                {activeCleaningOrder.cleaning_type} - {activeCleaningOrder.description}
              </Typography>
              
              <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {activeCleaningOrder.area_name}
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="medium" 
                  sx={{ color: '#ff9800' }}
                >
                  Tiempo restante: {getCleaningTimeRemaining()}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              px: 1
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Operador: {activeCleaningOrder.operator_name || 'No asignado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Duración estimada: {activeCleaningOrder.estimated_duration_minutes} min
            </Typography>
          </Box>
        </Box>
      ) : (
        // Mensaje cuando no hay orden activa
        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
          <Typography variant="body2" color="text.secondary">
            No hay órdenes activas
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);
};

export default Cremer;