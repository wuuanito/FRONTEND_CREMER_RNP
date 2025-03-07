// src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Building2, BarChart3, Menu,Scale,Droplets, Airplay, LogIn    } from 'lucide-react';
import { SidebarProps } from '../types';

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  return (
    <>
      <button className="mobile-toggle" onClick={toggle}>
        <Menu size={24} />
      </button>

      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={toggle} />

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
         
        <h1 className="company-name" style={{ color: 'white' }}>RIOJA NATURE PHARMA</h1>
        <div className="company-subtitle">Sistema de Control Corporativo</div>
        </div>
        
        <nav className="sidebar-nav">
        <NavLink to="/rnpconnect">
            <LogIn  strokeWidth={1.5} />
            RNP CONNECT
          </NavLink>
          <NavLink to="/softgel">
            <Box strokeWidth={1.5} />
            Softgel
          </NavLink>
          <NavLink to="/sala27">
            <Building2 strokeWidth={1.5} />
            Sala 27
          </NavLink>
          <NavLink to="/produccion">
            <BarChart3 strokeWidth={1.5} />
            Producción
          </NavLink>
          <NavLink to="/ponderales">
          <Scale strokeWidth={1.5} size={4} />
          Ponderales
          </NavLink>
          <NavLink to="/osmosis">
          <Droplets  strokeWidth={1.5} size={4} />
          Osmosis
          </NavLink>
          <NavLink to="/herramientas">
          <Airplay  strokeWidth={1.5} size={4} />
          Herramientas RPS
          </NavLink>

        </nav>
      </div>
    </>
  );
};

export default Sidebar;