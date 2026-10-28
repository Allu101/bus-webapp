// StopLayer.jsx
import React, { useState, useCallback } from 'react';
import { CircleMarker, useMapEvents } from 'react-leaflet';

const StopLayer = React.memo(({ stops, onStopSelect, selectedStop }) => {
  const [currentZoom, setCurrentZoom] = useState(13);

  // Kuunnellaan kartan zoomausta ja päivitetään tila
  const map = useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    },
  });

  const handleStopClick = useCallback((stop) => {
    onStopSelect(stop);
  }, [onStopSelect]);

  const MIN_ZOOM_FOR_STOPS = 14;

  if (currentZoom < MIN_ZOOM_FOR_STOPS) {
    return null; // Ei renderöidä mitään, jos ollaan liian kaukana
  }

  return (
    <>
      {stops.map((stop) => {
        return (
          <React.Fragment key={stop.shortName}>
            <CircleMarker
              center={[stop.lat, stop.lng]}
              radius={selectedStop === stop ? 9 : 8}
              pane="markerPane"
              pathOptions={{ color: '#3f6fe8', opacity: 0.45, fillColor: '#3f6fe8', fillOpacity: selectedStop === stop ? 0.65 : 0.35 }}
              eventHandlers={{
                click: () => handleStopClick(stop)
              }}
            />
            <CircleMarker
              center={[stop.lat, stop.lng]}
              radius={selectedStop === stop ? 11 : 10}
              className="stop-hit-area"
              pathOptions={{ color: 'transparent', opacity: 0, fillColor: 'transparent', fillOpacity: 0 }}
              eventHandlers={{
                click: () => handleStopClick(stop)
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
});

export default StopLayer;