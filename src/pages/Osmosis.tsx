import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Activity, Droplet, Mail,ServerCrash, AlertCircle, Heater, Clock, WifiIcon, RefreshCw, Globe2, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import bwtLogo from './bwt.png';  // Importamos el logo

// Types
type SignalKey = 'lowWaterTank' | 'phAlarm' | 'dosingOperation' | 'inhibitRegeneration' | 'bwtAlarm' | 'pumpStop';
interface SignalStates {
  lowWaterTank: boolean;
  phAlarm: boolean;
  dosingOperation: boolean;
  inhibitRegeneration: boolean;
  bwtAlarm: boolean;
  pumpStop: boolean;
}

interface WSMessage {
  timestamp: string;
  lowWaterTank: boolean;
  phAlarm: boolean;
  dosingOperation: boolean;
  inhibitRegeneration: boolean;
  bwtAlarm: boolean;
  pumpStop: boolean;
}


interface AlertConfig {
  key: SignalKey;
  label: string;
  icon: React.ElementType;
  description: string;
  bgColor: string;
  activeColor: string;
  inverse?: boolean; // Añadida la propiedad inverse como opcional

}
interface LogEntry {
  id: number;
  timestamp: string;
  event: string;
  status: string;
  type: 'error' | 'warning' | 'success' | 'info';
}
interface NotificationMessage {
  id: string;
  type: 'error' | 'warning' | 'success' | 'alert';
  message: string;
  timestamp: number;
}

// Configuration
const CONFIG = {
  ws: {
    url: 'ws://192.168.20.103:8765',
    logsUrl: 'http://192.168.11.19:8000/api/signals/history',
    initialReconnectDelay: 1000,
    maxReconnectDelay: 30000,
    reconnectBackoffMultiplier: 1.5,
    maxReconnectAttempts: 10,
    pingInterval: 30000,
    pongTimeout: 5000,
  },
  notifications: {
    maxNotifications: 5,
    displayDuration: 5000,
  },
  logs: {
    fetchInterval: 60000, // Fetch logs every minute
    maxEntries: 100,
    pageSize: 10,
  },
  alerts: [
    {
      key: 'lowWaterTank',
      label: 'Depósito de Agua Bajo',
      icon: AlertCircle,
      description: 'Nivel bajo en depósito de agua',
      bgColor: '#fef2f2',
      activeColor: '#dc2626'
    },
    {
      key: 'phAlarm',
      label: 'Alarma Ph/fx',
      icon: ServerCrash,
      description: 'Alarma de pH fuera de rango',
      bgColor: '#faf5ff',
      activeColor: '#7c3aed'
    },
    {
      key: 'dosingOperation',
      label: 'Funcionamiento Dosificación',
      icon: Droplet,
      description: 'Estado de operación de dosificación',
      bgColor: '#f0fdf4',
      activeColor: '#16a34a'
    },
    {
      key: 'inhibitRegeneration',
      label: 'INHIBIT Regeneración',
      icon: Activity,
      description: 'Inhibición de regeneración activa',
      bgColor: '#fefce8',
      activeColor: '#d97706'
    },

    {
      key: 'pumpStop',
      label: 'Parada de Bomba',
      icon: Heater,
      description: 'Estado de parada de la bomba',
      bgColor: '#fef2f2',
      activeColor: '#dc2626'
    }
  ] as AlertConfig[]
  } as const;
  
// WebSocket Service
class StableWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectDelay: number = CONFIG.ws.initialReconnectDelay;
  private reconnectTimeoutId: number | null = null;
  private pingIntervalId: number | null = null;
  private pongTimeoutId: number | null = null;
  private forceClosed = false;
  private isComponentMounted = true;

  constructor(
    private url: string,
    private onMessage: (event: MessageEvent) => void,
    private onStatusChange: (status: string) => void,
    private onReconnectAttempt: (attempts: number) => void
  ) {}

  public connect(): void {
    if (this.ws?.readyState === WebSocket.CONNECTING) return;

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
      this.onStatusChange('Conectando...');
    } catch (error) {
      this.handleError(error);
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      if (!this.isComponentMounted) return;
      
      this.onStatusChange('Conectado');
      this.reconnectAttempts = 0;
      this.reconnectDelay = CONFIG.ws.initialReconnectDelay;
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      if (event.data === 'pong') {
        this.handlePong();
      } else {
        this.onMessage(event);
      }
    };

    this.ws.onerror = () => {
      this.handleError(new Error('Error de conexión WebSocket'));
    };

    this.ws.onclose = () => {
      this.cleanup();
      if (!this.forceClosed) {
        this.scheduleReconnect();
      }
    };
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingIntervalId = window.setInterval(() => {
      this.sendPing();
    }, CONFIG.ws.pingInterval);
  }

  private stopPingInterval(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private sendPing(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send('ping');
      this.pongTimeoutId = window.setTimeout(() => {
        this.handlePongTimeout();
      }, CONFIG.ws.pongTimeout);
    }
  }

  private handlePong(): void {
    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }
  }

  private handlePongTimeout(): void {
    this.onStatusChange('Timeout - Reconectando...');
    this.reconnect();
  }

  private handleError(error: any): void {
    console.error('Error WebSocket:', error);
    this.onStatusChange('Error - Reconectando...');
    this.reconnect();
  }

  private scheduleReconnect(): void {
    if (!this.isComponentMounted) return;
    
    if (this.reconnectAttempts >= CONFIG.ws.maxReconnectAttempts) {
      this.onStatusChange('Error de conexión - Recargar página');
      return;
    }

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnect();
    }, this.reconnectDelay);

    this.reconnectDelay = Math.min(
      this.reconnectDelay * CONFIG.ws.reconnectBackoffMultiplier,
      CONFIG.ws.maxReconnectDelay
    );
  }

  private reconnect(): void {
    if (!this.isComponentMounted) return;
    
    this.cleanup();
    this.reconnectAttempts++;
    this.onReconnectAttempt(this.reconnectAttempts);
    this.connect();
  }

  private cleanup(): void {
    this.stopPingInterval();
    
    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  public disconnect(): void {
    this.isComponentMounted = false;
    this.forceClosed = true;
    this.cleanup();
  }
}


// Memoized Components
const StatusIndicator = memo<{ active: boolean }>(({ active }) => (
  <div className={`status-indicator ${active ? 'active' : ''}`} />
));
StatusIndicator.displayName = 'StatusIndicator';

const AlertPanel = memo<{ config: AlertConfig; active: boolean }>(({ config, active }) => {
  const Icon = config.icon;
  
  return (
    <div className={`alert-panel ${active ? 'active' : ''}`}
         style={{
           backgroundColor: active ? config.activeColor : config.bgColor,
           color: active ? '#ffffff' : '#000000',
         }}>
      <StatusIndicator active={active} />
      <Icon size={24} />
      <div className="alert-content">
        <div className="alert-title">{config.label}</div>
        <div className="alert-description">{config.description}</div>
      </div>
    </div>
  );
});
AlertPanel.displayName = 'AlertPanel';
const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="notification-icon" size={20} />;
    case 'success':
      return <CheckCircle className="notification-icon" size={20} />;
    case 'warning':
      return <AlertTriangle className="notification-icon" size={20} />;
    case 'alert':
      return <Info className="notification-icon" size={20} />;
    default:
      return null;
  }
};


const NotificationPanel = memo<{ notifications: NotificationMessage[] }>(({ notifications }) => (
  <div className="notification-panel">
    {notifications.map((notification) => (
      <div
        key={notification.id}
        className={`notification-item ${notification.type}`}
      >
        <div className="notification-content">
          <NotificationIcon type={notification.type} />
          <div className="notification-message">{notification.message}</div>
        </div>
        <button className="notification-close">
          <X size={16} />
        </button>
      </div>
    ))}
    <style>{`
      .notification-panel {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 50;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 380px;
        width: calc(100% - 2rem);
      }

      .notification-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-radius: 10px;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        animation: slideIn 0.3s ease-out;
        border-left: 4px solid;
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
      }

      .notification-message {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1e293b;
        line-height: 1.4;
        margin-right: 0.5rem;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .notification-close {
        padding: 0.25rem;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
      }

      .notification-close:hover {
        background: #f1f5f9;
        opacity: 1;
      }

      /* Estilos por tipo */
      .notification-item.error {
        border-left-color: #ef4444;
      }
      .notification-item.error .notification-icon {
        color: #ef4444;
      }

      .notification-item.success {
        border-left-color: #10b981;
      }
      .notification-item.success .notification-icon {
        color: #10b981;
      }

      .notification-item.warning {
        border-left-color: #f59e0b;
      }
      .notification-item.warning .notification-icon {
        color: #f59e0b;
      }

      .notification-item.alert {
        border-left-color: #3b82f6;
      }
      .notification-item.alert .notification-icon {
        color: #3b82f6;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .notification-item.fade-out {
        animation: fadeOut 0.3s ease-out forwards;
      }

      @media (max-width: 768px) {
        .notification-panel {
          top: 0.5rem;
          right: 0.5rem;
          left: 0.5rem;
          width: auto;
        }

        .notification-item {
          padding: 0.75rem;
        }

        .notification-message {
          font-size: 0.8125rem;
        }
      }
    `}</style>
  </div>
));

NotificationPanel.displayName = 'NotificationPanel';

const LogsPanel = memo<{ logs: LogEntry[], error?: string }>(({ logs, error }) => (

  
  <div className="logs-panel">
  <div className="logs-header">
    <h3 className="logs-title">
      Registros del Sistema
      <Clock className="icon" size={20} />
    </h3>
  </div>

  {error ? (
    <div className="error-message">
      {error}
    </div>
  ) : (
    <div className="logs-wrapper">
      <div className="logs-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Señal</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className={`log-entry ${log.type}`}>
                  <td className="date-cell">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="event-cell">
                    <div className="event-content">
                      {log.event}
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${log.type}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="empty-message">
                  No hay registros disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
        )}


    <style>{`
      .logs-panel {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 20px 0;
        overflow: hidden;
      }

      .logs-header {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .logs-title {
        color: #1e40af;
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .logs-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .logs-container {
        max-height: 500px;
        overflow: auto;
        position: relative;
      }

      .logs-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        min-width: 600px;
      }

      .logs-table thead {
        position: sticky;
        top: 0;
        z-index: 1;
        background: #f9fafb;
      }

      .logs-table th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        color: #4b5563;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e5e7eb;
      }

      .logs-table td {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 14px;
      }

      .date-cell {
        white-space: nowrap;
        width: 180px;
      }

      .event-cell {
        min-width: 200px;
      }

      .event-content {
        word-break: break-word;
        max-width: 400px;
      }

      .status-cell {
        white-space: nowrap;
        width: 120px;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        display: inline-block;
      }

      .log-entry:hover {
        background-color: #f9fafb;
      }

      .log-entry.error {
        color: #dc2626;
      }

      .log-entry.warning {
        color: #d97706;
      }

      .log-entry.success {
        color: #16a34a;
      }

      .log-entry.info {
        color: #2563eb;
      }

      .status-badge.error {
        background-color: #fef2f2;
      }

      .status-badge.warning {
        background-color: #fffbeb;
      }

      .status-badge.success {
        background-color: #f0fdf4;
      }

      .status-badge.info {
        background-color: #eff6ff;
      }

      .empty-message {
        text-align: center;
        color: #6b7280;
        padding: 24px;
      }

      .error-message {
        padding: 16px;
        color: #dc2626;
        background-color: #fef2f2;
      }

      .scroll-indicator {
        height: 2px;
        background-color: #e5e7eb;
        position: relative;
      }

      .scroll-progress {
        height: 100%;
        background-color: #3b82f6;
        width: 0;
        transition: width 0.2s;
      }

      /* Estilos responsivos */
      @media screen and (max-width: 768px) {
        .logs-container {
          margin: 0 -16px;
        }

        .logs-table {
          font-size: 13px;
        }

        .logs-table td, 
        .logs-table th {
          padding: 10px 12px;
        }

        .date-cell {
          width: 140px;
        }

        .event-content {
          max-width: 200px;
        }

        .status-cell {
          width: 100px;
        }
      }

      @media screen and (max-width: 480px) {
        .logs-panel {
          margin: 10px 0;
          border-radius: 0;
        }

        .date-cell {
          width: 120px;
        }

        .event-content {
          max-width: 150px;
        }

        .status-badge {
          padding: 2px 6px;
          font-size: 11px;
        }
      }
    `}</style>
  </div>
));

LogsPanel.displayName = 'LogsPanel';

const OsmosisMonitor: React.FC = () => {
   // All useState hooks need to be called first and in the same order
   const [signals, setSignals] = useState<SignalStates>({
    lowWaterTank: false,
    phAlarm: false,
    dosingOperation: false,
    inhibitRegeneration: false,
    bwtAlarm: false,
    pumpStop: false
  });
  const [connectionStatus, setConnectionStatus] = useState<string>('Iniciando...');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [, setIsLoadingLogs] = useState<boolean>(true);
  
  // Refs after state
  const wsRef = useRef<StableWebSocket | null>(null);
  const isComponentMounted = useRef(true);
  const addNotification = useCallback((type: NotificationMessage['type'], message: string) => {
    if (!isComponentMounted.current) return;

    const notification: NotificationMessage = {
      id: Math.random().toString(36).substring(2),
      type,
      message,
      timestamp: Date.now(),
    };

    setNotifications(prev => {
      const newNotifications = [notification, ...prev].slice(0, CONFIG.notifications.maxNotifications);
      return newNotifications.sort((a, b) => b.timestamp - a.timestamp);
    });

    setTimeout(() => {
      if (isComponentMounted.current) {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }
    }, CONFIG.notifications.displayDuration);
  }, []);


  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      if (message) {
        const newSignals: SignalStates = {
          // Invertimos la lógica para lowWaterTank y pumpStop
          lowWaterTank: !message.lowWaterTank,  // Se activa cuando es false
          pumpStop: !message.pumpStop,          // Se activa cuando es false
          // El resto se mantiene igual
          phAlarm: message.phAlarm || false,
          dosingOperation: message.dosingOperation || false,
          inhibitRegeneration: message.inhibitRegeneration || false,
          bwtAlarm: message.bwtAlarm || false
        };
        
        setSignals(prevSignals => {
          // Manejo de notificaciones
          Object.entries(newSignals).forEach(([key, value]) => {
            if (value !== prevSignals[key as SignalKey]) {
              const alertConfig = CONFIG.alerts.find(alert => alert.key === key);
              if (alertConfig && value) {
                // Para las señales inversas, ajustamos el mensaje
                const isInverseSignal = key === 'lowWaterTank' || key === 'pumpStop';
                const description = isInverseSignal ? alertConfig.description : alertConfig.description;
                addNotification('alert', `${alertConfig.label}: ${description}`);
              }
            }
          });
          
          return newSignals;
        });
  
        setLastUpdate(message.timestamp);
      }
    } catch (error) {
      console.error('Error en mensaje:', error);
      addNotification('error', 'Error al procesar mensaje del servidor');
    }
  }, [addNotification]);
  const fetchLogs = useCallback(async () => {
    if (!isComponentMounted.current) return;
  
    try {
      setIsLoadingLogs(true);
      const response = await fetch(CONFIG.ws.logsUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // El backend ya devuelve los logs en el formato correcto
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      addNotification('error', 'Error al cargar los registros del sistema');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [addNotification]);

  useEffect(() => {
    isComponentMounted.current = true;
    
    wsRef.current = new StableWebSocket(
      CONFIG.ws.url,
      handleMessage,
      setConnectionStatus,
      setReconnectAttempts
    );
    wsRef.current.connect();

    return () => {
      isComponentMounted.current = false;
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [handleMessage]);
  useEffect(() => {
    // Initial fetch
    fetchLogs();
    
    // Set up interval
    const interval = setInterval(fetchLogs, CONFIG.logs.fetchInterval);
    
    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [fetchLogs]);
  return (
    <div className="osmosis-container">
        <style>{`
        .osmosis-container {
          min-height: 100vh;
          background: #f8fafc;
          padding: 1rem;
          display: flex;
          justify-content: center;
        }

        .monitor-panel {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          max-width: 1200px;
          width: 100%;
          margin: 0.5rem auto;
        }

        .monitor-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .title-logo {
          height: 36px;
          width: auto;
        }

        .monitor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .alerts-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .alert-panel {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          min-height: 64px;
        }

        .alert-panel:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .alert-panel.active {
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e2e8f0;
          transition: all 0.2s ease;
        }

        .status-indicator.active {
          background: currentColor;
          box-shadow: 0 0 0 3px rgba(currentColor, 0.15);
          animation: pulse 2s infinite;
        }

        .alert-content {
          flex: 1;
          min-width: 0;
        }

        .alert-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: inherit;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .alert-description {
          font-size: 0.8rem;
          color: inherit;
          opacity: 0.85;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-panel {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
        }

        .status-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 0.75rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .status-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .status-item.success {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .status-item.error {
          background: #fef2f2;
          border-color: #fca5a5;
        }

        .status-item.warning {
          background: #fffbeb;
          border-color: #fcd34d;
        }

        .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .status-details {
          flex: 1;
          min-width: 0;
        }

        .status-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 0.125rem;
        }

        .status-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .server-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(currentColor, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(currentColor, 0); }
          100% { box-shadow: 0 0 0 0 rgba(currentColor, 0); }
        }

        @media (max-width: 768px) {
          .monitor-grid {
            grid-template-columns: 1fr;
          }
          
          .monitor-panel {
            padding: 1rem;
            margin: 0.25rem;
          }
          
          .monitor-title {
            font-size: 1.25rem;
          }

          .title-logo {
            height: 28px;
          }
        }
      `}</style>

        <div className="monitor-panel">
          <h2 className="monitor-title">
          <img 
            src={bwtLogo} 
            alt="BWT Logo" 
            className="title-logo"
          />
            Sistema de Monitorización Osmosis
          </h2>

          <NotificationPanel notifications={notifications} />

          <div className="monitor-grid">
            <div className="alerts-container">
              {CONFIG.alerts.map((config) => (
                <AlertPanel
                  key={config.key}
                  config={config}
                  active={signals[config.key]}
                />
              ))}
            </div>

            <div className="status-panel">
          <h3 className="status-title">
            <Globe2 size={24} />
            Estado del Sistema
          </h3>
          
          <div className="status-content">
            <div className={`status-item ${connectionStatus.includes('Error') ? 'error' : connectionStatus === 'Conectado' ? 'success' : 'warning'}`}>
              <div className="status-icon">
                <WifiIcon size={20} />
              </div>
              <div className="status-details">
                <div className="status-label">Estado de Conexión</div>
                <div className="status-value">{connectionStatus}</div>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon">
                <Clock size={20} />
              </div>
              <div className="status-details">
                <div className="status-label">Última Actualización</div>
                <div className="status-value">
                  {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Sin actualizaciones'}
                </div>
              </div>
            </div>
            
            <div className={`status-item ${reconnectAttempts > 0 ? 'warning' : 'success'}`}>
              <div className="status-icon">
                <RefreshCw size={20} />
              </div>
              <div className="status-details">
                <div className="status-label">Intentos de Reconexión</div>
                <div className="status-value">{reconnectAttempts}/{CONFIG.ws.maxReconnectAttempts}</div>
              </div>
            </div>

            <div className="server-info">
              <div className={`status-item ${connectionStatus === 'Conectado' ? 'success' : 'warning'}`}>
                <div className="status-icon">
                  <Mail size={20} />
                </div>
                <div className="status-details">
                  <div className="status-label">Estado de Servicio</div>
                  <div className="status-value">
                    {connectionStatus === 'Conectado' ? 'Activo' : 'Desconectado'}
                  </div>
                </div>
              </div>
              
              <div className="status-item">
                <div className="status-icon">
                  <Globe2 size={20} />
                </div>
                <div className="status-details">
                  <div className="status-label">WebSocket URL</div>
                  <div className="status-value">{CONFIG.ws.url}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </div>
          
        {/* New Logs Section */}
        <LogsPanel logs={logs} />
        </div>
      </div>
    );
};

export default memo(OsmosisMonitor);