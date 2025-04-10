import React, { useState, useEffect } from 'react';
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
  CleaningServices as CleaningIcon
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
  
  // Cargar datos iniciales y configurar intervalos de actualización
  useEffect(() => {
    loadData();
    
    // Intervalo para recargar datos generales cada 10 segundos
    const dataInterval = setInterval(() => {
      loadData();
    }, 10000);
    
    // Intervalo para actualizar el cálculo de rendimiento cada 60 segundos (1 minuto)
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
    if (activeOrder) {
      calculateRealTimeProductionRate();
      calculateQualityRate();
    }
  }, [counters, activeOrder]);

  // Calcular tasa de producción en tiempo real
  const calculateRealTimeProductionRate = () => {
    if (!activeOrder || !activeOrder.time.start_time) return;

    // Verificamos que la orden esté activa (no completada o cancelada)
    if (activeOrder.status === 'FINISHED' || activeOrder.status === 'CANCELLED') {
      setProductionRate(0);
      return;
    }

    // Obtener el tiempo de inicio de la orden
    let startTimeMs;
    
    try {
      // Usamos el tiempo de inicio de la orden
      startTimeMs = new Date(activeOrder.time.start_time).getTime();
    } catch (error) {
      console.error('Error al parsear fecha de inicio:', error);
      return;
    }

    // Obtener la hora actual para un cálculo preciso en tiempo real
    const now = new Date().getTime();
    
    // Calcular el tiempo transcurrido en minutos desde el inicio hasta ahora (o hasta el fin si ya terminó)
    const endTimeMs = activeOrder.time.end_time ? new Date(activeOrder.time.end_time).getTime() : now;
    const totalDurationMs = endTimeMs - startTimeMs;
    
    // Para órdenes en pausa, usar el tiempo actualizado
    let effectiveTimeMs = totalDurationMs;
    
    // Si hay información sobre pausas, se podría ajustar aquí
    // En este caso, asumimos que no tenemos pausas registradas en tiempo real
    
    // Convertir a minutos
    const elapsedMinutes = effectiveTimeMs / 60000;

    // Calcular la tasa solo si el tiempo transcurrido es válido
    if (elapsedMinutes > 0) {
      // La tasa es el total de unidades dividido por el tiempo transcurrido
      const total = activeOrder.produced.total;
      const rate = total / elapsedMinutes;
      
      // Actualizar el estado si es un número válido
      if (!isNaN(rate) && isFinite(rate) && rate >= 0) {
        setProductionRate(rate);
        
        // Actualizar tiempo estimado
        if (rate > 0 && (activeOrder.status === 'STARTED' || activeOrder.status === 'IN_PROGRESS' || activeOrder.status === 'RESUMED')) {
          const remainingItems = activeOrder.quantity - total;
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

  // Cargar la última orden iniciada no completada
  const loadLatestActiveOrder = async () => {
    try {
      console.log("Cargando órdenes de fabricación...");
      
      // Obtener todas las órdenes de fabricación
      const response = await fetch(`${API_BASE_URL}/manufacturing`);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      
      const data: ManufacturingOrderList = await response.json();
      console.log("Datos recibidos:", data);
      
      // Filtrar para obtener solo órdenes no completadas
      // Ahora incluimos STARTED, IN_PROGRESS y PAUSED
      const activeOrders = data.orders.filter(order => 
        order.status === 'STARTED' || 
        order.status === 'IN_PROGRESS' || 
        order.status === 'PAUSED' || 
        order.status === 'RESUMED' // Si se agrega un nuevo estado, incluirlo aquí
      );
      
      console.log("Órdenes activas encontradas:", activeOrders.length);
      
      if (activeOrders.length > 0) {
        // Ordenar por start_time (la más reciente primero)
        activeOrders.sort((a, b) => {
          const timeA = new Date(a.time.start_time).getTime();
          const timeB = new Date(b.time.start_time).getTime();
          return timeB - timeA; // Orden descendente
        });
        
        // Tomar la primera (más reciente)
        const latestOrder = activeOrders[0];
        console.log("Orden activa seleccionada:", latestOrder);
        
        setActiveOrder(latestOrder);
        
        // Actualizar contadores con los datos de la orden
        setCounters({
          countGood: latestOrder.produced.good_units,
          countBad: latestOrder.produced.defective_units,
          total: latestOrder.produced.total,
          progress: latestOrder.produced.completion_percentage * 100 // Convertir a porcentaje
        });
        
        // Actualizar el estado de la máquina según el estado de la orden
        updateMachineStatus(latestOrder.status);
      } else {
        // No hay órdenes activas
        console.log("No se encontraron órdenes activas");
        
        setActiveOrder(null);
        setCounters({ countGood: 0, countBad: 0, total: 0, progress: 0 });
        setProductionRate(0);
        setEstimatedEndTime(null);
        
        // Solo actualizamos el semáforo a rojo si tampoco hay órdenes de limpieza activas
        if (!activeCleaningOrder) {
          setMachineStatus({ verde: false, amarillo: false, rojo: true });
        }
      }
    } catch (error) {
      console.error('Error al cargar orden activa:', error);
      setActiveOrder(null);
      
      // Solo actualizamos el semáforo a rojo si tampoco hay órdenes de limpieza activas
      if (!activeCleaningOrder) {
        setMachineStatus({ verde: false, amarillo: false, rojo: true });
      }
    }
  };

  // Cargar la última orden de limpieza activa
  const loadLatestActiveCleaningOrder = async () => {
    try {
      console.log("Cargando órdenes de limpieza...");
      
      // Obtener todas las órdenes de limpieza
      const response = await fetch(`${API_BASE_URL}/cleaning`);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      
      const data: CleaningOrderList = await response.json();
      console.log("Datos de limpieza recibidos:", data);
      
      // Filtrar para obtener solo órdenes de limpieza activas
      const activeCleaningOrders = data.orders.filter(order => 
        order.status === 'STARTED' || 
        order.status === 'IN_PROGRESS' || 
        order.status === 'RESUMED'
      );
      
      console.log("Órdenes de limpieza activas encontradas:", activeCleaningOrders.length);
      
      if (activeCleaningOrders.length > 0) {
        // Ordenar por start_time (la más reciente primero)
        activeCleaningOrders.sort((a, b) => {
          const timeA = new Date(a.time.start_time).getTime();
          const timeB = new Date(b.time.start_time).getTime();
          return timeB - timeA; // Orden descendente
        });
        
        // Tomar la primera (más reciente)
        const latestCleaningOrder = activeCleaningOrders[0];
        console.log("Orden de limpieza activa seleccionada:", latestCleaningOrder);
        
        setActiveCleaningOrder(latestCleaningOrder);
        
        // Si no hay una orden de fabricación activa, la limpieza determina el estado del semáforo
        if (!activeOrder) {
          updateMachineStatus('CLEANING');
        }
      } else {
        // No hay órdenes de limpieza activas
        console.log("No se encontraron órdenes de limpieza activas");
        setActiveCleaningOrder(null);
        
        // Si no hay orden de producción activa, el semáforo debe estar en rojo
        if (!activeOrder) {
          setMachineStatus({ verde: false, amarillo: false, rojo: true });
        }
      }
    } catch (error) {
      console.error('Error al cargar orden de limpieza activa:', error);
      setActiveCleaningOrder(null);
      
      // Si no hay orden de producción activa, el semáforo debe estar en rojo
      if (!activeOrder) {
        setMachineStatus({ verde: false, amarillo: false, rojo: true });
      }
    }
  };

  // Actualizar estado de la máquina según el estado de la orden
  const updateMachineStatus = (status: string) => {
    if (status === 'STARTED' || status === 'IN_PROGRESS' || status === 'RESUMED') {
      setMachineStatus({ verde: true, amarillo: false, rojo: false });
    } else if (status === 'PAUSED') {
      setMachineStatus({ verde: false, amarillo: true, rojo: false });
    } else if (status === 'CLEANING') {
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
                  key={(activeOrder.status === 'STARTED' || activeOrder.status === 'IN_PROGRESS' || activeOrder.status === 'RESUMED') ? Date.now() : 'static-rate'}
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