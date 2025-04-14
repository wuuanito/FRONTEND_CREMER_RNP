// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Sidebar from './components/Sidebar';
import Sala27 from './pages/Sala27';
import Softgel from './pages/Softgel';
import Produccion from './pages/Produccion';
import Osmosis from './pages/Osmosis';
import './styles/App.scss';
import HerramientasRps from './pages/HerramientaRps';
import Rnpconnect from './pages/Rnpconnect';

// Configuración del cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  return (
    <>
    <style>
      {`
        :root {
          --primary-color: #166534;
          --primary-light: #dcfce7;
          --text-dark: #1f2937;
          --text-light: #4b5563;
          --bg-light: #f9fafb;
          --white: #ffffff;
        }

        .main-content {
          margin-left: 240px;
          padding: 32px;
          min-height: 100vh;
          background-color: var(--bg-light);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .icon-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background-color: var(--primary-light);
          border-radius: 50%;
          margin-bottom: 24px;
        }

        .icon-circle svg {
          width: 40px;
          height: 40px;
          color: var(--primary-color);
        }

        .welcome-header h1 {
          font-size: 36px;
          color: var(--text-dark);
          margin-bottom: 16px;
        }

        .welcome-header p {
          font-size: 20px;
          color: var(--text-light);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 48px;
        }

        .card {
          background: var(--white);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: box-shadow 0.3s ease;
          cursor: pointer;
        }

        .card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background-color: var(--primary-light);
          border-radius: 8px;
        }

        .card-icon svg {
          width: 24px;
          height: 24px;
          color: var(--primary-color);
        }

        .card h3 {
          font-size: 18px;
          color: var(--text-dark);
          margin-bottom: 8px;
        }

        .card p {
          font-size: 14px;
          color: var(--text-light);
        }

        .welcome-message {
          background: var(--white);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .welcome-message h2 {
          font-size: 24px;
          color: var(--text-dark);
          margin-bottom: 16px;
        }

        .welcome-message p {
          color: var(--text-light);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          
          .main-content {
            margin-left: 200px;
          }
        }

        @media (max-width: 640px) {
          .main-content {
            margin-left: 0;
            padding: 16px;
          }
        }
      `}
    </style>

    <main className="main-content">
      <div className="container">
        {/* Welcome Header */}
        <div className="welcome-header">
          <div className="icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h1>Bienvenido al Sistema de Control</h1>
          <p>Panel de monitorización y control industrial</p>
        </div>

        {/* Quick Access Cards */}
        <div className="cards-grid">
          {/* Monitoring Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
            </div>
            <h3>Monitorización</h3>
            <p>Accede al sistema de monitorización en tiempo real</p>
          </div>

          {/* Control Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
                </svg>
              </div>
            </div>
            <h3>Control</h3>
            <p>Gestiona y controla los sistemas de producción</p>
          </div>

          {/* Status Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
            </div>
            <h3>Estado</h3>
            <p>Revisa el estado general de los sistemas</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="welcome-message">
          <h2>Sistema de Control Corporativo</h2>
          <p>
            Seleccione una de las opciones anteriores para comenzar a utilizar el sistema 
            de monitorización y control. Para acceder a una sección específica, 
            utilice el menú de navegación situado a la izquierda.
          </p>
        </div>
      </div>
    </main>
  </>

  );
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };

    // Establecer estado inicial
    handleResize();

    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', handleResize);

    // Limpiar listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
<HashRouter>
<div className="app-container">
          <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
          <main className={`main-content ${sidebarOpen ? 'shifted' : ''}`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sala27" element={<Sala27 />} />
              <Route path="/softgel" element={<Softgel />} />
              <Route path="/produccion" element={<Produccion />} />
              <Route path="/osmosis" element={<Osmosis />} />
              <Route path="/herramientas" element={<HerramientasRps />} />
              <Route path="/rnpconnect" element={<Rnpconnect />} />

            </Routes>
          </main>
        </div>
        </HashRouter>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;
