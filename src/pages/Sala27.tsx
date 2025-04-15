import React, { useState } from "react";
import { Box, Grid, Typography, Modal, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import CremerDetails from "../components/sala27/CREMER/CremerDetails"
import Cremer from "../components/sala27/CREMER/cremer";

// Updated machine names in the correct order
const machineNames = [
  "Monolab", "Marquesini", "Tecnomaco", "Cremer", 
  "Envasadora Polvo", "Ensobradora 2", "Ensobradora 1", "Flashes",
  "Jarabes", "Viales", "Viales Pitillo", "Doypack"
];

const Sala27: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  const openModal = (machineName: string) => {
    setSelectedMachine(machineName);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedMachine(null);
    setModalVisible(false);
  };

  // Función para renderizar un componente de máquina según el nombre
  const renderMachineComponent = (machineName: string) => {
    switch (machineName) {
      case "Cremer":
        return <Cremer />;
      default:
        // Placeholder para otras máquinas con estilo similar a Cremer
        return (
          <Box 
            sx={{ 
              bgcolor: 'white',
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              p: 2,
              height: '100%'
            }}
          >
            <Typography variant="subtitle1" fontWeight="500">
              {machineName}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Máquina sin datos
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        sx={{ fontWeight: 700, mb: 3 }}
      >
        Sala 27
      </Typography>
      
      {/* Grid de máquinas 4x3 */}
      <Grid container spacing={2}>
        {machineNames.map((machineName, index) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={3} 
            key={index}
            sx={{
              '& > div': {
                height: 'auto'
              }
            }}
          >
            <Box
              onClick={() => openModal(machineName)}
              sx={{ 
                cursor: "pointer", 
                transition: "transform 0.2s, box-shadow 0.2s", 
                "&:hover": { 
                  transform: "translateY(-3px)", 
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }
              }}
            >
              {renderMachineComponent(machineName)}
            </Box>
          </Grid>
        ))}
      </Grid>
      
      {/* Modal para mostrar detalles */}
      <Modal
        open={modalVisible}
        onClose={closeModal}
        aria-labelledby="machine-details-modal"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box 
          sx={{ 
            position: "relative",
            bgcolor: "background.paper", 
            borderRadius: 2,
            boxShadow: 24, 
            p: 2,
            width: "95%",
            maxWidth: "1500px",
            maxHeight: "90vh",
            overflow: "auto"
          }}
        >
          <IconButton
            sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
            onClick={closeModal}
          >
            <CloseIcon />
          </IconButton>
          
          {selectedMachine === "Cremer" ? (
            <CremerDetails />
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                Detalles de {selectedMachine}
              </Typography>
              <Typography variant="body1">
                Información no disponible para esta máquina.
              </Typography>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Sala27;