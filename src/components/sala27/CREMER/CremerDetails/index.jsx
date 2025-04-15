// File: src/components/CremerDetails/index.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';

import { 
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon,
  BarChart as ChartIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

// Import subcomponents
import ManufacturingOrdersList from './ManufacturingOrdersList';
import CleaningOrdersList from './CleaningOrdersList';
import ManufacturingOrderDetails from './ManufacturingOrderDetails';
import CleaningOrderDetails from './CleaningOrderDetails';
import ReportsView from './ReportsView';
import NotificationsMenu from './NotificationsMenu';
import DashboardReports from '../CremerDetails/DashboardReports';

// Import API constants
import { API_BASE_URL, SOCKET_URL, MANUFACTURING_URL, CLEANING_URL } from '../../CREMER/constants/api';

// Import interfaces/types
import { 
  ManufacturingOrderSummary, 
  CleaningOrderSummary,
  ManufacturingOrderDetail,
  CleaningOrderDetail,
  Notification
} from '../../CREMER/types/index';

// Utility functions
import { formatDate } from '../../CREMER/utils/dateUtils';

const CremerDetails = () => {
  // Estado para el tab activo
  const [mainTab, setMainTab] = useState(0); // 0: Dashboard, 1: Órdenes, 2: Reportes
  const [detailsTab, setDetailsTab] = useState(0); // 0: Fabricación, 1: Limpieza
  
  // Estados para los listados
  const [manufacturingOrders, setManufacturingOrders] = useState([]);
  const [cleaningOrders, setCleaningOrders] = useState([]);
  
  // Estados para los detalles
  const [selectedManufacturingOrder, setSelectedManufacturingOrder] = useState(null);
  const [selectedCleaningOrder, setSelectedCleaningOrder] = useState(null);
  
  // Estado para controlar la visualización
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  
  // Estados para las notificaciones
  const [notifications, setNotifications] = useState([]);
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const socketRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  
  // Referencia para el menú de notificaciones
  const notificationButtonRef = useRef(null);
  
  // Obtener el tema para consultar breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Configurar Socket.io para notificaciones en tiempo real
  useEffect(() => {
    // Inicializar la conexión socket
    socketRef.current = io(SOCKET_URL);
    
    // Escuchar eventos de actualización de órdenes de fabricación
    socketRef.current?.on('manufacturing_order_update', (data) => {
      const newNotification = {
        id: `manufacturing-${Date.now()}`,
        type: 'manufacturing',
        order_code: data.order_code ?? '',
        status: data.new_status,
        message: `Orden de fabricación ${data.order_code} cambió a estado ${data.new_status}`,
        timestamp: new Date(),
        read: false
      };
      
      addNotification(newNotification);
      
      // Actualizar los datos si corresponde
      if (mainTab === 1 && !viewingDetails) {
        fetchManufacturingOrders();
      } else if (mainTab === 1 && viewingDetails && selectedManufacturingOrder?.order.order_code === data.order_code) {
        if (selectedManufacturingOrder) {
          fetchManufacturingOrderDetails(selectedManufacturingOrder.order.id);
        }
      }
    });
    
    // Escuchar eventos de actualización de órdenes de limpieza
    socketRef.current?.on('cleaning_order_update', (data) => {
      const newNotification = {
        id: `cleaning-${Date.now()}`,
        type: 'cleaning',
        order_code: data.order_code ?? '',
        status: data.new_status,
        message: `Orden de limpieza ${data.order_code} cambió a estado ${data.new_status}`,
        timestamp: new Date(),
        read: false
      };
      
      addNotification(newNotification);
      
      // Actualizar los datos si corresponde
      if (mainTab === 1 && !viewingDetails) {
        fetchCleaningOrders();
      } else if (mainTab === 1 && viewingDetails && selectedCleaningOrder?.order.order_code === data.order_code) {
        if (selectedCleaningOrder) {
          fetchCleaningOrderDetails(selectedCleaningOrder.order.id);
        }
      }
    });
    
    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [mainTab, viewingDetails, selectedManufacturingOrder, selectedCleaningOrder]);
  
  // Función para añadir una nueva notificación
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      const newNotifications = [...prev, notification];
      // Limitar a las 50 notificaciones más recientes
      return newNotifications.slice(-50);
    });
    
    // Actualizar contador de no leídas
    setUnreadCount(prev => prev + 1);
    
    // Mostrar alerta
    setCurrentNotification(notification);
    setShowNotificationAlert(true);
  }, []);
  
  // Función para marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);
  
  // Función para marcar una notificación específica como leída
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Actualizar contador
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);
  
  // Función para navegar a la orden desde la notificación
  const navigateToOrderFromNotification = useCallback((notification) => {
    // Cerrar el menú de notificaciones
    setShowNotificationsMenu(false);
    
    // Marcar como leída
    markAsRead(notification.id);
    
    // Navegar a la pestaña de órdenes
    setMainTab(1);
    
    // Encontrar y abrir la orden correspondiente
    if (notification.type === 'manufacturing') {
      setDetailsTab(0);
      const order = manufacturingOrders.find(o => o.order_code === notification.order_code);
      if (order) {
        fetchManufacturingOrderDetails(order.order_id);
      }
    } else {
      setDetailsTab(1);
      const order = cleaningOrders.find(o => o.order_code === notification.order_code);
      if (order) {
        fetchCleaningOrderDetails(order.order_id);
      }
    }
  }, [manufacturingOrders, cleaningOrders, markAsRead]);
  
  // Cargar los datos iniciales
  useEffect(() => {
    fetchManufacturingOrders();
    fetchCleaningOrders();
  }, []);
  
  // Función para obtener las órdenes de fabricación
  const fetchManufacturingOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(MANUFACTURING_URL);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setManufacturingOrders(data.orders);
    } catch (err) {
      setError(`Error al cargar órdenes de fabricación: ${err.message}`);
      console.error('Error al cargar órdenes de fabricación:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para obtener las órdenes de limpieza
  const fetchCleaningOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(CLEANING_URL);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setCleaningOrders(data.orders);
    } catch (err) {
      setError(`Error al cargar órdenes de limpieza: ${err.message}`);
      console.error('Error al cargar órdenes de limpieza:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para obtener los detalles de una orden de fabricación
  const fetchManufacturingOrderDetails = async (orderId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MANUFACTURING_URL}/${orderId}`);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setSelectedManufacturingOrder(data);
      setViewingDetails(true);
      setMainTab(1); // Cambiar a la pestaña de órdenes
      setDetailsTab(0); // Asegurarse que estamos en detalles de fabricación
    } catch (err) {
      setError(`Error al cargar detalles de la orden: ${err.message}`);
      console.error('Error al cargar detalles de la orden:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para obtener los detalles de una orden de limpieza
  const fetchCleaningOrderDetails = async (orderId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${CLEANING_URL}/${orderId}`);
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      const data = await response.json();
      setSelectedCleaningOrder(data);
      setViewingDetails(true);
      setMainTab(1); // Cambiar a la pestaña de órdenes
      setDetailsTab(1); // Asegurarse que estamos en detalles de limpieza
    } catch (err) {
      setError(`Error al cargar detalles de la orden: ${err.message}`);
      console.error('Error al cargar detalles de la orden:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para volver a la lista de órdenes
  const handleBackToList = () => {
    setViewingDetails(false);
    setSelectedManufacturingOrder(null);
    setSelectedCleaningOrder(null);
  };
  
  // Función para refrescar los datos
  const handleRefresh = () => {
    if (mainTab === 0) {
      // El dashboard tiene su propio método de refresco
    } else if (mainTab === 2) {
      // Nada que refrescar en la vista de reportes
    } else {
      // Estamos en la vista de órdenes
      if (viewingDetails) {
        if (detailsTab === 0 && selectedManufacturingOrder) {
          fetchManufacturingOrderDetails(selectedManufacturingOrder.order.id);
        } else if (detailsTab === 1 && selectedCleaningOrder) {
          fetchCleaningOrderDetails(selectedCleaningOrder.order.id);
        }
      } else {
        fetchManufacturingOrders();
        fetchCleaningOrders();
      }
    }
  };
  
  // Función para cambiar de tab principal
  const handleMainTabChange = (_, newValue) => {
    setMainTab(newValue);
    
    if (newValue === 0 || newValue === 2) {
      // Acciones específicas para el dashboard o reportes
    }
  };
  
  // Función para cambiar de tab de detalles
  const handleDetailsTabChange = (_, newValue) => {
    setDetailsTab(newValue);
    setViewingDetails(false);
    setSelectedManufacturingOrder(null);
    setSelectedCleaningOrder(null);
  };
  
  // Función para alternar la visibilidad del menú de notificaciones
  const toggleNotificationsMenu = () => {
    setShowNotificationsMenu(prev => !prev);
    if (!showNotificationsMenu) {
      markAllAsRead();
    }
  };
  
  // Función para cerrar alerta de notificación
  const handleCloseAlert = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowNotificationAlert(false);
  };
  
  // Renderizar el contenido principal basado en la pestaña seleccionada
  const renderContent = () => {
    if (mainTab === 0) {
      // Mostrar el dashboard
      return <DashboardReports />;
    } else if (mainTab === 2) {
      // Mostrar la vista de reportes
      return (
        <ReportsView 
          selectedManufacturingOrder={selectedManufacturingOrder}
          fetchManufacturingOrderDetails={fetchManufacturingOrderDetails}
          manufacturingOrders={manufacturingOrders}
        />
      );
    } else {
      // Mostrar la vista de órdenes
      if (viewingDetails) {
        return detailsTab === 0 
          ? (
            <ManufacturingOrderDetails
              order={selectedManufacturingOrder}
              handleBackToList={handleBackToList}
              isMobile={isMobile}
            />
          ) 
          : (
            <CleaningOrderDetails
              order={selectedCleaningOrder}
              handleBackToList={handleBackToList}
              isMobile={isMobile}
            />
          );
      } else {
        return (
          <>
            <Paper sx={{ mb: 3 }} elevation={2}>
              <Tabs
                value={detailsTab}
                onChange={handleDetailsTabChange}
                variant={isMobile ? "fullWidth" : "standard"}
                centered
              >
                <Tab 
                  label="Órdenes de Fabricación" 
                  iconPosition="start"
                />
                <Tab 
                  label="Órdenes de Limpieza" 
                  iconPosition="start"
                />
              </Tabs>
            </Paper>
            
            {detailsTab === 0 ? (
              <ManufacturingOrdersList
                orders={manufacturingOrders}
                fetchDetails={fetchManufacturingOrderDetails}
                isMobile={isMobile}
              />
            ) : (
              <CleaningOrdersList
                orders={cleaningOrders}
                fetchDetails={fetchCleaningOrderDetails}
                isMobile={isMobile}
              />
            )}
          </>
        );
      }
    }
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom={isMobile} 
            sx={{ flex: 1, mb: isMobile ? 2 : 0 }}
          >
            {mainTab === 0 ? '' : 
              mainTab === 2 ? 'Reportes' :
              (viewingDetails ? 
                (detailsTab === 0 ? 'Detalles de Orden de Fabricación' : 'Detalles de Orden de Limpieza') : 
                'Listado de Órdenes'
              )
            }
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Notificaciones">
              <IconButton 
                color="primary" 
                onClick={toggleNotificationsMenu}
                ref={notificationButtonRef}
                sx={{ position: 'relative' }}
              >
                <NotificationIcon />
                {unreadCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: 'error.main',
                      color: 'white',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      transform: 'translate(25%, -25%)'
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Box>
                )}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refrescar datos">
              <IconButton onClick={handleRefresh} color="primary">
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
        
        {/* Tabs principales */}
        <Paper sx={{ mb: 3 }} elevation={2}>
          <Tabs
            value={mainTab}
            onChange={handleMainTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            centered
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Dashboard" 
              iconPosition="start"
            />
            <Tab
              icon={<ChartIcon />} 
              label="Órdenes" 
              iconPosition="start"
            />
            <Tab
              icon={<ReportIcon />} 
              label="Reportes" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>
      
        {isLoading && mainTab !== 2 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderContent()
        )}
        
        {/* Notificaciones en tiempo real */}
        <NotificationsMenu 
          notifications={notifications}
          showMenu={showNotificationsMenu}
          navigateToOrder={navigateToOrderFromNotification}
          markAllAsRead={markAllAsRead}
          buttonRef={notificationButtonRef}
          isMobile={isMobile}
        />
        
        <Snackbar
          open={showNotificationAlert}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity="info" 
            sx={{ width: '100%', cursor: 'pointer' }}
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={handleCloseAlert}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            onClick={() => {
              if (currentNotification) {
                navigateToOrderFromNotification(currentNotification);
                setShowNotificationAlert(false);
              }
            }}
          >
            {currentNotification?.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default CremerDetails;