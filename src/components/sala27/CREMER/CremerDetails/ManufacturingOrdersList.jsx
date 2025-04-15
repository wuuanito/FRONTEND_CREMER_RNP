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
// No importamos los componentes de date-pickers para evitar conflictos con date-fns

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

const ManufacturingOrdersList = ({ orders, fetchDetails, isMobile }) => {
  // Estado para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para los filtros
  const [filters, setFilters] = useState({
    order_code: '',
    article_code: '',
    description: '',
    status: '',
    startDate: null,
    endDate: null
  });
  
  // Estado para los órdenes filtradas
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // Obtener estados únicos para el filtro
  const uniqueStatuses = [...new Set(orders.map(order => order.status))];
  
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
      article_code: '',
      description: '',
      status: '',
      startDate: null,
      endDate: null
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
    
    // Filtrar por código de artículo
    if (filters.article_code) {
      result = result.filter(order => 
        order.article_code.toLowerCase().includes(filters.article_code.toLowerCase())
      );
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
              <TextField
                fullWidth
                label="Código de Artículo"
                name="article_code"
                variant="outlined"
                value={filters.article_code}
                onChange={handleFilterChange}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
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
            <Grid item xs={12} sm={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                sx={{ mr: 2 }}
              >
                Limpiar
              </Button>
              <Typography variant="body2" sx={{ ml: 2 }}>
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
              <TableCell><Typography variant="subtitle2">Artículo</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Descripción</Typography></TableCell>
              {!isMobile && (
                <>
                  <TableCell><Typography variant="subtitle2">Cantidad</Typography></TableCell>
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
                <TableCell colSpan={isMobile ? 4 : 7} align="center">
                  <Typography>No hay órdenes de fabricación que coincidan con los filtros</Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentPageOrders.map((order) => (
                <TableRow key={order.id} className="hover-row">
                  <TableCell>{order.order_code}</TableCell>
                  <TableCell>{order.article_code}</TableCell>
                  <TableCell>
                    {isMobile ? (
                      <Box>
                        <Typography variant="body2" noWrap>{order.description}</Typography>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={getStatusColor(order.status)}
                          sx={{ mt: 1, mb: 1 }}
                        />
                        <Typography variant="caption" display="block">
                          {order.quantity.toLocaleString()} und.
                        </Typography>
                      </Box>
                    ) : (
                      order.description
                    )}
                  </TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>{order.quantity.toLocaleString()}</TableCell>
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

export default ManufacturingOrdersList;