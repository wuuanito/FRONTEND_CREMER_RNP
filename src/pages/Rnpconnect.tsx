import React from 'react';
import { AlertCircle, Construction } from 'lucide-react';

const Rnpconnect: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '24px'
        }}>PROXIMAMENTE NUEVA VERSION </h1>

        {/* Development Alert */}
        <div style={{
          backgroundColor: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start'
          }}>
            <Construction style={{
              width: '20px',
              height: '20px',
              color: '#ef4444'
            }} />
            <div style={{
              marginLeft: '12px'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '500',
                color: '#991b1b'
              }}>
                Página en Desarrollo
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#b91c1c',
                marginTop: '4px'
              }}>
                Esta sección se encuentra actualmente en desarrollo. Disculpe las molestias.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          marginTop: '32px'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '16px'
          }}>Próximamente disponible</h2>
          <p style={{
            color: '#4b5563'
          }}>
            En esta sección podrás encontrar:
          </p>
          <ul style={{
            marginTop: '16px',
            listStyle: 'none',
            padding: 0
          }}>
            {['Monitoreo de producción en tiempo real', 
              'Estadísticas y métricas de rendimiento', 
              'Control de calidad y seguimiento'].map((feature, index) => (
              <li key={index} style={{
                display: 'flex',
                alignItems: 'center',
                color: '#4b5563',
                marginBottom: '8px'
              }}>
                <AlertCircle style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '8px'
                }} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Rnpconnect;