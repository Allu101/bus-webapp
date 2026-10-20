import L from 'leaflet';
import { getRouteColor } from './fileManager';

const COLORS = {
  bus: '#1a4b8fe5',        // Nyssen sininen busseille 1a4a8f 0f4cb5dc
  tram: '#da2128e5',       // Tampereen ratikan punainen da2128 b40006dc
  onTime: '#fff',        // Aikataulussa
  delayed: '#f18686',    // Myöhässä
  early: '#3fc93f'       // Etuajassa
};

const DELAY_BUFFER_SECONDS = 20; 
//const TRAM_LINES = ['1', '3'];

export const parseDelaySeconds = (delay) => {
  if (!delay) return null;
  const isNegative = delay.startsWith('-');
  const normalized = isNegative ? delay.slice(1) : delay;
  const match = normalized.match(/^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const totalSeconds = Math.round(hours * 3600 + minutes * 60 + seconds);
  return isNegative ? -totalSeconds : totalSeconds;
};

export const formatDelay = (delay) => {
  const value = parseDelaySeconds(delay);
  if (value === null) return null;
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : `${value}`;
};

export const delayColor = (delaySeconds) => {
  if (delaySeconds === null) return COLORS.onTime;
  if (delaySeconds > DELAY_BUFFER_SECONDS) return COLORS.delayed;
  if (delaySeconds < -DELAY_BUFFER_SECONDS) return COLORS.early;
  return COLORS.onTime;
};

export const createVehicleIcon = ({ line, lineNumber, tripId, vehicleId, speed, /*delayText, delaySeconds,*/ heading, compactIcons, colorOverride, vehType }) => {
  const rotation = heading || 0;
  const backgroundColor = getRouteColor(tripId, vehType) || '#1a4b8fe5'; // Oletusväri busseille
  //const isSmallIcon = window.innerWidth < 500;

  const size = compactIcons ? 30 : 46;
  const anchor = size / 2;

  const lineText = String(lineNumber || '');
  let lineFontSize = '18px';
  let lineMarginTop = '-1px';

  if (lineText.length === 2) {
    lineFontSize = '15px';
    lineMarginTop = '1px'; // Pieni marginaali, jotta teksti on keskitetty
  } else if (lineText.length === 3) {
    lineFontSize = '13px';  // Pienempi koko esim. "50B"
  } else if (lineText.length >= 4) {
    lineFontSize = '11px';   // Erittäin pieni koko jos on pitkä tunnus (esim. "101B")
  }


  // Generoidaan HTML sen mukaan, onko compactIcons valittuna vai ei
  const innerHTML = compactIcons 
    ? `
      <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
        <span style="font-size: ${lineFontSize}; margin-top: ${lineMarginTop}; font-weight: 600; color: #d3d3d3;">${lineNumber}</span>
      </div>
    `
    : `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 5px; line-height: 1.1; margin-bottom: 2px;">
        <span style="flex: 1; text-align: center; font-size: 16px; font-weight: 600;">${lineNumber}</span>
        <span style="text-align: left; font-size: 10px;">${speed ?? '-'}<span style="display:block; font-size: 10px; margin-top: -2px;">km/h</span></span>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
        <span style="font-size: 8px; align-self: flex-end;">#${vehicleId}</span>
      </div>
    `;

  return L.divIcon({
    className: 'moving-vehicle',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        
        <div style="
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          transform: rotate(${rotation}deg);
          transform-origin: 50% 50%;
        ">
          <div style="
            width: 100%; height: 100%;
            background-color: ${backgroundColor};
            border-radius: 50% 50% 50% ${speed > 0.5 ? '15%' : '35%'}; /* Tekee pisaran muodon */
            transform: rotate(+135deg); /* Oletuksena kärki osoittaa ylös (pohjoiseen) */
            border: ${colorOverride ? '3px solid ' + colorOverride || '#ada8a8c2' : '2px solid ' + '#ada8a8c2'};
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            box-sizing: border-box;
          "></div>
        </div>

        <div style="
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 2;
        ">
          <span style="
            color: white;
            line-height: 1;
            font-family: sans-serif;
            text-shadow: 0px 1px 2px rgba(0,0,0,0.5); /* Pieni varjo tekstiin */
            white-space: nowrap;
          ">${innerHTML}</span>
        </div>
        
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor] 
  });
};