import React, { useMemo } from 'react';
import { Orden } from '../types';
import { formatTime } from '../utils/formatters';
import { formatEventDate } from '../utils/formatters';
import {
  TimelineContainer,
  TimelineConnector,
  TimelineEvent,
  TimelineDot,
  Text
} from '../styles';

interface OrderEventsProps {
  orden: Orden;
}

const OrderEvents: React.FC<OrderEventsProps> = ({ orden }) => {
  const events = useMemo(() => {
    const eventList = [];
    
    eventList.push({
      type: 'start' as const,
      time: orden.horaInicio,
      label: 'Inicio de Orden',
      description: `Orden "${orden.nombre}" iniciada`,
      duration: null
    });

    orden.pausas.forEach(pausa => {
      eventList.push({
        type: 'pause' as const,
        time: pausa.inicio,
        label: 'Pausa Iniciada',
        description: pausa.motivo,
        duration: null
      });

      if (pausa.fin) {
        eventList.push({
          type: 'resume' as const,
          time: pausa.fin,
          label: 'Pausa Finalizada',
          description: 'Trabajo resumido',
          duration: pausa.tiempo || 0
        });
      }
    });

    if (orden.horaFin) {
      eventList.push({
        type: 'end' as const,
        time: orden.horaFin,
        label: 'Orden Finalizada',
        description: 'Trabajo completado',
        duration: orden.tiempoTotal
      });
    }

    return eventList.sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [orden]);

  return (
    <TimelineContainer>
      <TimelineConnector />
      {events.map((event, index) => (
        <TimelineEvent key={index} type={event.type}>
          <TimelineDot type={event.type} />
          <div>
            <Text style={{ fontWeight: '600' }}>{event.label}</Text>
            <Text>{event.description}</Text>
            <Text style={{ fontSize: '0.875rem', color: '#757575' }}>
              {formatEventDate(event.time)}
            </Text>
            {event.duration !== null && (
              <Text style={{ fontSize: '0.875rem', color: '#9e9e9e' }}>
                Duración: {formatTime(event.duration)}
              </Text>
            )}
          </div>
        </TimelineEvent>
      ))}
    </TimelineContainer>
  );
};

export default OrderEvents;