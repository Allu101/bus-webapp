import axios from 'axios';

// Haetaan pysäkit ja esikäsitellään koordinaatit (App.jsx)
export const fetchStops = async (cityConfig) => {
  try {
    // Haetaan paikallinen stops.txt valitun kaupungin kansiosta
    const response = await fetch(`/data/${cityConfig.gtfsFolder}/stops.txt`);
    if (!response.ok) throw new Error(`Pysäkkidatan haku epäonnistui kaupungille: ${cityConfig.id}`);
    
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
    console.error(`Virhe ladattaessa pysäkkejä kaupungille ${cityConfig.id}:`, error);
    return [];
  }
};

// Haetaan linjat aakkos/numerojärjestyksessä (App.jsx)
// Apufunktio CSV-rivin parsintaan, joka käsittelee lainausmerkit ("") oikein
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
};

export const fetchLines = async (cityConfig) => {
  try {
    const response = await fetch(`/data/${cityConfig.gtfsFolder}/routes.txt`);
    if (!response.ok) return [];

    const text = await response.text();
    const rows = text.split('\n').map(row => row.replace('\r', '')).filter(Boolean);
    if (rows.length < 2) return [];

    // Otsikkorivi sarakkeiden hakemiseen
    const headers = parseCSVLine(rows[0]);
    const idIdx = headers.indexOf('route_id');
    const shortNameIdx = headers.indexOf('route_short_name');
    const colorIdx = headers.indexOf('route_color');
    const textColorIdx = headers.indexOf('route_text_color');

    const linesList = [];
    const seenShortNames = new Set(); // Estetään samojen linjojen monistuminen

    for (let i = 1; i < rows.length; i++) {
      const cols = parseCSVLine(rows[i]);
      if (cols.length <= 1) continue;

      const shortName = cols[shortNameIdx] || cols[idIdx];
      if (!shortName || seenShortNames.has(shortName)) continue;

      seenShortNames.add(shortName);

      linesList.push({
        route_id: cols[idIdx] || '',
        route_short_name: shortName,
        name: shortName, // Täydellinen yhteensopivuus vanhaan koodiin
        route_color: cols[colorIdx] || '',
      });
    }

    // Järjestetään samalla logiikalla kuin alkuperäisessä koodissa
    return linesList.sort((a, b) =>
      a.route_short_name.localeCompare(b.route_short_name, undefined, { numeric: true })
    );
  } catch (error) {
    console.error('Virhe ladattaessa linjoja routes.txt-tiedostosta:', error);
    return [];
  }
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