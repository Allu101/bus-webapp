import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import StopLayer from './StopLayer';
import VehicleMarker from './VehicleMarker';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';

maplibregl.setWorkerUrl(workerUrl);

function BusMap({ stops, onStopSelect, selectedStop, vehiclesToDisplay, coloredVehicles, compactIcons, onVehicleSelect, city: cityConfig, setMapBounds }) {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={cityConfig.center} 
        zoom={13}
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={150}
        zoomControl={false}
        style={{ height: '100%', width: '100%', background: '#111' }}
      >
        <MapBoundsTracker onBoundsChange={setMapBounds} />
        <MapController center={cityConfig.center} zoom={cityConfig.zoom} />
        
        <VectorDarkTile />

        <StopLayer stops={stops} onStopSelect={onStopSelect} selectedStop={selectedStop} />

        {Object.values(vehiclesToDisplay).map((v, index) => {
          const vRef = v.tripID;
          const assignedColor = coloredVehicles && coloredVehicles[vRef];
          return (
            <VehicleMarker
              key={`vehicle-${v.id}`}
              vehicle={v}
              compactIcons={compactIcons}
              onSelect={onVehicleSelect}
              colorOverride={assignedColor}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}

function VectorDarkTile() {
  const map = useMap();

  useEffect(() => {
    const glLayer = L.maplibreGL({
      style: 'https://tiles.openfreemap.org/styles/dark',
    }).addTo(map);

    return () => {
      map.removeLayer(glLayer);
    };
  }, [map]);

  return null;
}

function MapBoundsTracker({ onBoundsChange }) {
  const map = useMapEvents({
    moveend() {
      onBoundsChange(map.getBounds());
    },
    zoomend() {
      onBoundsChange(map.getBounds());
    },
  });

  useEffect(() => {
    onBoundsChange(map.getBounds()); // Asetetaan alkuarvo heti
  }, []);

  return null;
}

function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

export default BusMap;