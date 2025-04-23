// src/components/Dashboard/components/Pauses/PausesTable.js
import React from 'react';
import { Box, Chip } from '@mui/material';
import { 
  Pause as PauseIcon
} from '@mui/icons-material';

import TableCard from '../common/TableCard';
import { formatDate, formatTime } from '../../utils/formatters';

const PausesTable = ({ categories, colors }) => {
  return (
    <TableCard 
      title="Detalle de Pausas"
      icon={<PauseIcon fontSize="small" />}
      color="#ff9800"
    >
      <Box sx={{ overflowX: 'auto', p: 2 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Orden</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Categoría</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Razón</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Inicio</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Fin</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Duración</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold' }}>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {categories.flatMap((category, categoryIndex) => 
              category.reasons.flatMap(reason => 
                reason.pauses.map((pause, pauseIndex) => (
                  <tr 
                    key={pause.id}
                    style={{ 
                      background: (categoryIndex + pauseIndex) % 2 === 0 ? 'white' : 'rgba(0, 0, 0, 0.02)',
                      transition: 'background-color 0.3s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'medium' }}>{pause.order_code}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                      <Chip 
                        label={category.category} 
                        size="small" 
                        sx={{ 
                          bgcolor: colors.pieColors[categoryIndex % colors.pieColors.length],
                          color: 'white',
                          fontWeight: 'bold'
                        }} 
                      />
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{reason.description}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(pause.start_time)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>{formatDate(pause.end_time)}</td>
                    <td style={{ 
                      textAlign: 'right', 
                      padding: '10px 12px', 
                      borderBottom: '1px solid #e0e0e0',
                      fontWeight: 'bold',
                      color: pause.duration_ms > 3600000 ? '#c62828' : '#1565c0'
                    }}>
                      {formatTime(pause.duration_ms)}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                      {pause.comments || '-'}
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </Box>
    </TableCard>
  );
};

export default PausesTable;