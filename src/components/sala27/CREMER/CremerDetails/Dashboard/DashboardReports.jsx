// src/components/Dashboard/DashboardReports.js
import React, { useState, useEffect } from 'react';
import { Container, Box, Paper, Tabs, Tab, CircularProgress, Typography } from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  Warning as WarningIcon,
  ProductionQuantityLimits as ProductionIcon,
  Pause as PauseIcon,
  CleaningServices as CleaningIcon
} from '@mui/icons-material';

// Importar contexto
import { DashboardProvider } from './context/DashboardContext';

// Importar hook personalizado
import { useDashboardData } from './hooks/useDashboardData';

// Importar componentes
import DashboardOverview from './components/Overview/DashboardOverview';
import ProductionReport from './components/Production/ProductionReport';
import PausesReport from './components/Pauses/PausesReport';
import MaintenanceReport from './components/Maintenance/MaintenanceReport';

const DashboardReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { 
    isLoading, 
    error, 
    dashboardData, 
    productionData, 
    pausesData, 
    maintenanceCleaningData,
    fetchAllReports
  } = useDashboardData();

  // Función para manejar el cambio de tab
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <DashboardProvider>
      <Container maxWidth="xl" sx={{ pb: 4 }}>
        <Box sx={{ my: 3 }}>
          {error && (
            <Paper elevation={3} sx={{ p: 2, mb: 3, bgcolor: '#fff0f0', color: '#c62828', borderLeft: '4px solid #c62828' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="error" />
                <Typography>{error}</Typography>
              </Box>
            </Paper>
          )}
          
          {isLoading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              my: 4, 
              flexDirection: 'column',
              gap: 2
            }}>
              <CircularProgress size={60} />
              <Typography variant="subtitle1" color="textSecondary">
                Cargando datos...
              </Typography>
            </Box>
          )}
          
          {!isLoading && (
            <>
              <Paper sx={{ mb: 3 }} elevation={3}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 72,
                      borderRight: '1px solid rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }
                  }}
                >
                  <Tab 
                    icon={<TrendingUpIcon />} 
                    label="Panel de Control" 
                    iconPosition="start"
                    sx={{ 
                      bgcolor: activeTab === 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                    }}
                  />
                  <Tab 
                    icon={<ProductionIcon />} 
                    label="Producción" 
                    iconPosition="start"
                    sx={{ 
                      bgcolor: activeTab === 1 ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                    }}
                  />
                  <Tab 
                    icon={<PauseIcon />} 
                    label="Pausas" 
                    iconPosition="start"
                    sx={{ 
                      bgcolor: activeTab === 2 ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                    }}
                  />
                  <Tab 
                    icon={<CleaningIcon />} 
                    label="Mantenimiento y Limpieza" 
                    iconPosition="start"
                    sx={{ 
                      bgcolor: activeTab === 3 ? 'rgba(33, 150, 243, 0.1)' : 'transparent'
                    }}
                  />
                </Tabs>
              </Paper>
              
              {activeTab === 0 && <DashboardOverview data={dashboardData} />}
              {activeTab === 1 && <ProductionReport data={productionData} />}
              {activeTab === 2 && <PausesReport data={pausesData} />}
              {activeTab === 3 && <MaintenanceReport data={maintenanceCleaningData} />}
            </>
          )}
        </Box>
        
        {/* Estilos globales */}
        <style>
          {`
            .hover-row:hover {
              background-color: rgba(0, 0, 0, 0.04);
              transition: background-color 0.3s;
            }
            
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
            
            .pulse-animation {
              animation: pulse 2s infinite;
            }
          `}
        </style>
      </Container>
    </DashboardProvider>
  );
};

export default DashboardReports;