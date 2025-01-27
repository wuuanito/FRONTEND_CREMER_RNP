import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    (window as any).electron?.ipcRenderer.send('minimize-window');
  };

  const handleMaximize = () => {
    (window as any).electron?.ipcRenderer.send('maximize-window');
  };

  const handleClose = () => {
    (window as any).electron?.ipcRenderer.send('close-window');
  };

  return (
    <div className="title-bar bg-gray-800 h-8 flex items-center justify-between drag">
      {/* Área de arrastre */}
      <div className="flex-1 drag-region" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}></div>
      
      {/* Botones de control */}
      <div 
        className="window-controls flex items-center h-full no-drag" 
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-8 w-12 flex items-center justify-center hover:bg-gray-700 transition-colors"
        >
          <Minus className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-8 w-12 flex items-center justify-center hover:bg-gray-700 transition-colors"
        >
          <Square className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={handleClose}
          className="h-8 w-12 flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;