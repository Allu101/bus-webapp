import axios from 'axios';

// Haetaan ajoneuvot (App.jsx)
export const fetchVehicles = async () => {
  const response = await axios.get(
    '/api-nysse/journeys/api/1/vehicle-activity?exclude-fields=monitoredVehicleJourney.onwardCalls,recordedAtTime,validUntilTime,monitoredVehicleJourney.operatorRef'
  );
  return response.data?.body || [];
};

// Haetaan pysäkit ja esikäsitellään koordinaatit (App.jsx)
export const fetchStops = async (city = 'tampere') => {
  try {
    // Haetaan paikallinen stops.txt valitun kaupungin kansiosta
    const response = await fetch(`/data/${city}/stops.txt`);
    if (!response.ok) throw new Error(`Pysäkkidatan haku epäonnistui kaupungille: ${city}`);
    
    const text = await response.text();
    
    // Jaetaan teksti riveihin ja siistitään tyhjät rivit pois
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return []; // Tiedosto on tyhjä tai siinä on vain otsikko

    // Luetaan otsikkorivi ja poistetaan lainausmerkit
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
    
    // Etsitään tarvittavien sarakkeiden indeksit dynaamisesti
    const idIdx = headers.indexOf('stop_id');
    const codeIdx = headers.indexOf('stop_code');
    const nameIdx = headers.indexOf('stop_name');
    const latIdx = headers.indexOf('stop_lat');
    const lonIdx = headers.indexOf('stop_lon');

    const parsedStops = [];

    // Käydään datarivit läpi (rivi 0 oli otsikko, aloitetaan indeksistä 1)
    for (let i = 1; i < lines.length; i++) {
      // Pilkotaan rivi sarakkeisiin ja riisutaan lainausmerkit arvojen ympäriltä
      const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
      
      const lat = parseFloat(values[latIdx]);
      const lng = parseFloat(values[lonIdx]);

      // Varmistetaan, että koordinaatit ovat valideja numeroita ennen lisäystä
      if (!isNaN(lat) && !isNaN(lng)) {
        parsedStops.push({
          id: values[idIdx],
          // TÄRKEÄ: Mäppäätään stop_code -> shortName, jotta CircleMarker löytää avaimen!
          shortName: values[codeIdx] || values[idIdx], 
          name: values[nameIdx],
          lat: lat,
          lng: lng
        });
      }
    }

    return parsedStops;
  } catch (error) {
    console.error(`Virhe ladattaessa pysäkkejä kaupungille ${city}:`, error);
    return [];
  }
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