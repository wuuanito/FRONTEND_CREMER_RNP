import React, { useEffect, useState } from 'react';
import { TimerProps } from '../types';
import { formatTime } from '../utils/formatters';
import {
  TimerContainer,
  MainTimer,
  TimerValue,
  TimerLabel,
  PauseIndicator,
  StatCard,
  StatLabel,
  StatValue
} from '../styles';


export const Timer: React.FC<TimerProps> = ({ startTime, endTime, pauses }) => {
  const [elapsed, setElapsed] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);

  useEffect(() => {
    const initialStart = new Date(startTime).getTime();
    if (isNaN(initialStart)) {
      console.error('Tiempo de inicio inválido');
      return;
    }

    const completedPauseTime = pauses.reduce((total, pause) => {
      if (pause.fin) {
        return total + (pause.tiempo || 0);
      }
      return total;
    }, 0);

    const activePause = pauses.find(p => !p.fin);
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = Math.min(initialStart, now);
      const end = endTime ? new Date(endTime).getTime() : now;

      let currentPauseTime = completedPauseTime;
      if (activePause) {
        const pauseStart = new Date(activePause.inicio).getTime();
        const pauseElapsed = Math.max(0, Math.floor((now - pauseStart) / 1000));
        currentPauseTime += pauseElapsed;
      }

      setPauseTime(Math.max(0, currentPauseTime));
      setElapsed(Math.max(0, Math.floor((end - start) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, pauses]);

  const effectiveTime = Math.max(0, elapsed - pauseTime);
  const activePause = pauses.find(p => !p.fin);

  return (
    <TimerContainer>
      <MainTimer>
        <TimerValue>{formatTime(effectiveTime)}</TimerValue>
        <TimerLabel>Tiempo Efectivo</TimerLabel>
        {activePause && (
          <PauseIndicator>EN PAUSA - {activePause.motivo}</PauseIndicator>
        )}
      </MainTimer>
      
      <StatCard highlight>
        <StatLabel>Tiempo Total</StatLabel>
        <StatValue>{formatTime(elapsed)}</StatValue>
      </StatCard>
      
      <StatCard>
        <StatLabel>Tiempo en Pausas</StatLabel>
        <StatValue>{formatTime(pauseTime)}</StatValue>
      </StatCard>
    </TimerContainer>
  );
};

export default Timer;