import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  ListItemSecondaryAction,
  Autocomplete,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

interface Material {
  CodArticle: string;
  MaterialDescription: string;
  Quantity: number;
  StructureDescription: string;
}

interface EstructuraDetalle {
  idTask: number;
  materiales: Material[];
}

interface ArticuloSugerido {
  CodArticle: string;
  Description: string;
}

const HerramientaRPS: React.FC = () => {
  const [materiales, setMateriales] = useState<string[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState<ArticuloSugerido | null>(null);
  const [sugerencias, setSugerencias] = useState<ArticuloSugerido[]>([]);
  const [resultados, setResultados] = useState<EstructuraDetalle[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para buscar artículos mientras se escribe
  const buscarArticulos = async (termino: string) => {
    if (termino.length < 2) {
      setSugerencias([]);
      return;
    }
    
    setBuscandoSugerencias(true);
    try {
      const response = await fetch(`http://192.168.11.19:3001/api/articulos/buscar/${encodeURIComponent(termino)}`, {
        headers: {
          'Accept': 'application/json; charset=utf-8',
        },
      });
      
      if (!response.ok) throw new Error('Error al buscar artículos');
      
      const text = await response.text();
      const data = JSON.parse(text);
      setSugerencias(data);
    } catch (err) {
      console.error('Error al buscar artículos:', err);
      setSugerencias([]);
    } finally {
      setBuscandoSugerencias(false);
    }
  };

  const agregarMaterial = () => {
    if (nuevoMaterial && !materiales.includes(nuevoMaterial.CodArticle)) {
      setMateriales([...materiales, nuevoMaterial.CodArticle]);
      setNuevoMaterial(null);
    }
  };

  const eliminarMaterial = (material: string) => {
    setMateriales(materiales.filter(m => m !== material));
  };

  const buscarEstructuras = async () => {
    if (materiales.length === 0) {
      setError('Debe agregar al menos un material');
      return;
    }

    setCargando(true);
    setError(null);
    
    try {
      const response = await fetch('http://192.168.11.19:3001/api/estructuras/buscar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ materiales }),
      });

      if (!response.ok) {
        throw new Error('Error al buscar estructuras');
      }

      const text = await response.text();
      const data = JSON.parse(text);
      setResultados(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Buscador de Estructuras RPS
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Autocomplete
              fullWidth
              value={nuevoMaterial}
              onChange={(_event, newValue) => {
                setNuevoMaterial(newValue);
                if (newValue) {
                  agregarMaterial();
                }
              }}
              onInputChange={(_event, newInputValue) => {
                buscarArticulos(newInputValue);
              }}
              options={sugerencias}
              getOptionLabel={(option) => `${option.CodArticle} - ${option.Description}`}
              loading={buscandoSugerencias}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar artículo"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {buscandoSugerencias ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
              noOptionsText="No se encontraron artículos"
              loadingText="Buscando..."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={agregarMaterial}
              disabled={!nuevoMaterial}
            >
              Agregar Material
            </Button>
          </Grid>
        </Grid>

        <List>
          {materiales.map((material, index) => (
            <ListItem key={index}>
              <ListItemText primary={material} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => eliminarMaterial(material)} size="small">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          onClick={buscarEstructuras}
          disabled={materiales.length === 0 || cargando}
          sx={{ mt: 2 }}
        >
          Buscar Estructuras
        </Button>
      </Paper>

      {cargando && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {resultados.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Estructuras Encontradas ({resultados.length})
          </Typography>
          {resultados.map((estructura) => (
            <Paper key={estructura.idTask} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                ID: {estructura.idTask}
              </Typography>
              <Typography variant="subtitle1" gutterBottom color="text.secondary">
                {estructura.materiales[0]?.StructureDescription}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estructura.materiales.map((material, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{material.CodArticle}</TableCell>
                        <TableCell>{material.MaterialDescription}</TableCell>
                        <TableCell align="right">{material.Quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </Box>
      )}

      {resultados.length === 0 && !cargando && !error && (
        <Alert severity="info">
          No se encontraron estructuras que contengan todos los materiales especificados.
        </Alert>
      )}
    </Box>
  );
};

export default HerramientaRPS;