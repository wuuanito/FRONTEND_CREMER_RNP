// src/components/Dashboard/components/common/ChartCard.js
import React from 'react';
import { Card, Box, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const ChartCard = ({ title, chart, info, icon, color, compactView = false }) => {
  return (
    <Card 
      elevation={4} 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6
        },
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
        
        {info && (
          <Tooltip title={info}>
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Box sx={{ p: 2, height: compactView ? 280 : 330 }}>
        {chart}
      </Box>
    </Card>
  );
};

export default ChartCard;