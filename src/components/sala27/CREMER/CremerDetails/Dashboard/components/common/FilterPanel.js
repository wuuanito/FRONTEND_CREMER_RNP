// src/components/Dashboard/components/common/FilterPanel.js
import React from 'react';
import { Paper, Box, TextField, Button } from '@mui/material';
import { DateRange as DateRangeIcon } from '@mui/icons-material';

const FilterPanel = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onApplyFilters, 
  buttonColor = 'primary' 
}) => {
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Fecha Inicio"
          type="date"
          size="small"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Fecha Fin"
          type="date"
          size="small"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button 
          variant="contained" 
          startIcon={<DateRangeIcon />}
          onClick={onApplyFilters}
          color={buttonColor}
        >
          Aplicar Filtros
        </Button>
      </Box>
    </Paper>
  );
};

export default FilterPanel;