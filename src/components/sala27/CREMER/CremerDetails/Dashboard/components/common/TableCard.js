// src/components/Dashboard/components/common/TableCard.js
import React from 'react';
import { Card, Box, Typography, Avatar } from '@mui/material';

const TableCard = ({ title, children, icon, color }) => {
  return (
    <Card 
      elevation={4} 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 6
        },
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <Avatar sx={{ 
          bgcolor: color, 
          width: 32, 
          height: 32, 
          mr: 1 
        }}>
          {icon}
        </Avatar>
        <Typography variant="h6">{title}</Typography>
      </Box>
      
      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
        {children}
      </Box>
    </Card>
  );
};

export default TableCard;