// Käytetään Map-rakennetta, koska se on optimoitu raskaaseen avain-arvo -hakuun
const dataCache = new Map();
let currentCachedCity = null;

/**
 * Ladataan ja parsitaan tiedostot muistiin. 
 * Tämä suoritetaan vain kerran sovelluksen käynnistyessä tai kaupungin vaihtuessa.
 */
export const initStaticData = async (city = 'tampere') => {
  // Jos tämän kaupungin data on jo ladattu, ei tehdä mitään
  if (dataCache.size > 0 && currentCachedCity === city) return;

  // Jos kaupunki vaihtuu, tyhjennetään vanhan kaupungin välimuisti
  if (currentCachedCity !== city) {
    dataCache.clear();
    currentCachedCity = city;
  }

  try {
    // Ladataan molemmat tiedostot rinnakkain suorituskyvyn parantamiseksi
    const [tripsResponse, routesResponse] = await Promise.all([
      fetch(`/data/${city}/trips.txt`),
      fetch(`/data/${city}/routes.txt`)
    ]);

    if (!tripsResponse.ok) throw new Error(`Trip-datan haku epäonnistui kaupungille: ${city}`);
    if (!routesResponse.ok) throw new Error(`Routes-datan haku epäonnistui kaupungille: ${city}`);

    const [tripsText, routesText] = await Promise.all([
      tripsResponse.text(),
      routesResponse.text()
    ]);
    
    // 1. Parsitaan routes.txt väliaikaiseen Map-rakenteeseen (route_id -> route_short_name)
    const routesLines = routesText.split('\n');
    const routeMap = new Map();
    
    if (routesLines.length > 0) {
      const routesHeaders = splitCsvLine(routesLines[0]).map(h => h.replace(/["\r]/g, '').trim());
      const rRouteIdx = routesHeaders.indexOf('route_id');
      const rShortNameIdx = routesHeaders.indexOf('route_short_name');
      const colorIdx = routesHeaders.indexOf('route_color');

      if (rRouteIdx !== -1 && rShortNameIdx !== -1) {
        for (let i = 1; i < routesLines.length; i++) {
          if (!routesLines[i]) continue;
          
          const cols = splitCsvLine(routesLines[i]);
          const rId = cols[rRouteIdx].replaceAll('"', '').trim();
          const rShortName = cols[rShortNameIdx].replaceAll('"', '').trim();
          const color = colorIdx === -1 ? '#1a4b8fe5' : `#${cols[colorIdx].replaceAll('"', '').trim()}`;
          routeMap.set(rId, {shortName: rShortName, color: color});
        }
      }
    }

    // 2. Parsitaan trips.txt ja haetaan siihen yhdistetty route_short_name tripCacheen
    const lines = tripsText.split('\n');
    if (lines.length === 0) return;

    // Haetaan otsikkorivi ja siivotaan lainausmerkit sekä ylimääräiset välilyönnit
    const headers = splitCsvLine(lines[0]).map(h => h.replace(/["\r]/g, '').trim());
    const tripIdx = headers.indexOf('trip_id');
    const routeIdx = headers.indexOf('route_id');

    if (tripIdx === -1 || routeIdx === -1) {
      console.error(`Puuttuvia sarakkeita kaupungin ${city} trips.txt-tiedostossa`);
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue; // Ohitetaan tyhjät rivit

      const cols = splitCsvLine(lines[i]);
      const tripId = cols[tripIdx].replaceAll('"', '').trim();
      const routeId = cols[routeIdx].replaceAll('"', '').trim();
      // Etsitään route_id:tä vastaava linjan lyhyt nimi (esim. "1" tai "10")
      const routeShortName = routeMap.get(routeId)['shortName'] || routeId;
      const routeColor = routeMap.get(routeId)['color'] || '#1a4b8fe5';
      
      // Tallennetaan välimuistiin suoraan trip_id -> linjanumero, väri
      dataCache.set(tripId, {routeName: routeShortName, color: routeColor });
    }
    console.log(`Välimuisti alustettu kaupungille: ${city}. Ladattu ${dataCache.size} trippiä linjatunnuksilla.`);
  } catch (error) {
    console.error(`Virhe alustettaessa dataa kaupungille ${city}:`, error);
  }
};

/**
 * Avustava funktio, joka pilkkoo CSV-rivin huomioiden lainausmerkit.
 * RegEx etsii pilkkuja, joiden jälkeen on parillinen määrä lainausmerkkejä (eli pilkku on lainausmerkkien ulkopuolella).
 */
const splitCsvLine = (line) => {
  return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
};

export const getRouteShortName = (tripId) => {
  if (!tripId) return null;
  return dataCache.get(tripId)['routeName'] || null;
};

export const getRouteColor = (tripId) => {
  if (!tripId) return null;
  return dataCache.get(tripId)['color'] || '#1a4b8fe5';
};