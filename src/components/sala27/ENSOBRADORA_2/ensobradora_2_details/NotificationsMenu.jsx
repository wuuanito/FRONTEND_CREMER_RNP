// File: src/components/CremerDetails/NotificationsMenu.js
import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  Button 
} from '@mui/material';
import { format } from 'date-fns';

const NotificationsMenu = ({ 
  notifications, 
  showMenu, 
  navigateToOrder, 
  markAllAsRead, 
  buttonRef, 
  isMobile 
}) => {
  if (!showMenu) return null;
  
  return (
    <Paper
      elevation={3} 
      sx={{ 
        position: 'absolute', 
        top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + window.scrollY : 0,
        right: 16,
        width: isMobile ? 'calc(100% - 32px)' : 320,
        maxHeight: 400,
        overflowY: 'auto',
        zIndex: 1000,
        mt: 1
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1">Notificaciones</Typography>
        <Button size="small" onClick={markAllAsRead}>Marcar todas como leídas</Button>
      </Box>
      
      {notifications.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No hay notificaciones
          </Typography>
        </Box>
      ) : (
        notifications.map((notification) => (
          <Box 
            key={notification.id} 
            sx={{ 
              p: 2, 
              borderBottom: '1px solid #eee',
              backgroundColor: notification.read ? 'transparent' : '#f0f7ff',
              cursor: 'pointer'
            }}
            onClick={() => navigateToOrder(notification)}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
              {notification.type === 'manufacturing' ? 'Fabricación' : 'Limpieza'}: {notification.order_code}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(notification.timestamp, 'dd/MM/yyyy HH:mm:ss')}
            </Typography>
          </Box>
        ))
      )}
    </Paper>
  );
};

export default NotificationsMenu;