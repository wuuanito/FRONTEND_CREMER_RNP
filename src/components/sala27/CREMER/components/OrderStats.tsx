import React, { useEffect, useState } from 'react';
import { Orden } from '../types';
import { formatTime } from '../utils/formatters';
import {
  StatsContainer,
  StatsSection,
  StatsGrid,
  StatCard,
  StatLabel,
  StatValue,
  Subtitle
} from '../styles';

interface OrderStatsProps {
  orden: Orden;
}

const OrderStats: React.FC<OrderStatsProps> = ({ orden }) => {
  const [stats, setStats] = useState({
    tiempoTotal: orden.tiempoTotal,
    tiempoEfectivo: orden.tiempoTotal - orden.tiempoTotalPausas,
    porcentajeEfectivo: 0,
    tiempoPausas: orden.tiempoTotalPausas,
    pausasCompletadas: orden.pausas.filter(p => p.fin).length,
    promedioPausa: 0
  });

  useEffect(() => {
    const isValidStartDate = (date: string) => {
      const startDate = new Date(date).getTime();
      const minValidDate = new Date('2024-01-01').getTime();
      return startDate > minValidDate;
    };

    const updateInterval = setInterval(() => {
      if (!orden.horaInicio || !isValidStartDate(orden.horaInicio)) {
        setStats({
          tiempoTotal: 0,
          tiempoEfectivo: 0,
          porcentajeEfectivo: 0,
          tiempoPausas: 0,
          pausasCompletadas: 0,
          promedioPausa: 0
        });
        return;
      }

      const now = new Date().getTime();
      const start = new Date(orden.horaInicio).getTime();
      
      let total = orden.horaFin ? 
        orden.tiempoTotal : 
        Math.floor((now - start) / 1000);

      const activePause = orden.pausas.find(p => !p.fin);
      let pauseTime = orden.tiempoTotalPausas;
      
      if (activePause) {
        const pauseStart = new Date(activePause.inicio).getTime();
        pauseTime += Math.floor((now - pauseStart) / 1000);
      }

      const efectivo = Math.max(0, total - pauseTime);
      const porcentaje = total > 0 ? (efectivo / total) * 100 : 0;
      
      const pausasCompletadas = orden.pausas.filter(p => p.fin).length;
      const promedioPausa = pausasCompletadas > 0 ? 
        Math.floor(pauseTime / pausasCompletadas) : 0;

      setStats({
        tiempoTotal: total,
        tiempoEfectivo: efectivo,
        porcentajeEfectivo: porcentaje,
        tiempoPausas: pauseTime,
        pausasCompletadas,
        promedioPausa
      });
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [orden]);

  return (
    <StatsContainer>
      <StatsSection>
        <Subtitle>Métricas Principales</Subtitle>
        <StatsGrid>
          <StatCard>
            <StatLabel>Tiempo Total</StatLabel>
            <StatValue>{formatTime(stats.tiempoTotal)}</StatValue>
          </StatCard>
          
          <StatCard highlight>
            <StatLabel>Tiempo Efectivo</StatLabel>
            <StatValue>{formatTime(stats.tiempoEfectivo)}</StatValue>
          </StatCard>
          
          <StatCard>
            <StatLabel>Eficiencia</StatLabel>
            <StatValue>{stats.porcentajeEfectivo.toFixed(1)}%</StatValue>
          </StatCard>
        </StatsGrid>
      </StatsSection>

      <StatsSection>
        <Subtitle>Métricas de Pausas</Subtitle>
        <StatsGrid>
          <StatCard>
            <StatLabel>Tiempo en Pausas</StatLabel>
            <StatValue>{formatTime(stats.tiempoPausas)}</StatValue>
          </StatCard>
          
          <StatCard>
            <StatLabel>Pausas Completadas</StatLabel>
            <StatValue>{stats.pausasCompletadas}</StatValue>
          </StatCard>
          
          <StatCard>
            <StatLabel>Promedio por Pausa</StatLabel>
            <StatValue>{formatTime(stats.promedioPausa)}</StatValue>
          </StatCard>
        </StatsGrid>
      </StatsSection>
    </StatsContainer>
  );
};

export default OrderStats;