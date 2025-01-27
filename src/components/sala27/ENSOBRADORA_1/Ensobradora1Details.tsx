import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Modal,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Paper,
  Chip,
  styled,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Interfaces
interface Signal {
  currentState: number;
  activeTime: number;
  inactiveTime: number;
}

interface ActiveOrder {
  pauseReason: string;
  orderId: number;
  orderName: string;
  orderStatus: string;
  startTime: string;
  signals: {
    Verde: Signal;
    Amarillo: Signal;
    Rojo: Signal;
  };
  totalPauseTime: number;
}

interface OrderSummary {
  id: number;
  name: string;
  description: string;
  status: string;
  startTime: string;
  endTime: string;
  greenActiveTime: number;
  yellowActiveTime: number;
  redActiveTime: number;
}

interface OrderDetails extends OrderSummary {
  OrderEvents: {
    id: number;
    type: string;
    description: string;
    timestamp: string;
  }[];
}

interface CremerDetailsProps {
  visible: boolean;
  onClose: () => void;
}

// Styled Components
const StyledModal = styled(Modal)(({ }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ModalContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '90%',
  height: '90%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[5],
  padding: theme.spacing(4),
  overflowY: 'auto',
}));

const StatusChip = styled(Chip)(({  }) => ({
  fontSize: '0.875rem',
  fontWeight: 'bold',
}));

const HorizontalTimelineContainer = styled(Box)(({  }) => ({
  overflow: 'hidden',
  width: '100%',
  position: 'relative',
}));




const HorizontalTimelineScroll = styled(Box)(({ theme }) => ({
  overflowX: 'auto',
  overflowY: 'hidden',
  whiteSpace: 'nowrap',
  width: '100%',
  '&::-webkit-scrollbar': {
    height: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[200],
    borderRadius: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: 4,
  },
}));

const TimelineContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  minWidth: '100%',
  padding: theme.spacing(2),
}));

// Utility Functions
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'completed':
      return 'default';
    default:
      return 'error';
  }
};

// Timeline Component
const OrderTimelineView = React.memo(({ events }: { events: OrderDetails['OrderEvents'] }) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);

  // Define filter options
  const filterOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'green', label: 'Verde' },
    { id: 'yellow', label: 'Naranja' },
    { id: 'red', label: 'Rojo' },
    { id: 'pause', label: 'Pausas' }
  ];

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    if (selectedFilters.includes('all')) return true;
    
    const eventLower = event.description.toLowerCase();
    return (
      (selectedFilters.includes('green') && eventLower.includes('verde')) ||
      (selectedFilters.includes('yellow') && eventLower.includes('naranja')) ||
      (selectedFilters.includes('red') && eventLower.includes('rojo')) ||
      (selectedFilters.includes('pause') && eventLower.includes('pausa'))
    );
  });

  // Handle filter selection
  const handleFilterClick = (filterId: string) => {
    setSelectedFilters(prev => {
      if (filterId === 'all') {
        return ['all'];
      }
      const newFilters = prev.filter(f => f !== 'all');
      if (prev.includes(filterId)) {
        return newFilters.filter(f => f !== filterId).length ? newFilters.filter(f => f !== filterId) : ['all'];
      }
      return [...newFilters, filterId];
    });
  };

  return (
    <HorizontalTimelineContainer>
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }} component="div">
        Línea de Tiempo de Eventos
      </Typography>

      {/* Filter Controls */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {filterOptions.map((filter) => (
          <Chip
            key={filter.id}
            label={filter.label}
            onClick={() => handleFilterClick(filter.id)}
            color={selectedFilters.includes(filter.id) ? 'primary' : 'default'}
            sx={{
              fontWeight: selectedFilters.includes(filter.id) ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          />
        ))}
      </Box>

      <HorizontalTimelineScroll>
        <TimelineContainer>
          {filteredEvents.map((event, index) => (
            <Box
              key={event.id}
              sx={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '200px',
                position: 'relative',
                '&:not(:last-child)::after': {
                  content: '""',
                  position: 'absolute',
                  right: '-50%',
                  top: '20px',
                  width: '100%',
                  height: '2px',
                  backgroundColor: 'primary.main',
                  zIndex: 0,
                }
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  zIndex: 1,
                  mb: 1,
                }}
              >
                {index + 1}
              </Box>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2,
                  width: '180px',
                  m: 1
                }}
              >
                <Typography variant="body2" component="div">
                  {event.description}
                </Typography>
                <Typography variant="caption" color="textSecondary" component="div">
                  {formatDate(event.timestamp)}
                </Typography>
              </Paper>
            </Box>
          ))}
        </TimelineContainer>
      </HorizontalTimelineScroll>
    </HorizontalTimelineContainer>
  );
});

// Active Order Component
const ActiveOrderView = React.memo(() => {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrder = async () => {
    try {
      const response = await fetch('http://192.168.11.15:8000/orders/active/signals');
      if (response.status === 404) {
        setActiveOrder(null);
      } else {
        const data = await response.json();

        // Fetch last pause reason if the order is paused
        if (data.orderStatus === 'paused') {
          const orderDetailsResponse = await fetch(`http://192.168.11.15:8000/orders/${data.orderId}`);
          const orderDetails = await orderDetailsResponse.json();

          const lastPause = orderDetails.OrderPauses?.slice(-1)[0]; // Get the last pause
          data.pauseReason = lastPause?.reason || 'Motivo no especificado';
        }

        setActiveOrder(data);
      }
    } catch (error) {
      console.error('Error fetching active order:', error);
      setActiveOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchActiveOrder, 1000); // Fetch every second
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!activeOrder) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="error" component="div">
          No hay una orden activa en este momento.
        </Typography>
      </Box>
    );
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="div">
            {activeOrder.orderName}
          </Typography>
          <StatusChip
            label={activeOrder.orderStatus}
            color={getStatusColor(activeOrder.orderStatus)}
          />
        </Box>

        <Box display="flex" alignItems="center" mb={3}>
          <AccessTimeIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1" color="textSecondary" component="div">
            Inicio: {formatDate(activeOrder.startTime)}
          </Typography>
        </Box>

        {activeOrder.orderStatus.toLowerCase() === 'paused' && (
          <Box mb={3}>
            <Typography variant="body1" color="warning.main" component="div">
              <strong>Motivo de Pausa:</strong> {activeOrder.pauseReason || 'Motivo no especificado'}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom component="div">
          Estado de Señales
        </Typography>

        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3}>
          {Object.entries(activeOrder.signals).map(([key, signal]) => (
            <Paper key={key} elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Señal {key}
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={<Typography component="div">Tiempo Activo</Typography>}
                    secondary={<Typography component="div">{formatTime(signal.activeTime)}</Typography>}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={<Typography component="div">Tiempo Inactivo</Typography>}
                    secondary={<Typography component="div">{formatTime(signal.inactiveTime)}</Typography>}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={<Typography component="div">Estado Actual</Typography>}
                    secondary={<Typography component="div">{signal.currentState === 1 ? 'Activo' : 'Inactivo'}</Typography>}
                  />
                </ListItem>
              </List>
            </Paper>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
});



// Order History List Item Component
const OrderListItem = React.memo(({ order, onSelect }: { 
  order: OrderSummary, 
  onSelect: (id: number) => void 
}) => (
  <ListItem
    sx={{
      mb: 2,
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
    }}
  >
    <ListItemText
      primary={
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            {order.name}
          </Typography>
          <StatusChip
            label={order.status}
            color={getStatusColor(order.status)}
            size="small"
          />
        </Box>
      }
      secondary={
        <Box component="div">
          <Typography variant="body2" component="div" color="textSecondary">
            Inicio: {formatDate(order.startTime)}
          </Typography>
          <Typography variant="body2" component="div" color="textSecondary">
            Fin: {formatDate(order.endTime)}
          </Typography>
        </Box>
      }
    />
    <Button
      variant="outlined"
      onClick={() => onSelect(order.id)}
      sx={{ ml: 2 }}
    >
      Ver Detalles
    </Button>
  </ListItem>
));

// Main Component
const Ensobradora1Details: React.FC<CremerDetailsProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState({
    orders: true,
    details: false,
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://192.168.11.15:8000/orders/');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(prev => ({ ...prev, orders: false }));
      }
    };

    if (visible) {
      fetchOrders();
    }
  }, [visible]);

  const fetchOrderDetails = async (orderId: number) => {
    setLoading(prev => ({ ...prev, details: true }));
    try {
      const response = await fetch(`http://192.168.11.15:8000/orders/${orderId}`);
      const data = await response.json();
      setSelectedOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSelectedOrderDetails(null);
  };

  const OrderHistoryView = () => {
    if (loading.orders && !selectedOrderDetails) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <CircularProgress />
        </Box>
      );
    }

    if (selectedOrderDetails) {
      return (
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedOrderDetails(null)}
            sx={{ mb: 3 }}
          >
            Volver al Historial
          </Button>

          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" component="div">
                  {selectedOrderDetails.name}
                </Typography>
                <StatusChip
                  label={selectedOrderDetails.status}
                  color={getStatusColor(selectedOrderDetails.status)}
                />
              </Box>

              <Typography variant="body1" color="textSecondary" component="div" paragraph>
                {selectedOrderDetails.description}
              </Typography>

              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3} mb={4}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" component="div">
                    Tiempo Verde
                  </Typography>
                  <Typography variant="h6" component="div">
                    {formatTime(selectedOrderDetails.greenActiveTime)}
                  </Typography>
                </Paper>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" component="div">
                    Tiempo Amarillo
                  </Typography>
                  <Typography variant="h6" component="div">
                    {formatTime(selectedOrderDetails.yellowActiveTime)}
                  </Typography>
                </Paper>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" component="div">
                    Tiempo Rojo
                  </Typography>
                  <Typography variant="h6" component="div">
                    {formatTime(selectedOrderDetails.redActiveTime)}
                  </Typography>
                </Paper>
              </Box>
              <OrderTimelineView events={selectedOrderDetails.OrderEvents} />
            </CardContent>
          </Card>
        </Box>
      );
    }

    return (
      <List>
        {orders.map((order) => (
          <OrderListItem
            key={order.id}
            order={order}
            onSelect={fetchOrderDetails}
          />
        ))}
      </List>
    );
  };

  return (
    <StyledModal
      open={visible}
      onClose={onClose}
      aria-labelledby="cremer-details-modal"
    >
      <ModalContent>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 'bold',
              },
            }}
          >
            <Tab label="Orden Activa" />
            <Tab label="Historial de Órdenes" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 3 }}>
          {activeTab === 0 ? <ActiveOrderView /> : <OrderHistoryView />}
        </Box>
      </ModalContent>
    </StyledModal>
  );
};

export default Ensobradora1Details;