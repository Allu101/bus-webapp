import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import { createVehicleIcon, formatDelay, parseDelaySeconds, getHeadingDegrees } from '../utils/vehicleHelpers';
import { getRouteShortName } from '../utils/fileManager';

const VehicleMarker = memo(function VehicleMarker({ vehicle, onSelect, compactIcons, colorOverride }) {
  const lat = vehicle.lat;
  const lng = vehicle.lng;

  if (!lat || !lng) {
    return null;
  }

  const [displayPos, setDisplayPos] = useState([lat, lng]);
  const markerRef = useRef(null);
  
  // Refit pitävät kirjaa reaaliaikaisista koordinaateista animaatiota varten
  const currentPosRef = useRef([lat, lng]);
  const targetPosRef = useRef([lat, lng]);
  const animationRef = useRef(null);
  const ANIM_KESTO = 2600;

  useEffect(() => {
    targetPosRef.current = [lat, lng];
  }, [lat, lng]);

  // 2. Tämä useEffect käynnistyy VAIN KERRAN ja pyörittää jatkuvaa pehmeää liikettä
  useEffect(() => {
    let viimeisinAika = new Date();// performance.now();

    const animoi = (nyt) => {
      const kulunutAika = nyt - viimeisinAika;
      
      // Lasketaan kuinka suuren osan matkasta bussi liikkuu tällä ruudulla (frame)
      // perustuen sinun määrittämääsi KESTOON.
      const step = kulunutAika / ANIM_KESTO;
      viimeisinAika = nyt;

      const [currentLat, currentLng] = currentPosRef.current;
      const [targetLat, targetLng] = targetPosRef.current;

      // Lasketaan uusi sijainti "liukumalla" kohti maalia
      // Mitä pienempi KESTO, sitä suurempi step, sitä nopeammin bussi saavuttaa maalin.
      const uusiLat = currentLat + (targetLat - currentLat) * Math.min(step, 1);
      const uusiLng = currentLng + (targetLng - currentLng) * Math.min(step, 1);

      // Päivitetään muisti ja näkymä
      currentPosRef.current = [uusiLat, uusiLng];
      const marker = markerRef.current;

      if (marker) {
          marker.setLatLng([uusiLat, uusiLng]);
      }

      // Pyydetään seuraava ruutu
      animationRef.current = requestAnimationFrame(animoi);
    };

    animationRef.current = requestAnimationFrame(animoi);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

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
      position={{lat, lng}} 
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
      prevProps.vehicle.lng === nextProps.vehicle.lng && prevProps.vehicle.speed && nextProps.vehicle.speed &&
      prevProps.compactIcons === nextProps.compactIcons && prevProps.colorOverride === nextProps.colorOverride;

  return (
    shouldNotUpdate
  );
});

export default VehicleMarker;