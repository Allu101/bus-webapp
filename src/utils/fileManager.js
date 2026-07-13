// Käytetään Map-rakennetta, koska se on optimoitu raskaaseen avain-arvo -hakuun
const tripCache = new Map();

/**
 * Ladataan ja parsitaan tiedosto muistiin. 
 * Tämä suoritetaan vain kerran sovelluksen käynnistyessä.
 */
export const initTripData = async () => {
  // Jos data on jo ladattu, ei tehdä turhaan uudestaan
  if (tripCache.size > 0) return;

  try {
    const response = await fetch('/trips.txt');
    const text = await response.text();
    
    // Jaetaan riveihin
    const lines = text.split('\n');
    if (lines.length === 0) return;

    const headers = lines[0].split(',');
    const tripIdx = headers.indexOf('trip_id');
    const routeIdx = headers.indexOf('route_id');

    // Luetaan rivit suoraan Map-muistiin erittäin kevyellä loopilla
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue; // Ohitetaan tyhjät rivit

      const cols = lines[i].split(',');
      if (cols.length > Math.max(tripIdx, routeIdx)) {
        // replaceAll on nopea tapa siivota lainausmerkit pois
        const tripId = cols[tripIdx].replaceAll('"', '').trim();
        const routeId = cols[routeIdx].replaceAll('"', '').trim();
        
        tripCache.set(tripId, routeId);
      }
    }
    console.log(`Tiedonhaku valmis: ladattiin ${tripCache.size} reittiä muistiin.`);
  } catch (error) {
    console.error('Virhe ladatessa trips.txt tiedostoa:', error);
  }
};

/**
 * Kevyt ja synkroninen hakufunktio, jota bussi-entiteetit kutsuvat.
 */
export const getRouteId = (tripId) => {
  if (!tripId) return null;
  return tripCache.get(tripId) || null;
};