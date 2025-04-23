// src/components/Dashboard/components/Maintenance/MaintenanceTables.js
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Warning as WarningIcon,
  CleaningServices as CleaningIcon,
  Build as BuildIcon 
} from '@mui/icons-material';

import TableCard from '../common/TableCard';
import { formatDate, formatTime } from '../../utils/formatters';

// Tabla de órdenes de limpieza
const CleaningTable = ({ cleaning }) => (
  <TableCard 
    title="Órdenes de Limpieza"
    icon={<CleaningIcon fontSize="small" />}
    color="#9c27b0"
  >
    {cleaning.orders.length === 0 ? (
      <Typography variant="body1" align="center" py={3}>
        No hay órdenes de limpieza en el período seleccionado
      </Typography>
    ) : (
      <Box sx={{ overflowX: 'auto', p: 2 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Código</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Tipo</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Área</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Descripción</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Operador</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Inicio</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Fin</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Duración</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Est. vs Real</th>
              <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cleaning.orders.map((order, index) => (
              <tr 
                key={order.order_id} 
                style={{ 
                  background: index % 2 === 0 ? 'white' : 'rgba(0, 0, 0, 0.02)',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'medium' }}>{order.order_code}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                  <Chip 
                    label={order.cleaning_type} 
                    size="small" 
                    sx={{ 
                      bgcolor: '#9c27b0',
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.area_name}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.description}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.operator_name || '-'}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(order.start_time)}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(order.end_time)}</td>
                <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                  {formatTime(order.duration_ms)}
                </td>
                <td style={{ 
                  textAlign: 'right', 
                  padding: '10px 12px', 
                  borderBottom: '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  color: (order.estimated_vs_actual * 100) > 110 ? '#c62828' : 
                        (order.estimated_vs_actual * 100) < 90 ? '#2e7d32' : '#1565c0'
                }}>
                  {(order.estimated_vs_actual * 100).toFixed(2)}%
                </td>
                <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                  {order.completed ? (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Completada" 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                    />
                  ) : (
                    <Chip 
                      icon={<WarningIcon />} 
                      label="Pendiente" 
                      size="small" 
                      color="warning" 
                      variant="outlined" 
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    )}
  </TableCard>
);

// Tabla de órdenes de mantenimiento
const MaintenanceTable = ({ maintenance }) => (
  <TableCard 
    title="Órdenes de Mantenimiento"
    icon={<BuildIcon fontSize="small" />}
    color="#2196f3"
  >
    <Box sx={{ overflowX: 'auto', p: 2 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Código</th>
            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Tipo</th>
            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Equipo</th>
            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Descripción</th>
            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Técnico</th>
            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Inicio</th>
            <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Fin</th>
            <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Duración</th>
            <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {maintenance.orders.map((order, index) => (
            <tr 
              key={order.order_id} 
              style={{ 
                background: index % 2 === 0 ? 'white' : 'rgba(0, 0, 0, 0.02)',
                transition: 'background-color 0.3s',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'medium' }}>{order.order_code}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                <Chip 
                  label={order.maintenance_type} 
                  size="small" 
                  sx={{ 
                    bgcolor: '#2196f3',
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
              </td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.equipment_name}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.description}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.technician_name || '-'}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(order.start_time)}</td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(order.end_time)}</td>
              <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                {formatTime(order.duration_ms)}
              </td>
              <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                {order.completed ? (
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label="Completada" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                ) : (
                  <Chip 
                    icon={<WarningIcon />} 
                    label="Pendiente" 
                    size="small" 
                    color="warning" 
                    variant="outlined" 
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  </TableCard>
);

const MaintenanceTables = {
  CleaningTable,
  MaintenanceTable
};

export default MaintenanceTables;