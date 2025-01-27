import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Badge,
  CircularProgress,
  styled,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  FiberManualRecord as LightIcon,
} from '@mui/icons-material';

// Configuration
const CONFIG = {
  WS: {
    URL: 'ws://192.168.20.10:8788',
    PING_INTERVAL: 30000,
    RECONNECT_DELAY: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    NORMAL_CLOSURE_CODE: 1000,
    BACKOFF_MULTIPLIER: 1.5,
  },
  MONITOR: {
    TIME_UPDATE_INTERVAL: 1000,
  },
} as const;

// Types and Interfaces
interface CremerProps {
  nombre?: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

interface GPIOState {
  estado: boolean;
  ultima_transicion?: string;
  conteo?: number;
}

interface GPIOStates {
  Verde: GPIOState;
  Amarillo: GPIOState;
  Rojo: GPIOState;
  Contador: GPIOState;
}

interface WSMessage {
  timestamp: string;
  estados: GPIOStates;
}

type ConnectionStatus = 'Conectado' | 'Desconectado' | 'Reconectando' | 'Error';

// Styled Components
const StyledLight = styled(Badge)<{ active: boolean; color: string }>(({ theme, active, color }) => ({
  '& .MuiSvgIcon-root': {
    color: active ? color : theme.palette.grey[300],
    transition: theme.transitions.create(['color', 'transform'], {
      duration: theme.transitions.duration.shorter,
    }),
    transform: active ? 'scale(1.2)' : 'scale(1)',
    filter: active ? `drop-shadow(0 0 2px ${color})` : 'none',
  },
}));

const StatusCard = styled(Card)(({ theme }) => ({
  minWidth: 350,
  maxWidth: 450,
  margin: theme.spacing(2),
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

// Utility Functions
const formatCurrentTime = (): string => {
  return new Date().toLocaleTimeString();
};

// Subcomponents
const StatusLight = memo(({ state, color }: { state: GPIOState; color: string }) => (
  <StyledLight
    active={state.estado}
    color={color as "primary" | "secondary" | "default" | "error" | "info" | "success" | "warning"}
    sx={{ color }}
    overlap="circular"
  >
    <LightIcon />
  </StyledLight>
));

StatusLight.displayName = 'StatusLight';

const ConnectionStatusChip = memo(({ status }: { status: ConnectionStatus }) => {
  const getStatusColor = (status: ConnectionStatus): "success" | "error" | "warning" => {
    switch (status) {
      case 'Conectado': return 'success';
      case 'Error': return 'error';
      case 'Reconectando': return 'warning';
      default: return 'error';
    }
  };

  return (
    <Chip
      label={`WS: ${status}`}
      color={getStatusColor(status)}
      size="small"
      icon={status === 'Reconectando' ? <CircularProgress size={16} /> : undefined}
    />
  );
});

ConnectionStatusChip.displayName = 'ConnectionStatusChip';
// WebSocket Manager Class
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private backoffDelay = CONFIG.WS.RECONNECT_DELAY;
  private isIntentionalClosure = false;

  constructor(
    private url: string,
    private onMessage: (data: WSMessage) => void,
    private onStatusChange: (status: ConnectionStatus) => void,
    private onError: (error: Error) => void
  ) {}

  connect(): void {
    if (this.ws?.readyState === WebSocket.CONNECTING) return;

    try {
      this.isIntentionalClosure = false;
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
      this.startPingInterval();
    } catch (error) {
      this.handleError(new Error(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = (event: Event) => {
      const wsError = event instanceof ErrorEvent ? event.error : new Error('WebSocket error');
      this.handleError(wsError);
    };
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.backoffDelay = CONFIG.WS.RECONNECT_DELAY;
    this.onStatusChange('Conectado');
  }

  private handleClose(event: CloseEvent): void {
    this.cleanup();
    if (!this.isIntentionalClosure && event.code !== CONFIG.WS.NORMAL_CLOSURE_CODE) {
      this.scheduleReconnect();
    } else {
      this.onStatusChange('Desconectado');
    }
  }

  private handleError(error: Error): void {
    console.error('[WebSocketManager] Error:', error);
    this.onError(error);
    this.onStatusChange('Error');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WSMessage;
      this.onMessage(data);
    } catch (error) {
      this.handleError(
        new Error(`Message processing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= CONFIG.WS.MAX_RECONNECT_ATTEMPTS) {
      this.handleError(new Error(`Maximum reconnection attempts (${CONFIG.WS.MAX_RECONNECT_ATTEMPTS}) reached`));
      return;
    }

    this.onStatusChange('Reconectando');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = this.backoffDelay * Math.pow(CONFIG.WS.BACKOFF_MULTIPLIER, this.reconnectAttempts);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`[WebSocketManager] Reconnection attempt ${this.reconnectAttempts} after ${delay}ms`);
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    this.cleanup();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        } catch (error) {
          this.handleError(new Error('Ping error'));
        }
      }
    }, CONFIG.WS.PING_INTERVAL);
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  disconnect(): void {
    this.isIntentionalClosure = true;
    this.cleanup();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.close(CONFIG.WS.NORMAL_CLOSURE_CODE, 'Normal disconnection');
      } catch (error) {
        console.error('[WebSocketManager] Disconnection error:', error);
      }
      this.ws = null;
    }
  }
}
// Main Component
const Cremer: React.FC<CremerProps> = memo(({ 
  nombre = "Cremer",
  onStatusChange,
  onError 
}) => {
  const [gpioStates, setGpioStates] = useState<GPIOStates>({
    Verde: { estado: false },
    Amarillo: { estado: false },
    Rojo: { estado: false },
    Contador: { estado: false, conteo: 0 }
  });
  const [status, setStatus] = useState<ConnectionStatus>('Desconectado');
  const [currentTime, setCurrentTime] = useState(formatCurrentTime());
  
  const wsManagerRef = useRef<WebSocketManager | null>(null);

  // Handlers
  const handleMessage = useCallback((data: WSMessage) => {
    if (data?.estados) {
      setGpioStates(data.estados);
      console.log('GPIO States Updated:', data.estados);
    }
  }, []);

  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // WebSocket Effect
  useEffect(() => {
    wsManagerRef.current = new WebSocketManager(
      CONFIG.WS.URL,
      handleMessage,
      handleStatusChange,
      onError || ((error: Error) => console.error('[Cremer] Error:', error))
    );
    
    wsManagerRef.current.connect();

    return () => {
      wsManagerRef.current?.disconnect();
    };
  }, [handleMessage, handleStatusChange, onError]);

  // Time Update Effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(formatCurrentTime());
    }, CONFIG.MONITOR.TIME_UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <StatusCard>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small">
              <SettingsIcon />
            </IconButton>
            <Typography variant="h6">{nombre}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <StatusLight state={gpioStates.Rojo} color="#f44336" />
            <StatusLight state={gpioStates.Amarillo} color="#ffc107" />
            <StatusLight state={gpioStates.Verde} color="#4caf50" />
          </Box>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ConnectionStatusChip status={status} />
         
          <Typography variant="caption" color="text.secondary">
            {currentTime}
          </Typography>
        </Box>
      </CardContent>
    </StatusCard>
  );
});

Cremer.displayName = 'Cremer';

export default Cremer;