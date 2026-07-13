import React from 'react';
import { delayColor, formatDelay, parseDelaySeconds } from '../utils/vehicleHelpers.js'; // Olettaen että siirrät apufunktiot tänne, tai tuot ne mistä haluat

function VehicleSidebar({ vehicle, onClose }) {
  const lineId = vehicle.lineNumber;
  const vehicleId = vehicle.id.split('_').pop();
  const speed = vehicle.speed;
  const delaySeconds = parseDelaySeconds(vehicle.delay || '-1');
  const delayText = formatDelay(vehicle.delay || '-1');

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>Linja {lineId}</h2>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(30px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ marginBottom: '15px', background: '#101f33', padding: '15px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#8eb3ff' }}>Ajoneuvon tunnus</p>
          <strong style={{ fontSize: '18px' }}>#{vehicleId}</strong>
        </div>

        <div style={{ marginBottom: '15px', background: '#101f33', padding: '15px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#8eb3ff' }}>Nopeus</p>
          <strong style={{ fontSize: '18px' }}>{speed ?? '-'} km/h</strong>
        </div>

        <div style={{ marginBottom: '15px', background: '#101f33', padding: '15px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#8eb3ff' }}>Aikataulutilanne</p>
          {delayText ? (
            <strong style={{ fontSize: '18px', color: delayColor(delaySeconds) }}>
              {delaySeconds > 0 ? 'Myöhässä: ' : 'Etuajassa: '} {delayText} s
            </strong>
          ) : (
            <strong style={{ fontSize: '18px', color: '#fff' }}>xxAikataulussa</strong>
          )}
        </div>

        {/* Tänne voisi myöhemmin lisätä esim. seuraavat pysäkit jos API antaa ne */}
      </div>
    </div>
  );
}

export default VehicleSidebar;