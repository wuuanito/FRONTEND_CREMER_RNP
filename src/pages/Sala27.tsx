import React, { useState } from "react";
import CremerDetails from "../components/sala27/CREMER/CremerDetails";
import StatusMonitor from "../components/sala27/TECNOMACO/tecnomaco";

const modalComponents: Record<string, React.FC<{ open: boolean; onClose: () => void }>> = {
  Cremer: CremerDetails,
};

// Mapeo de máquinas a sus URLs de WebSocket
const wsUrls: Record<string, string> = {
  "Cremer": "ws://192.168.20.100:8765",

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