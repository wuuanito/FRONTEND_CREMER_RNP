import React from 'react';
import Asf3000s16 from '../components/softgel/asf3000s16';
import Asf300019 from '../components/softgel/asf300019';
import Asf30016 from '../components/softgel/asf30016';

const Sala27: React.FC = () => {
  return (
    <div className="sala-container">
<h1 className="title-card" style={{ fontSize: "2.5rem", fontWeight: 700 }}>SOFTGEL</h1>
      
      <div className="machines-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <div className="machine-card">
          <Asf3000s16 nombre="ASF-3000S16" />
        </div>

        <div className="machine-card">
          <Asf300019 nombre="ASF-3000/19" />
        </div>

        <div className="machine-card">
          <Asf30016 nombre="ASF-3000/16" />
        </div>
      </div>
    </div>
  );
};

export default Sala27;