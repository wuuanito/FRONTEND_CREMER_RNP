// src/components/Dashboard/components/common/StatsCard.js
import React from 'react';
import { Card, Box, CardContent, Typography, Divider } from '@mui/material';

const StatsCard = ({ icon, title, mainValue, mainLabel, details, color, progress, onClick, compactView = false }) => {
  return (
    <Card 
      elevation={4} 
      sx={{ 
        height: '100%', 
        position: 'relative',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6
        },
        overflow: 'visible',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          left: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(45deg, ${color[0]}, ${color[1]})`,
          boxShadow: `0 4px 20px 0 rgba(${parseInt(color[0].substring(1, 3), 16)}, ${parseInt(color[0].substring(3, 5), 16)}, ${parseInt(color[0].substring(5, 7), 16)}, 0.2)`,
          zIndex: 10
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ pt: 5, px: 3, pb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" sx={{ 
          color: color[0], 
          fontWeight: 'bold', 
          mb: 1,
          fontSize: compactView ? '1.5rem' : '2.5rem'
        }}>
          {mainValue}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {mainLabel}
        </Typography>
        
        {progress && (
          <Box sx={{ 
            width: '100%', 
            height: 8, 
            bgcolor: 'rgba(0,0,0,0.08)', 
            borderRadius: 4,
            mt: 2, 
            mb: 1,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              width: `${progress}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, ${color[0]}, ${color[1]})`,
              borderRadius: 4,
              transition: 'width 1s ease-in-out'
            }} />
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mt: 1 }}>
          {details.map((detail, index) => (
            <Typography key={index} variant="body2" sx={{ 
              mb: 0.5, 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: compactView ? '0.75rem' : '0.875rem' 
            }}>
              <span>{detail.label}:</span>
              <span style={{ fontWeight: 'bold' }}>{detail.value}</span>
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;