import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { jsPDF } from 'jspdf';
import axios from 'axios';

// Core interfaces defining our data structures
interface Pause {
  motivo: string;
  inicio: string;
  fin: string | null;
  tiempo: number | null;
}

interface Orden {
  id: number;
  nombre: string;
  descripcion: string;
  horaInicio: string;
  horaFin: string | null;
  tiempoTotal: number;
  tiempoTotalPausas: number;
  pausas: Pause[];
}

interface CremerDetailsProps {
  open: boolean;
  onClose: () => void;
}

// Utility function for time formatting
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${String(hours).padStart(2, '0')}h`);
  if (minutes > 0 || hours > 0) parts.push(`${String(minutes).padStart(2, '0')}m`);
  parts.push(`${String(secs).padStart(2, '0')}s`);
  
  return parts.join(' ');
};

// Animations for smooth transitions
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;



// Base styled components for layout and structure
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-start;
  }
`;

const ModalContent = styled.div`
  background: #f8f9fd;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: auto;
  padding: 2rem;

  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    padding: 1rem;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 2px;
  background: #e0e0e0;
  padding: 2px;
  border-radius: 8px;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 1rem 2rem;
  background: ${props => props.active ? '#ffffff' : 'transparent'};
  border: none;
  border-radius: 6px;
  color: ${props => props.active ? '#1a237e' : '#546e7a'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
`;

// Search functionality components
const SearchContainer = styled.div`
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  &::placeholder {
    color: #9e9e9e;
  }
`;

// History section layout components
const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const OrdersList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fd;
  border-radius: 8px;

  @media (max-width: 768px) {
    display: flex;
    overflow-x: auto;
    padding: 0.5rem;
    gap: 0.75rem;
    -webkit-overflow-scrolling: touch;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
  }
`;

const OrderCard = styled.div<{ selected: boolean }>`
  padding: 1.5rem;
  background: ${props => props.selected ? '#e3f2fd' : 'white'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.selected ? '#2196f3' : 'transparent'};

  @media (max-width: 768px) {
    flex: 0 0 280px;
    padding: 1rem;
  }
`;

// Card components for different states
const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ActiveCard = styled(Card)`
  border-left: 4px solid #4caf50;
  background: linear-gradient(to right, #ffffff, #f8f9fd);
`;

const DetailsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;
// Timeline components with contained scroll
const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 500px;
  overflow-y: auto;
  padding: 1.5rem;
  margin: -1.5rem;
  position: relative;

  @media (max-width: 768px) {
    height: 400px;
    padding: 1rem;
    margin: -1rem;
  }
`;
const TimelineConnector = styled.div`
  position: absolute;
  left: 2rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
  z-index: 0;
`;

const TimelineEvent = styled.div<{ type: 'start' | 'end' | 'pause' | 'resume' }>`
  position: relative;
  margin-left: 4rem;
  z-index: 1;
  padding: 1rem;
  background: ${props => {
    switch (props.type) {
      case 'start': return '#e8f5e9';
      case 'end': return '#ffebee';
      case 'pause': return '#fff3e0';
      case 'resume': return '#e3f2fd';
    }
  }};
  border-radius: 8px;
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'start': return '#4caf50';
      case 'end': return '#f44336';
      case 'pause': return '#ff9800';
      case 'resume': return '#2196f3';
    }
  }};

  @media (max-width: 768px) {
    margin-left: 3rem;
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    margin-left: 2.5rem;
    font-size: 0.875rem;
  }
`;



const TimelineDot = styled.div<{ type: 'start' | 'end' | 'pause' | 'resume' }>`
  position: absolute;
  left: -4rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: ${props => {
    switch (props.type) {
      case 'start': return '#4caf50';
      case 'end': return '#f44336';
      case 'pause': return '#ff9800';
      case 'resume': return '#2196f3';
    }
  }};
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
`;

// Typography and content components
const Title = styled.h2`
  color: #1a237e;
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin: 0 0 0.75rem 0;
  }
`;


const Subtitle = styled.h3`
  color: #3949ab;
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Text = styled.p`
  color: #546e7a;
  margin: 0.25rem 0;
  line-height: 1.5;
`;

const Button = styled.button`
  background: #3f51b5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
  }

  &:hover {
    background: #303f9f;
  }

  &:active {
    background: #283593;
  }
`;

const LoadingSpinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3f51b5;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;// Timer Component styled components
const TimerContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;


const MainTimer = styled.div`
  grid-column: 1 / -1;
  background: #f8f9fd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  position: relative;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;


const TimerValue = styled.div`
  font-family: 'Roboto Mono', monospace;
  font-size: 3rem;
  font-weight: 700;
  color: #1a237e;
  letter-spacing: 2px;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const TimerLabel = styled.div`
  font-size: 0.875rem;
  color: #546e7a;
  margin-top: 0.5rem;
`;

const PauseIndicator = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #ff9800;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  animation: ${fadeIn} 0.3s ease;
`;

// Timer Component Implementation
interface TimerProps {
  startTime: string;
  endTime?: string | null;
  pauses: Pause[];
  isActive?: boolean;
}

const Timer: React.FC<TimerProps> = ({ startTime, endTime, pauses }) => {
  const [elapsed, setElapsed] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);

  useEffect(() => {
    // Validar que la hora de inicio sea válida
    const initialStart = new Date(startTime).getTime();
    if (isNaN(initialStart)) {
      console.error('Tiempo de inicio inválido');
      return;
    }

    // Calcular el tiempo total de pausas completadas
    const completedPauseTime = pauses.reduce((total, pause) => {
      if (pause.fin) {
        return total + (pause.tiempo || 0);
      }
      return total;
    }, 0);

    // Buscar si hay una pausa activa
    const activePause = pauses.find(p => !p.fin);
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = Math.min(initialStart, now); // Asegurar que el inicio no esté en el futuro
      const end = endTime ? new Date(endTime).getTime() : now;

      // Calcular la duración actual de las pausas incluyendo la pausa activa
      let currentPauseTime = completedPauseTime;
      if (activePause) {
        const pauseStart = new Date(activePause.inicio).getTime();
        const pauseElapsed = Math.max(0, Math.floor((now - pauseStart) / 1000));
        currentPauseTime += pauseElapsed;
      }

      setPauseTime(Math.max(0, currentPauseTime));
      setElapsed(Math.max(0, Math.floor((end - start) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, pauses]);

  // Asegurar que el tiempo efectivo nunca sea negativo
  const effectiveTime = Math.max(0, elapsed - pauseTime);
  const activePause = pauses.find(p => !p.fin);

  return (
    <TimerContainer>
      <MainTimer>
        <TimerValue>{formatTime(effectiveTime)}</TimerValue>
        <TimerLabel>Tiempo Efectivo</TimerLabel>
        {activePause && (
          <PauseIndicator>EN PAUSA - {activePause.motivo}</PauseIndicator>
        )}
      </MainTimer>
      
      <StatCard highlight>
        <StatLabel>Tiempo Total</StatLabel>
        <StatValue>{formatTime(elapsed)}</StatValue>
      </StatCard>
      
      <StatCard>
        <StatLabel>Tiempo en Pausas</StatLabel>
        <StatValue>{formatTime(pauseTime)}</StatValue>
      </StatCard>
    </TimerContainer>
  );
};

// OrderStats Component styled components
const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StatsSection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 0;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;


const StatCard = styled.div<{ highlight?: boolean }>`
  background: ${props => props.highlight ? '#e3f2fd' : '#f5f5f5'};
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.highlight ? '#bbdefb' : 'transparent'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a237e;
  margin: 0.5rem 0;
  font-family: 'Roboto Mono', monospace;
`;

const StatLabel = styled.div`
  color: #546e7a;
  font-size: 0.875rem;
`;

// OrderStats Component Implementation
const OrderStats: React.FC<{ orden: Orden }> = ({ orden }) => {
  const [stats, setStats] = useState({
    tiempoTotal: orden.tiempoTotal,
    tiempoEfectivo: orden.tiempoTotal - orden.tiempoTotalPausas,
    porcentajeEfectivo: 0,
    tiempoPausas: orden.tiempoTotalPausas,
    pausasCompletadas: orden.pausas.filter(p => p.fin).length,
    promedioPausa: 0
  });

  useEffect(() => {
    // Primero verificamos si la orden tiene una fecha de inicio válida
    // Si no tiene fecha de inicio o es inválida (como 1970), consideramos que no está iniciada
    const isValidStartDate = (date: string) => {
      const startDate = new Date(date).getTime();
      const minValidDate = new Date('2024-01-01').getTime(); // O cualquier fecha mínima razonable
      return startDate > minValidDate;
    };

    const updateInterval = setInterval(() => {
      // Si no hay fecha de inicio válida, mostramos todo en cero
      if (!orden.horaInicio || !isValidStartDate(orden.horaInicio)) {
        setStats({
          tiempoTotal: 0,
          tiempoEfectivo: 0,
          porcentajeEfectivo: 0,
          tiempoPausas: 0,
          pausasCompletadas: 0,
          promedioPausa: 0
        });
        return;
      }

      const now = new Date().getTime();
      const start = new Date(orden.horaInicio).getTime();
      
      let total = orden.horaFin ? 
        orden.tiempoTotal : 
        Math.floor((now - start) / 1000);

      const activePause = orden.pausas.find(p => !p.fin);
      let pauseTime = orden.tiempoTotalPausas;
      
      if (activePause) {
        const pauseStart = new Date(activePause.inicio).getTime();
        pauseTime += Math.floor((now - pauseStart) / 1000);
      }

      const efectivo = Math.max(0, total - pauseTime);
      const porcentaje = total > 0 ? (efectivo / total) * 100 : 0;
      
      const pausasCompletadas = orden.pausas.filter(p => p.fin).length;
      const promedioPausa = pausasCompletadas > 0 ? 
        Math.floor(pauseTime / pausasCompletadas) : 0;

      setStats({
        tiempoTotal: total,
        tiempoEfectivo: efectivo,
        porcentajeEfectivo: porcentaje,
        tiempoPausas: pauseTime,
        pausasCompletadas,
        promedioPausa
      });
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [orden]);

  return (
    <StatsContainer>
      <StatsSection>
        <Subtitle>Métricas Principales</Subtitle>
        <StatsGrid>
          <StatCard>
            <StatLabel>Tiempo Total</StatLabel>
            <StatValue>{formatTime(stats.tiempoTotal)}</StatValue>
          </StatCard>
          
          <StatCard highlight>
            <StatLabel>Tiempo Efectivo</StatLabel>
            <StatValue>{formatTime(stats.tiempoEfectivo)}</StatValue>
          </StatCard>
          
          <StatCard>
            <StatLabel>Eficiencia</StatLabel>
            <StatValue>{stats.porcentajeEfectivo.toFixed(1)}%</StatValue>
          </StatCard>
        </StatsGrid>
      </StatsSection>

      <StatsSection>
        <Subtitle>Métricas de Pausas</Subtitle>
        <StatsGrid>
          <StatCard>
            <StatLabel>Tiempo en Pausas</StatLabel>
            <StatValue>{formatTime(stats.tiempoPausas)}</StatValue>
          </StatCard>
          
          <StatCard>
            <StatLabel>Pausas Completadas</StatLabel>
            <StatValue>{stats.pausasCompletadas}</StatValue>
          </StatCard>
          
          <StatCard>
            <StatLabel>Promedio por Pausa</StatLabel>
            <StatValue>{formatTime(stats.promedioPausa)}</StatValue>
          </StatCard>
        </StatsGrid>
      </StatsSection>
    </StatsContainer>
  );
};// OrderEvents Component Implementation with contained scrolling
const OrderEvents: React.FC<{ orden: Orden }> = ({ orden }) => {
  // Using useMemo to optimize performance by preventing unnecessary recalculations
  const events = useMemo(() => {
    const eventList = [];
    
    // Add the initial order start event
    eventList.push({
      type: 'start' as const,
      time: orden.horaInicio,
      label: 'Inicio de Orden',
      description: `Orden "${orden.nombre}" iniciada`,
      duration: null
    });

    // Process all pauses and their corresponding resume events
    orden.pausas.forEach(pausa => {
      eventList.push({
        type: 'pause' as const,
        time: pausa.inicio,
        label: 'Pausa Iniciada',
        description: pausa.motivo,
        duration: null
      });

      if (pausa.fin) {
        eventList.push({
          type: 'resume' as const,
          time: pausa.fin,
          label: 'Pausa Finalizada',
          description: 'Trabajo resumido',
          duration: pausa.tiempo || 0
        });
      }
    });

    // Add order completion event if the order is finished
    if (orden.horaFin) {
      eventList.push({
        type: 'end' as const,
        time: orden.horaFin,
        label: 'Orden Finalizada',
        description: 'Trabajo completado',
        duration: orden.tiempoTotal
      });
    }

    // Sort all events chronologically
    return eventList.sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [orden]);

  // Format date strings consistently throughout the timeline
  const formatEventDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <TimelineContainer>
      <TimelineConnector />
      {events.map((event, index) => (
        <TimelineEvent key={index} type={event.type}>
          <TimelineDot type={event.type} />
          <div>
            <Text style={{ fontWeight: '600' }}>{event.label}</Text>
            <Text>{event.description}</Text>
            <Text style={{ fontSize: '0.875rem', color: '#757575' }}>
              {formatEventDate(event.time)}
            </Text>
            {event.duration !== null && (
              <Text style={{ fontSize: '0.875rem', color: '#9e9e9e' }}>
                Duración: {formatTime(event.duration)}
              </Text>
            )}
          </div>
        </TimelineEvent>
      ))}
    </TimelineContainer>
  );
};

// Main CremerDetails Component Implementation
const CremerDetails: React.FC<CremerDetailsProps> = ({ open, onClose }) => {
  // State management for the component
  const [activeTab, setActiveTab] = useState<'activa' | 'historial'>('activa');
  const [ordenActiva, setOrdenActiva] = useState<Orden | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from the server with error handling
  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('http://192.168.11.116:4000/ordenes');
      const data = response.data;
      
      // Sort orders by start date (most recent first)
      const ordenadas = data.sort((a: Orden, b: Orden) => 
        new Date(b.horaInicio).getTime() - new Date(a.horaInicio).getTime()
      );
      
      setOrdenes(ordenadas);
      
      // Find active order (if any)
      const active = ordenadas.find((orden: Orden) => !orden.horaFin);
      setOrdenActiva(active || null);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (!open) return;
    fetchData();
  }, [open, fetchData]);

  // Set up periodic data refresh
  useEffect(() => {
    if (!open) return;
    const refreshInterval = setInterval(fetchData, 5000);
    return () => clearInterval(refreshInterval);
  }, [open, fetchData]);

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    const completedOrders = ordenes.filter(orden => orden.horaFin);
    if (!searchTerm) return completedOrders;

    const searchLower = searchTerm.toLowerCase();
    return completedOrders.filter(orden => 
      orden.nombre.toLowerCase().includes(searchLower) ||
      orden.descripcion.toLowerCase().includes(searchLower) ||
      new Date(orden.horaInicio).toLocaleDateString().includes(searchLower)
    );
  }, [ordenes, searchTerm]);

  // PDF generation functionality
  const generatePDF = (orden: Orden) => {
    const doc = new jsPDF();
    
    // Document header
    doc.setFontSize(16);
    doc.text(`Reporte de Orden: ${orden.nombre}`, 20, 20);
    
    // General information
    doc.setFontSize(12);
    doc.text(`Descripción: ${orden.descripcion}`, 20, 40);
    doc.text(`Inicio: ${new Date(orden.horaInicio).toLocaleString()}`, 20, 50);
    if (orden.horaFin) {
      doc.text(`Fin: ${new Date(orden.horaFin).toLocaleString()}`, 20, 60);
    } else {
      doc.text('Estado: En progreso', 20, 60);
    }
    
    // Statistics section
    doc.text('Estadísticas:', 20, 80);
    doc.text(`Tiempo Total: ${formatTime(orden.tiempoTotal)}`, 30, 90);
    doc.text(`Tiempo en Pausas: ${formatTime(orden.tiempoTotalPausas)}`, 30, 100);
    doc.text(`Tiempo Efectivo: ${formatTime(orden.tiempoTotal - orden.tiempoTotalPausas)}`, 30, 110);
    doc.text(`Número de Pausas: ${orden.pausas.length}`, 30, 120);
    
    // Detailed pause records
    doc.text('Registro de Pausas:', 20, 140);
    orden.pausas.forEach((pausa, index) => {
      const y = 150 + (index * 25);
      doc.text(`${index + 1}. ${pausa.motivo}`, 30, y);
      doc.text(`   Inicio: ${new Date(pausa.inicio).toLocaleString()}`, 35, y + 5);
      if (pausa.fin) {
        doc.text(`   Fin: ${new Date(pausa.fin).toLocaleString()}`, 35, y + 10);
        doc.text(`   Duración: ${formatTime(pausa.tiempo || 0)}`, 35, y + 15);
      } else {
        doc.text('   En curso', 35, y + 10);
      }
    });

    doc.save(`orden_${orden.id}_${new Date().toISOString()}.pdf`);
  };

  // Render the historical orders section with search
  const renderHistorialSection = () => {
    return (
      <HistoryContainer>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Buscar por nombre, descripción o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        <OrdersList>
          {filteredOrders.length > 0 ? (
            filteredOrders.map(orden => (
              <OrderCard
                key={orden.id}
                selected={selectedOrden?.id === orden.id}
                onClick={() => setSelectedOrden(orden)}
              >
                <Subtitle>{orden.nombre}</Subtitle>
                <Text>
                  {new Date(orden.horaInicio).toLocaleDateString()}
                </Text>
                <Text>
                  Duración: {formatTime(orden.tiempoTotal)}
                </Text>
                <StatCard>
                  <StatLabel>Eficiencia</StatLabel>
                  <StatValue>
                    {((orden.tiempoTotal - orden.tiempoTotalPausas) / 
                      orden.tiempoTotal * 100).toFixed(1)}%
                  </StatValue>
                </StatCard>
              </OrderCard>
            ))
          ) : (
            <Text style={{ padding: '1rem', textAlign: 'center', width: '100%' }}>
              No se encontraron órdenes que coincidan con la búsqueda.
            </Text>
          )}
        </OrdersList>

        {selectedOrden && (
          <>
            <Card>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1rem' 
              }}>
                <Title>{selectedOrden.nombre}</Title>
                <Button onClick={() => generatePDF(selectedOrden)}>
                  Descargar PDF
                </Button>
              </div>

              <Timer 
                startTime={selectedOrden.horaInicio}
                endTime={selectedOrden.horaFin}
                pauses={selectedOrden.pausas}
              />
            </Card>

            <DetailsSection>
              <Card>
                <Title>Estadísticas Detalladas</Title>
                <OrderStats orden={selectedOrden} />
              </Card>
              
              <Card style={{ height: '600px', overflow: 'hidden' }}>
                <Title>Línea de Tiempo</Title>
                <OrderEvents orden={selectedOrden} />
              </Card>
            </DetailsSection>
          </>
        )}
      </HistoryContainer>
    );
  };

  // Render the active order section
  const renderActiveSection = () => {
    if (!ordenActiva) {
      return (
        <Card>
          <Text style={{ textAlign: 'center', padding: '2rem' }}>
            No hay órdenes activas en este momento.
          </Text>
        </Card>
      );
    }
    const now = new Date().getTime();
  const start = new Date(ordenActiva.horaInicio).getTime();
  const tiempoTotal = Math.floor((now - start) / 1000);
  const TIEMPO_LIMITE = 30000 * 3600; // 30000 horas en segundos
    if (tiempoTotal > TIEMPO_LIMITE) {
      return (
        <Card>
          <Text style={{ textAlign: 'center', padding: '2rem' }}>
            No hay órdenes activas en este momento.
          </Text>
        </Card>
      );
    }
  

    return (
      <ActiveCard>
        <Title>{ordenActiva.nombre}</Title>
        <Text>{ordenActiva.descripcion}</Text>
        
        <Timer 
          startTime={ordenActiva.horaInicio}
          endTime={ordenActiva.horaFin}
          pauses={ordenActiva.pausas}
          isActive={true}
        />
        
        <OrderStats orden={ordenActiva} />
        
        <Title>Cronología de Eventos</Title>
        <OrderEvents orden={ordenActiva} />
      </ActiveCard>
    );
  };
  

  if (!open) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <TabContainer>
          <Tab 
            active={activeTab === 'activa'} 
            onClick={() => setActiveTab('activa')}
          >
            Orden Activa
          </Tab>
          <Tab 
            active={activeTab === 'historial'} 
            onClick={() => setActiveTab('historial')}
          >
            Historial
          </Tab>
        </TabContainer>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {activeTab === 'activa' ? 
              renderActiveSection() : 
              renderHistorialSection()
            }
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default CremerDetails;