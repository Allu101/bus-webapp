import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import StopLayer from './StopLayer';
import VehicleMarker from './VehicleMarker';

function BusMap({ stops, onStopSelect, selectedStop, vehiclesToDisplay, coloredVehicles, compactIcons, onVehicleSelect }) {
  const tampereCenter = [61.4978, 23.7610];

  return (
    <div className="map-wrapper">
      <MapContainer
        center={tampereCenter} 
        zoom={13}
        zoomSnap={0.75}
        zoomDelta={0.75}
        wheelPxPerZoomLevel={150}
        zoomControl={false}
        style={{ height: '100%', width: '100%', background: '#111' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &amp; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <StopLayer stops={stops} onStopSelect={onStopSelect} selectedStop={selectedStop} />

        {Object.values(vehiclesToDisplay).map((v, index) => {
          const vRef = v.vehicleRef;
          const assignedColor = coloredVehicles && coloredVehicles[vRef];
          return (
            <VehicleMarker
              key={`vehicle-${v.id}-${index}`}
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

export default BusMap;