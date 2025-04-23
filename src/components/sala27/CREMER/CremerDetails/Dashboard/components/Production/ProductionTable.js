// src/components/Dashboard/components/Production/ProductionTable.js
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { 
  ProductionQuantityLimits as ProductionIcon
} from '@mui/icons-material';

import TableCard from '../common/TableCard';
import { formatTime, formatPercentage } from '../../utils/formatters';

const ProductionTable = ({ orders }) => {
  const theme = useTheme();

  return (
    <TableCard 
      title="Órdenes de Producción"
      icon={<ProductionIcon fontSize="small" />}
      color={theme.palette.success.main}
    >
      {orders.length === 0 ? (
        <Typography variant="body1" align="center" py={3}>
          No hay órdenes de producción en el período seleccionado
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto', p: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
                <th style={{textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Código</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Artículo</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Descripción</th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>U. Buenas</th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Defect.</th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Total</th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>% Defect.</th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Duración</th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Prod. (u/min)</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
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
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.article_code}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{order.description}</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', color: '#2e7d32', fontWeight: 'bold' }}>
                    {order.production.good_units.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', color: '#c62828', fontWeight: 'bold' }}>
                    {order.production.defective_units.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                    {order.production.total_units.toLocaleString()}
                  </td>
                  <td style={{ 
                    textAlign: 'right', 
                    padding: '10px 12px', 
                    borderBottom: '1px solid #e0e0e0', 
                    fontWeight: 'bold',
                    color: parseFloat(order.production.defective_rate) > 5 ? '#c62828' : '#2e7d32'
                  }}>
                    {order.production.defective_rate}%
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                    {formatTime(order.duration_ms)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                    {order.rates.total_production_rate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </TableCard>
  );
};

export default ProductionTable;