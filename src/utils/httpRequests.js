import axios from 'axios';

// Haetaan ajoneuvot (App.jsx)
export const fetchVehicles = async () => {
  const response = await axios.get(
    '/api-nysse/journeys/api/1/vehicle-activity?exclude-fields=monitoredVehicleJourney.onwardCalls,recordedAtTime,validUntilTime,monitoredVehicleJourney.operatorRef'
  );
  return response.data?.body || [];
};

// Haetaan pysäkit ja esikäsitellään koordinaatit (App.jsx)
export const fetchStops = async () => {
  const response = await axios.get('/api-nysse/journeys/api/1/stop-points');
  if (!response.data?.body) return [];

  return response.data.body
    .filter(stop => stop.location)
    .map(stop => {
      const [latStr, lngStr] = stop.location.split(',');
      return {
        ...stop,
        lat: parseFloat(latStr),
        lng: parseFloat(lngStr)
      };
    })
    .filter(stop => !Number.isNaN(stop.lat) && !Number.isNaN(stop.lng));
};

// Haetaan linjat aakkos/numerojärjestyksessä (App.jsx)
export const fetchLines = async () => {
  const response = await axios.get('/api-nysse/journeys/api/1/lines');
  if (!response.data?.body) return [];

  return response.data.body.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );
};

// Haetaan pysäkkikohtainen live-data (StopSidebar.jsx syvähaku)
export const fetchLiveVehiclesForStop = async (stopUrl) => {
  const response = await axios.get('/api-nysse/journeys/api/1/vehicle-activity');
  const json = await response.data;
  if (!json.body) return [];

  return json.body.filter(v => {
    const calls = v.monitoredVehicleJourney.onwardCalls;
    return calls && calls.some(call => call.stopPointRef === stopUrl);
  });
};