import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import { createVehicleIcon, formatDelay, parseDelaySeconds, getHeadingDegrees } from '../utils/vehicleHelpers';
import { getRouteShortName } from '../utils/fileManager';

const VehicleMarker = memo(function VehicleMarker({ vehicle, onSelect, compactIcons, colorOverride }) {
  const lat = vehicle.lat;
  const lng = vehicle.lng;

  if (!lat || !lng) {
    return null;
  }

  const map = useMap();

  const initialPosRef = useRef([lat, lng]);
  const markerRef = useRef(null);
  
  // Pidetään kirjaa animaation alusta, lopusta ja nykyhetkestä
  const startPosRef = useRef([lat, lng]);
  const targetPosRef = useRef([lat, lng]);
  const currentPosRef = useRef([lat, lng]);
  
  const animStartTimeRef = useRef(null);
  const animationRef = useRef(null);

  const ANIM_KESTO = 850; // ms

  // 1. Kun uudet koordinaatit saapuvat (lat/lng muuttuu):
  useEffect(() => {
    startPosRef.current = currentPosRef.current;
    targetPosRef.current = [lat, lng];
    // Nollataan aloitusaika (saadaan animaatiosilmukasta)
    animStartTimeRef.current = performance.now();
  }, [lat, lng]);

  // 2. Animaatiosilmukka (pyörii taustalla)
  useEffect(() => {
    const animoi = (nyt) => {
      if (animStartTimeRef.current !== null) {
        const kulunutAika = nyt - animStartTimeRef.current;
        // Progress on välillä 0.0 (alussa) ja 1.0 (valmis)
        const progress = Math.max(0, Math.min(kulunutAika / ANIM_KESTO, 1));

        const [startLat, startLng] = startPosRef.current;
        const [targetLat, targetLng] = targetPosRef.current;

        // Puhdas matemaattinen LERP (Täysin suora koordinaattilinja)
        const currentLat = startLat + (targetLat - startLat) * progress;
        const currentLng = startLng + (targetLng - startLng) * progress;
        currentPosRef.current = [currentLat, currentLng];

        if (markerRef.current) {
          const marker = markerRef.current;
          const icon = marker._icon;
          
          if (icon) {
            // Ohitetaan Leafletin Math.round()
            // 1. Haetaan absoluuttinen projektio desimaaleina (ei pyöristystä)
            const projected = map.project([currentLat, currentLng]);
            // 2. Haetaan nykyisen karttanäkymän nollapiste
            const origin = map.getPixelOrigin();
            
            // 3. Lasketaan täsmällinen paikka näytöllä alipikseleinä
            const subpixelX = projected.x - origin.x;
            const subpixelY = projected.y - origin.y;
            
            // 4. Siirretään ikonia suoraan DOM-tasolla (GPU-kiihdytetty subpixel-renderöinti)
            icon.style.transform = `translate3d(${subpixelX}px, ${subpixelY}px, 0px)`;
            
            // 5. Jos käytät Leafletin varjoja, siirretään myös se
            if (marker._shadow) {
              marker._shadow.style.transform = `translate3d(${subpixelX}px, ${subpixelY}px, 0px)`;
            }
            
            // 6. Pidetään Leaflet taustalla tietoisena bussin sijainnista (ilman renderöintiä)
            marker._latlng = L.latLng(currentLat, currentLng);
          }
        }
      }

      animationRef.current = requestAnimationFrame(animoi);
    };

    animationRef.current = requestAnimationFrame(animoi);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [map]);

  const tripId = vehicle.tripID;
  const lineId = vehicle.lineRef || '-';
  const vehicleId = vehicle.id.split('_').pop();
  const speed = vehicle.speed;
  const lineNumber = vehicle.lineNumber;

  const delaySeconds = parseDelaySeconds(vehicle.delay);
  const delayText = formatDelay(vehicle.delay);
  const heading = getHeadingDegrees(vehicle);
  
  const icon = useMemo(() => createVehicleIcon({ 
    line: lineId, 
    lineNumber,
    tripId,
    vehicleId,
    speed, 
    delayText, 
    delaySeconds, 
    heading, 
    compactIcons,
    colorOverride
  }), [
    lineId,
    lineNumber,
    speed,
    heading,
    compactIcons,
    colorOverride
  ]);

  return (
    <Marker
      ref={markerRef}
      key={vehicle.id}
      position={initialPosRef.current} 
      icon={icon} 
      zIndexOffset={1000} 
      eventHandlers={{ 
        click: () => onSelect(vehicle) 
      }} 
    />
  );
}, (prevProps, nextProps) => {
  // 3. Vertaillaan, onko ajoneuvon sijainti, tila tai asetus muuttunut.
  // Jos tämä palauttaa true, React EI renderöi tätä bussia uudelleen (säästää prosessoria).
  const shouldNotUpdate = prevProps.vehicle.lat === nextProps.vehicle.lat &&
      prevProps.vehicle.lng === nextProps.vehicle.lng && prevProps.vehicle.speed === nextProps.vehicle.speed &&
      prevProps.compactIcons === nextProps.compactIcons && prevProps.colorOverride === nextProps.colorOverride;

  return (
    shouldNotUpdate
  );
});

export default VehicleMarker;