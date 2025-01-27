import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import styled from 'styled-components';
import { Settings, FiberManualRecord } from '@mui/icons-material';

// Configuration
const CONFIG = {
  WS: {
    PING_INTERVAL: 30000,
    RECONNECT_DELAY: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    NORMAL_CLOSURE_CODE: 1000,
    BACKOFF_MULTIPLIER: 1.5,
  },
  MONITOR: {
    TIME_UPDATE_INTERVAL: 1000,
  },
};

// Types
interface StatusMonitorProps {
  name?: string;
  wsUrl: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
}

type ConnectionStatus = 'Conectado' | 'Desconectado' | 'Reconectando' | 'Error';

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

// Styled Components
const MonitorCard = styled.div`
  width: 100%;
  height: 100%;
  min-height: 160px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  svg {
    color: #4a5568;
    font-size: 18px;
  }
`;

const StatusLights = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Light = styled(FiberManualRecord)<{ active: boolean; lightcolor: string }>`
  transition: all 0.3s ease;
  font-size: 20px;
  color: ${props => props.active ? props.lightcolor : '#e2e8f0'};
  filter: ${props => props.active ? `drop-shadow(0 0 4px ${props.lightcolor})` : 'none'};
  transform: ${props => props.active ? 'scale(1.1)' : 'scale(1)'};
`;

const CardContent = styled.div`
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatusChip = styled.div<{ status: ConnectionStatus }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: ${props => {
    switch (props.status) {
      case 'Conectado': return '#dcfce7';
      case 'Reconectando': return '#fef9c3';
      case 'Error': return '#fee2e2';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'Conectado': return '#166534';
      case 'Reconectando': return '#854d0e';
      case 'Error': return '#991b1b';
      default: return '#475569';
    }
  }};
`;

const TimeDisplay = styled.span`
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
`;

const Spinner = styled.span`
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  display: inline-block;
  animation: spin 1s linear infinite;
`;

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
        this.ws.close(CONFIG.WS.NORMAL_CLOSURE_CODE);
      } catch (error) {
        console.error('[WebSocketManager] Disconnection error:', error);
      }
      this.ws = null;
    }
  }
}

// Main Component
const StatusMonitor: React.FC<StatusMonitorProps> = memo(({ 
  name = "Monitor",
  wsUrl,
  onStatusChange,
  onError,
  onClick
}) => {
  const [gpioStates, setGpioStates] = useState<GPIOStates>({
    Verde: { estado: false },
    Amarillo: { estado: false },
    Rojo: { estado: false },
    Contador: { estado: false, conteo: 0 }
  });
  const [status, setStatus] = useState<ConnectionStatus>('Desconectado');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  const wsManagerRef = useRef<WebSocketManager | null>(null);

  const handleMessage = useCallback((data: WSMessage) => {
    if (data?.estados) {
      setGpioStates(data.estados);
    }
  }, []);

  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  useEffect(() => {
    wsManagerRef.current = new WebSocketManager(
      wsUrl,
      handleMessage,
      handleStatusChange,
      onError || ((error: Error) => console.error('[StatusMonitor] Error:', error))
    );
    
    wsManagerRef.current.connect();

    return () => {
      wsManagerRef.current?.disconnect();
    };
  }, [wsUrl, handleMessage, handleStatusChange, onError]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, CONFIG.MONITOR.TIME_UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <MonitorCard onClick={onClick}>
      <CardHeader>
        <TitleSection>
          <SettingsButton onClick={e => e.stopPropagation()}>
            <Settings />
          </SettingsButton>
          <Title>{name}</Title>
        </TitleSection>
        <StatusLights>
          <Light 
            active={gpioStates.Rojo.estado}
            lightcolor="#ef4444"
          />
          <Light 
            active={gpioStates.Amarillo.estado}
            lightcolor="#eab308"
          />
          <Light 
            active={gpioStates.Verde.estado}
            lightcolor="#22c55e"
          />
        </StatusLights>
      </CardHeader>
      
      <CardContent>
        <StatusBar>
          <StatusChip status={status}>
            {status === 'Reconectando' && (
              <Spinner>⟳</Spinner>
            )}
            {status}
          </StatusChip>
          <TimeDisplay>{currentTime}</TimeDisplay>
        </StatusBar>
      </CardContent>
    </MonitorCard>
  );
});

StatusMonitor.displayName = 'StatusMonitor';

export default StatusMonitor;