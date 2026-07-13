// StopLayer.jsx
import React, { useState, useCallback } from 'react';
import { CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

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
      {stops.map((stop, index) => {
        return (
          <CircleMarker
            key={stop.shortName}
            center={[stop.lat, stop.lng]}
            radius={selectedStop === stop ? 10 : 7}
            pane="markerPane"
            pathOptions={{ color: '#3f6fe8', opacity: 0.5, fillColor: '#3f6fe8', fillOpacity: selectedStop === stop ? 0.70 : 0.4 }}
            eventHandlers={{
              click: (e) => {
                handleStopClick(stop);
              }
            }}
          />
        );
      })}
    </>
  );
});

export default StopLayer;