import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { CremerDetailsProps, Orden } from './types';
import Timer from './components/Timer';
import OrderStats from './components/OrderStats';
import OrderEvents from './components/OrderEvents';
import { generatePDF } from './utils/pdfGenerator';
import { formatTime } from './utils/formatters';
import {
  ModalOverlay,
  ModalContent,
  TabContainer,
  Tab,
  SearchContainer,
  SearchInput,
  HistoryContainer,
  OrdersList,
  OrderCard,
  Card,
  ActiveCard,
  DetailsSection,
  Title,
  Text,
  Button,
  LoadingSpinner,
  StatCard,
  StatLabel,
  StatValue,
  Subtitle
} from './styles';

const CremerDetails: React.FC<CremerDetailsProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<'activa' | 'historial'>('activa');
  const [ordenActiva, setOrdenActiva] = useState<Orden | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('http://192.168.11.116:4000/ordenes');
      const data = response.data;
      
      const ordenadas = data.sort((a: Orden, b: Orden) => 
        new Date(b.horaInicio).getTime() - new Date(a.horaInicio).getTime()
      );
      
      setOrdenes(ordenadas);
      const active = ordenadas.find((orden: Orden) => !orden.horaFin);
      setOrdenActiva(active || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchData();
  }, [open, fetchData]);

  useEffect(() => {
    if (!open) return;
    const refreshInterval = setInterval(fetchData, 5000);
    return () => clearInterval(refreshInterval);
  }, [open, fetchData]);

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
    const TIEMPO_LIMITE = 30000 * 3600;

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