import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  LinearProgress
} from '@mui/material';
import axios from 'axios';
import { 
  PlayArrow as PlayIcon, 
  Refresh as RefreshIcon
} from '@mui/icons-material';

// URL base para la API
const API_BASE_URL = 'http://localhost:3000/api';

// Interfaces para los tipos de datos
interface TimelineEvent {
  id: string;
  type: 'active' | 'paused' | 'idle';
  orderId?: string;
  product?: string;
  startTime: string;
  endTime: string;
  duration: number;
  pauseReason?: string;
}

interface TimelineDay {
  date: string;
  events: TimelineEvent[];
  stats: {
    totalActiveTime: number;
    totalPauseTime: number;
    totalIdleTime: number;
    utilizationRate: number;
  };
}

const MachineTimeline: React.FC = () => {
  // Estados
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDay | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener fechas disponibles al cargar el componente
  useEffect(() => {
    fetchAvailableDates();
  }, []);

  // Obtener datos de timeline cuando cambia la fecha seleccionada
  useEffect(() => {
    if (selectedDate) {
      fetchTimelineData(selectedDate);
    }
  }, [selectedDate]);

  // Función para obtener las fechas disponibles
  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/orders/timeline/available-dates`);
      
      if (response.data.success) {
        setAvailableDates(response.data.dates);
        
        // Si hay fechas disponibles, seleccionar la más reciente por defecto
        if (response.data.dates.length > 0) {
          setSelectedDate(response.data.dates[0]);
        }
      } else {
        setError('No se pudieron cargar las fechas disponibles');
      }
    } catch (err) {
      setError('Error al cargar fechas disponibles');
      console.error('Error al cargar fechas:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para obtener datos de timeline para una fecha específica
  const fetchTimelineData = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/orders/timeline?date=${date}`);
      
      if (response.data.success) {
        // Asegurarse de que los datos tienen el formato correcto para el frontend
        const normalizedData = normalizeTimelineData(response.data.data);
        setTimelineData(normalizedData);
      } else {
        setError('No se pudieron cargar los datos del timeline');
      }
    } catch (err) {
      setError('Error al cargar datos del timeline');
      console.error('Error al cargar timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para normalizar los datos que vienen del backend
  const normalizeTimelineData = (data: any): TimelineDay => {
    // Asegurarse de que los eventos tengan el formato correcto
    const normalizedEvents = data.events.map((event: any) => {
      return {
        id: event.id,
        type: event.type,
        orderId: event.orderId,
        product: event.product,
        // Asegurar que startTime y endTime están en el formato correcto
        startTime: event.startTime || event.start_time,
        endTime: event.endTime || event.end_time,
        duration: event.duration,
        pauseReason: event.pauseReason
      };
    });

    return {
      date: data.date,
      events: normalizedEvents,
      stats: {
        totalActiveTime: data.stats.totalActiveTime,
        totalPauseTime: data.stats.totalPauseTime,
        totalIdleTime: data.stats.totalIdleTime,
        utilizationRate: data.stats.utilizationRate
      }
    };
  };

  // Formatear hora del día (HH:MM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error al formatear hora:', error, isoString);
      return '00:00';
    }
  };

  // Formatear duración en formato legible (HH:MM:SS)
  const formatDuration = (seconds: number) => {
    if (!seconds && seconds !== 0) return '00:00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Obtener color según el tipo de evento
  const getEventColor = (type: string) => {
    switch (type) {
      case 'active':
        return 'rgba(76, 175, 80, 0.7)'; // Verde
      case 'paused':
        return 'rgba(255, 152, 0, 0.7)'; // Naranja
      case 'idle':
        return 'rgba(158, 158, 158, 0.7)'; // Gris
      default:
        return 'rgba(200, 200, 200, 0.7)';
    }
  };

  // Obtener texto descriptivo según el tipo de evento
  const getEventDescription = (event: TimelineEvent) => {
    switch (event.type) {
      case 'active':
        return `Producción de ${event.product || 'Producto'} ${event.orderId ? `(Orden ${event.orderId})` : ''}`;
      case 'paused':
        return `Pausa: ${event.pauseReason || 'Sin motivo especificado'} ${event.product ? `(${event.product})` : ''}`;
      case 'idle':
        return 'Tiempo Inactivo';
      default:
        return 'Evento desconocido';
    }
  };

  // Calcular posición y ancho del evento en la línea de tiempo (24 horas = 100%)
  const calculateEventStyle = (event: TimelineEvent): React.CSSProperties => {
    try {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Fechas inválidas para el evento:', event);
        return {
          display: 'none'
        };
      }
      
      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      
      const dayTotalMinutes = 24 * 60;
      
      const startPercent = (startMinutes / dayTotalMinutes) * 100;
      const widthPercent = ((endMinutes - startMinutes) / dayTotalMinutes) * 100;
      
      if (widthPercent <= 0) {
        console.warn('Evento con duración cero o negativa:', event);
        return {
          display: 'none'
        };
      }
      
      return {
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: getEventColor(event.type),
        position: 'absolute',
        height: '30px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: event.type === 'idle' ? '#000' : '#fff',
        fontSize: '12px',
        cursor: 'pointer',
        border: '1px solid rgba(0,0,0,0.2)'
      };
    } catch (error) {
      console.error('Error al calcular estilo del evento:', error, event);
      return {
        display: 'none'
      };
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Timeline de Utilización de Máquina
        </Typography>
        
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="date-select-label">Seleccionar Fecha</InputLabel>
              <Select
                labelId="date-select-label"
                value={selectedDate}
                label="Seleccionar Fecha"
                onChange={(e) => setSelectedDate(e.target.value as string)}
              >
                {availableDates.map(date => (
                  <MenuItem key={date} value={date}>
                    {new Date(date).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            {timelineData && (
              <Box display="flex" justifyContent="flex-end">
                <Button 
                  variant="outlined" 
                  onClick={() => fetchTimelineData(selectedDate)}
                  startIcon={<RefreshIcon />}
                  sx={{ ml: 1 }}
                >
                  Actualizar
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error.dark">{error}</Typography>
          </Box>
        )}
        
        {timelineData && (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardHeader 
                    title="Tiempo Activo" 
                    sx={{ 
                      backgroundColor: 'success.light', 
                      color: 'success.contrastText',
                      p: 1
                    }} 
                  />
                  <CardContent>
                    <Typography variant="h5" align="center">
                      {formatDuration(timelineData.stats.totalActiveTime)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      {Math.round(timelineData.stats.totalActiveTime / 3600 * 10) / 10} horas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardHeader 
                    title="Tiempo de Pausas" 
                    sx={{ 
                      backgroundColor: 'warning.light', 
                      color: 'warning.contrastText',
                      p: 1
                    }} 
                  />
                  <CardContent>
                    <Typography variant="h5" align="center">
                      {formatDuration(timelineData.stats.totalPauseTime)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      {Math.round(timelineData.stats.totalPauseTime / 3600 * 10) / 10} horas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardHeader 
                    title="Tiempo Inactivo" 
                    sx={{ 
                      backgroundColor: 'grey.300', 
                      color: 'text.primary',
                      p: 1
                    }} 
                  />
                  <CardContent>
                    <Typography variant="h5" align="center">
                      {formatDuration(timelineData.stats.totalIdleTime)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      {Math.round(timelineData.stats.totalIdleTime / 3600 * 10) / 10} horas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardHeader 
                    title="Tasa de Utilización" 
                    sx={{ 
                      backgroundColor: 'info.light', 
                      color: 'info.contrastText',
                      p: 1
                    }} 
                  />
                  <CardContent>
                    <Typography variant="h5" align="center">
                      {timelineData.stats.utilizationRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Tiempo productivo vs total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom>
              Timeline del {new Date(selectedDate).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            
            {/* Línea de tiempo con horas */}
            <Box sx={{ position: 'relative', mt: 3, mb: 2 }}>
              {/* Marcadores de horas */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                {Array.from({ length: 25 }, (_, i) => (
                  <Typography key={i} variant="caption" sx={{ width: '1px', textAlign: 'center' }}>
                    {String(i).padStart(2, '0')}:00
                  </Typography>
                ))}
              </Box>
              
              {/* Contenedor principal del timeline */}
              <Box 
                sx={{ 
                  height: '60px', 
                  width: '100%', 
                  position: 'relative',
                  bgcolor: 'grey.100',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 1
                }}
              >
                {/* Líneas verticales para marcar las horas */}
                {Array.from({ length: 25 }, (_, i) => (
                  <Box 
                    key={i} 
                    sx={{ 
                      position: 'absolute', 
                      left: `${(i / 24) * 100}%`, 
                      height: '100%', 
                      width: '1px', 
                      bgcolor: 'grey.300'
                    }} 
                  />
                ))}
                
                {/* Eventos en el timeline */}
                {timelineData.events.map(event => (
                  <Tooltip 
                    key={event.id}
                    title={
                      <React.Fragment>
                        <Typography variant="body2">{getEventDescription(event)}</Typography>
                        <Typography variant="caption">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Duración: {formatDuration(event.duration)}
                        </Typography>
                        {event.pauseReason && (
                          <Typography variant="caption" display="block">
                            Motivo: {event.pauseReason}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                    arrow
                  >
                    <Box 
                      sx={{
                        ...calculateEventStyle(event),
                        '&:hover': {
                          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                          zIndex: 10
                        }
                      } as any}
                    >
                      {event.type === 'active' && event.product && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PlayIcon fontSize="small" sx={{ mr: 0.5 }} />
                          {event.product}
                        </Box>
                      )}
                      {event.type === 'paused' && (
                        <span>Pausa</span>
                      )}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
            
            {/* Leyenda */}
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" sx={{ mx: 2 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: getEventColor('active'), mr: 1, borderRadius: 1 }} />
                <Typography variant="caption">Producción</Typography>
              </Box>
              <Box display="flex" alignItems="center" sx={{ mx: 2 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: getEventColor('paused'), mr: 1, borderRadius: 1 }} />
                <Typography variant="caption">Pausas</Typography>
              </Box>
              <Box display="flex" alignItems="center" sx={{ mx: 2 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: getEventColor('idle'), mr: 1, borderRadius: 1 }} />
                <Typography variant="caption">Tiempo Inactivo</Typography>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default MachineTimeline;