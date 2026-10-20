import React, { memo, useMemo, useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import { createVehicleIcon, formatDelay, parseDelaySeconds } from '../utils/vehicleHelpers';
import { rekisteroiBussi, poistaBussi, kaynnistaBussiAnimaatio } from '../utils/animationReqistry';

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

  useEffect(() => {
    rekisteroiBussi(vehicle.id, {
      markerRef,
      startPosRef,
      targetPosRef,
      currentPosRef,
      animStartTimeRef,
    }, map);

    return () => poistaBussi(vehicle.id);
  }, [vehicle.id, map]);

  // 1. Kun uudet koordinaatit saapuvat (lat/lng muuttuu):
  useEffect(() => {
    startPosRef.current = currentPosRef.current;
    targetPosRef.current = [lat, lng];
    // Nollataan aloitusaika (saadaan animaatiosilmukasta)
    animStartTimeRef.current = performance.now();
    kaynnistaBussiAnimaatio(vehicle.id);
  }, [lat, lng]);

  const lineId = vehicle.lineRef || '-';
  const speed = vehicle.speed;
  const lineNumber = vehicle.lineNumber;

  //const delaySeconds = parseDelaySeconds(vehicle.delay);
  //const delayText = formatDelay(vehicle.delay);
  const heading = vehicle.bearing || 0;
  
  const icon = useMemo(() => createVehicleIcon({ 
    line: lineId, 
    lineNumber,
    tripId: vehicle.tripID,
    vehicleId: vehicle.id.split('_').pop(),
    speed, 
    /*delayText, 
    delaySeconds,*/
    heading, 
    compactIcons,
    colorOverride,
    vehType: vehicle.vehType
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