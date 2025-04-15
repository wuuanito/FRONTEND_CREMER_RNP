import React, { useState, useEffect } from 'react';
import { 
  TableContainer, 
  Paper, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Typography,
  Box, 
  Chip, 
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  TablePagination,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { 
  Info as InfoIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { formatDate, getStatusColor } from '../../CREMER/utils/helpers';

const tableStyles = `
  .hover-row:hover {
    background-color: #f5f5f5;
  }

  @media (max-width: 600px) {
    .responsive-table {
      display: block;
      width: 100%;
      overflow-x: auto;
    }
    
    .responsive-hide-on-mobile {
      display: none;
    }
  }
`;

const CleaningOrdersList = ({ orders, fetchDetails, isMobile }) => {
  // Estado para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para los filtros
  const [filters, setFilters] = useState({
    order_code: '',
    cleaning_type: '',
    area_name: '',
    description: '',
    status: '',
    startDate: null,
    endDate: null,
    minDuration: '',
    maxDuration: ''
  });
  
  // Estado para las órdenes filtradas
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // Obtener valores únicos para los filtros selectivos
  const uniqueStatuses = [...new Set(orders.map(order => order.status))];
  const uniqueTypes = [...new Set(orders.map(order => order.cleaning_type))];
  const uniqueAreas = [...new Set(orders.map(order => order.area_name))];
  
  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [orders, filters]);
  
  // Función para manejar cambios en los filtros
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0); // Resetear a la primera página cuando se cambia un filtro
  };
  
  // Función para manejar cambios en los filtros de fecha
  const handleDateChange = (name, date) => {
    setFilters(prev => ({
      ...prev,
      [name]: date
    }));
    setPage(0);
  };
  
  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setFilters({
      order_code: '',
      cleaning_type: '',
      area_name: '',
      description: '',
      status: '',
      startDate: null,
      endDate: null,
      minDuration: '',
      maxDuration: ''
    });
    setPage(0);
  };
  
  // Función para aplicar los filtros
  const applyFilters = () => {
    let result = [...orders];
    
    // Filtrar por código de orden
    if (filters.order_code) {
      result = result.filter(order => 
        order.order_code.toLowerCase().includes(filters.order_code.toLowerCase())
      );
    }
    
    // Filtrar por tipo de limpieza
    if (filters.cleaning_type) {
      result = result.filter(order => order.cleaning_type === filters.cleaning_type);
    }
    
    // Filtrar por área
    if (filters.area_name) {
      result = result.filter(order => order.area_name === filters.area_name);
    }
    
    // Filtrar por descripción
    if (filters.description) {
      result = result.filter(order => 
        order.description.toLowerCase().includes(filters.description.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (filters.status) {
      result = result.filter(order => order.status === filters.status);
    }
    
    // Filtrar por duración mínima
    if (filters.minDuration) {
      const minMinutes = parseInt(filters.minDuration, 10);
      if (!isNaN(minMinutes)) {
        result = result.filter(order => order.estimated_duration_minutes >= minMinutes);
      }
    }
    
    // Filtrar por duración máxima
    if (filters.maxDuration) {
      const maxMinutes = parseInt(filters.maxDuration, 10);
      if (!isNaN(maxMinutes)) {
        result = result.filter(order => order.estimated_duration_minutes <= maxMinutes);
      }
    }
    
    // Filtrar por fecha de inicio
    if (filters.startDate) {
      result = result.filter(order => {
        const orderDate = new Date(order.time.start_time);
        return orderDate >= filters.startDate;
      });
    }
    
    // Filtrar por fecha final
    if (filters.endDate) {
      result = result.filter(order => {
        const orderDate = new Date(order.time.start_time);
        return orderDate <= filters.endDate;
      });
    }
    
    setFilteredOrders(result);
  };
  
  // Funciones para manejar la paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Calcular ordenes para la página actual
  const currentPageOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Panel de Filtros */}
      <Accordion defaultExpanded={false} sx={{ mb: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="filter-panel-content"
          id="filter-panel-header"
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filtros Avanzados</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Código de Orden"
                name="order_code"
                variant="outlined"
                value={filters.order_code}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Limpieza</InputLabel>
                <Select
                  label="Tipo de Limpieza"
                  name="cleaning_type"
                  value={filters.cleaning_type}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {uniqueTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Área</InputLabel>
                <Select
                  label="Área"
                  name="area_name"
                  value={filters.area_name}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {uniqueAreas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                variant="outlined"
                value={filters.description}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  label="Estado"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {uniqueStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Duración Min. (minutos)"
                name="minDuration"
                type="number"
                variant="outlined"
                value={filters.minDuration}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Duración Máx. (minutos)"
                name="maxDuration"
                type="number"
                variant="outlined"
                value={filters.maxDuration}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fecha Desde"
                name="startDate"
                type="date"
                variant="outlined"
                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleDateChange('startDate', date);
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fecha Hasta"
                name="endDate"
                type="date"
                variant="outlined"
                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleDateChange('endDate', date);
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Limpiar Filtros
              </Button>
              <Typography variant="body2">
                {filteredOrders.length} resultados encontrados
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Tabla con los datos */}
      <TableContainer component={Paper} elevation={3} className="responsive-table">
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="subtitle2">Código</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Tipo</Typography></TableCell>
              {!isMobile && (
                <>
                  <TableCell><Typography variant="subtitle2">Área</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Descripción</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Duración Est.</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Estado</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Fecha Inicio</Typography></TableCell>
                </>
              )}
              <TableCell><Typography variant="subtitle2">Acciones</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPageOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 3 : 8} align="center">
                  <Typography>No hay órdenes de limpieza que coincidan con los filtros</Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentPageOrders.map((order) => (
                <TableRow key={order.id} className="hover-row">
                  <TableCell>{order.order_code}</TableCell>
                  <TableCell>
                    {isMobile ? (
                      <Box>
                        <Typography variant="body2">{order.cleaning_type}</Typography>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={getStatusColor(order.status)}
                          sx={{ mt: 1, mb: 1 }}
                        />
                        <Typography variant="caption" display="block">
                          {order.area_name}
                        </Typography>
                      </Box>
                    ) : (
                      order.cleaning_type
                    )}
                  </TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>{order.area_name}</TableCell>
                      <TableCell>{order.description}</TableCell>
                      <TableCell>{order.estimated_duration_minutes} min</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={getStatusColor(order.status)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(order.time.start_time)}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => fetchDetails(order.order_id)}
                    >
                      <InfoIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
        <style>{tableStyles}</style>
      </TableContainer>
    </Box>
  );
};

export default CleaningOrdersList;