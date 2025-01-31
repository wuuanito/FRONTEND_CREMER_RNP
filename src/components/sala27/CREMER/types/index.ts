export interface Pause {
    motivo: string;
    inicio: string;
    fin: string | null;
    tiempo: number | null;
  }
  
  export interface Orden {
    id: number;
    nombre: string;
    descripcion: string;
    horaInicio: string;
    horaFin: string | null;
    tiempoTotal: number;
    tiempoTotalPausas: number;
    pausas: Pause[];
  }
  
  export interface CremerDetailsProps {
    open: boolean;
    onClose: () => void;
  }
  
  export interface TimerProps {
    startTime: string;
    endTime?: string | null;
    pauses: Pause[];
    isActive?: boolean;
  }