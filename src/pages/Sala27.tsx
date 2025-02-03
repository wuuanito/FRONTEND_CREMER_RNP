import React, { useState } from "react";
import CremerDetails from "../components/sala27/CREMER/CremerDetails";
import StatusMonitor from "../components/sala27/TECNOMACO/tecnomaco";

const modalComponents: Record<string, React.FC<{ open: boolean; onClose: () => void }>> = {
  Cremer: CremerDetails,
};

// Mapeo de máquinas a sus URLs de WebSocket
const wsUrls: Record<string, string> = {
  "Cremer": "ws://192.168.20.10:8788",
  "Monolab": "ws://192.168.20.11:8688",
  "Marquesini": "ws://192.168.20.12:8788",
  "Tecnomaco": "ws://192.168.20.13:8788",
  "Envasadora Polvo": "ws://192.168.20.25:8788",
  "Ensobradora 2": "ws://192.168.20.78:8788",
  "Ensobradora 1": "ws://192.168.20.16:8788",
  "Envasadora Flashes": "ws://192.168.20.17:8788",
  "Llenadora Jarabes": "ws://192.168.20.126:8788",
  "Envasadora Viclos": "ws://192.168.20.19:8788",
  "Llenadora Cerradora Viclos": "ws://192.168.20.20:8788",
  "Doypack": "ws://192.168.20.21:8788"
};

const machines = Object.keys(wsUrls);

const Sala27: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  const handleStatusChange = (status: string) => {
    console.log(`Estado de conexión: ${status}`);
  };

  const handleError = (error: Error) => {
    console.error("Error en componente:", error);
  };

  const openModal = (machineName: string) => {
    setSelectedMachine(machineName);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedMachine(null);
    setModalVisible(false);
  };

  const ModalComponent = selectedMachine ? modalComponents[selectedMachine] : null;

  return (
    <div className="sala-container">
      <h1 className="title-card" style={{ fontSize: "2.5rem", fontWeight: 700 }}>
        Sala 27
      </h1>
      <div className="machines-grid">
        {machines.map((machineName) => (
          <div className="machine-card" key={machineName}>
            <StatusMonitor
              name={machineName.toUpperCase()}
              wsUrl={wsUrls[machineName]}
              onStatusChange={handleStatusChange}
              onError={handleError}
              onClick={
                modalComponents[machineName]
                  ? () => openModal(machineName)
                  : undefined
              }
            />
          </div>
        ))}
      </div>
      {ModalComponent && (
        <ModalComponent open={modalVisible} onClose={closeModal} />
      )}
    </div>
  );
};

export default Sala27;