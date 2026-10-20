const DEFAULT_URL = "/digitransit/routing/v2/waltti/gtfs/v1/";
const HSL_URL = "/digitransit/routing/v2/hsl/gtfs/v1/";
const FIN_URL = "/digitransit/routing/v2/finland/gtfs/v1/";

const getRoutingUrl = (cityConfig) => (
  cityConfig.routingEndpoint === 'finland' ? FIN_URL : (cityConfig.id === 'helsinki' ? HSL_URL : DEFAULT_URL)
);

export const fetchStopSchedule = async (stopCode, cityConfig) => {
  // Digitransit käyttää Waltti-alueella pysäkkikoodeissa etuliitettä, esim. "Tampere:3022"
  // Jos stopCode on pelkkä numero, lisätään etuliite automaattisesti
  const cleanCode = String(stopCode).trim();
  const fullStopId = stopCode.includes(':') ? cleanCode : `${cityConfig.gtfsFolder}:${cleanCode}`;

  const query = `
    query GetStopSchedule($id: String!) {
      stop(id: $id) {
        name
        code
        vehicleMode
        routes {
          shortName
          mode
          gtfsId
          color
          textColor
        }
        stoptimesWithoutPatterns(numberOfDepartures: 45) {
          scheduledDeparture
          realtimeDeparture
          realtime
          realtimeState
          headsign
          trip {
            gtfsId
            directionId
            route {
              shortName
              mode
              color
              textColor
            }
            stoptimes {
              scheduledDeparture
            }
          }
        }
      }
    }
  `;

  const routingUrl = getRoutingUrl(cityConfig);

  try {
    const response = await fetch(routingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: fullStopId }
      })
    });

    const json = await response.json();

    const stop = json.data?.stop || null;
    if (!stop) {
      return null;
    }

    return ({
      name: stop.name,
      routes: (stop.routes || []).map(r => ({
        shortName: r.shortName,
        mode: r.mode,
        gtfsId: r.gtfsId,
        color: r.color,
        textColor: r.textColor
      })),
      stoptimesWithoutPatterns: stop.stoptimesWithoutPatterns.map(s => ({
        scheduledDeparture: s.scheduledDeparture,
        realtimeDeparture: s.realtimeDeparture,
        realtime: s.realtime,
        realtimeState: s.realtimeState,
        headsign: s.headsign,
        line: s.trip?.route?.shortName,
        mode: s.trip?.route?.mode,
        routeColor: s.trip?.route?.color,
        routeTextColor: s.trip?.route?.textColor,
        tripId: s.trip?.gtfsId,
        directionId: s.trip?.directionId,
        originDepartureTime: s.trip?.stoptimes?.[0]?.scheduledDeparture
      }))
    });
  } catch (error) {
    console.error("Virhe haettaessa pysäkin aikatauluja:", error);
    return null;
  }
};

const decodePolyline = (encoded) => {
  const coordinates = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push([latitude / 1e5, longitude / 1e5]);
  }

  return coordinates;
};

const addFeedPrefix = (id, cityConfig) => (
  id && id.includes(':') ? id : `${cityConfig.gtfsFolder}:${id}`
);

const getPatternCoordinates = (pattern) => {
  const points = pattern?.patternGeometry?.points || pattern?.tripGeometry?.points;
  return typeof points === 'string' ? decodePolyline(points) : [];
};

const findClosestPattern = (patterns, vehicle) => {
  const candidates = patterns
    .map((pattern) => ({ pattern, coordinates: getPatternCoordinates(pattern) }))
    .filter(({ coordinates }) => coordinates.length > 1);

  if (!candidates.length) return null;

  return candidates.reduce((closest, candidate) => {
    const distance = candidate.coordinates.reduce((min, [lat, lng]) => (
      Math.min(min, (lat - vehicle.lat) ** 2 + (lng - vehicle.lng) ** 2)
    ), Infinity);
    return distance < closest.distance ? { ...candidate, distance } : closest;
  }, { distance: Infinity });
};

export const fetchVehicleRoute = async (vehicle, cityConfig, signal) => {
  const fetchGraphQL = async (query, variables) => {
    const response = await fetch(getRoutingUrl(cityConfig), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal,
    });

    if (!response.ok) throw new Error(`Reitin haku epäonnistui (${response.status})`);

    const json = await response.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return json.data;
  };

  let patterns = [];

  if (vehicle.tripID && !vehicle.tripIdIsSynthetic) {
    const data = await fetchGraphQL(`
      query GetVehicleTripPattern($id: String!) {
        trip(id: $id) {
          tripGeometry { points }
          stops { name lat lon }
        }
      }
    `, { id: addFeedPrefix(vehicle.tripID, cityConfig) });

    if (data?.trip?.tripGeometry) {
      patterns = [{ tripGeometry: data.trip.tripGeometry, stops: data.trip.stops }];
    }
  }

  if (!patterns.length && vehicle.routeId) {
    const data = await fetchGraphQL(`
      query GetVehicleRoutePatternsById($id: String!) {
        route(id: $id) {
          patterns {
            patternGeometry { points }
            stops { name lat lon }
          }
        }
      }
    `, { id: addFeedPrefix(vehicle.routeId, cityConfig) });

    patterns = data?.route?.patterns || [];
  }

  if (!patterns.length && vehicle.lineNumber) {
    const data = await fetchGraphQL(`
      query GetVehicleRoutePatterns($id: String!) {
        routes(name: $id) {
          gtfsId
          patterns {
            patternGeometry { points }
            stops { name lat lon }
          }
        }
      }
    `, { id: vehicle.lineNumber });

    const routes = data?.routes || [];
    patterns = routes.flatMap((route) => route.patterns || []);
  }

  const selectedPattern = findClosestPattern(patterns, vehicle);
  if (!selectedPattern) return null;

  return {
    coordinates: selectedPattern.coordinates,
    stops: (selectedPattern.pattern.stops || [])
      .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lon))
      .map((stop) => ({ name: stop.name, position: [stop.lat, stop.lon] })),
  };
};

/**
 * Apufunktio, joka muuttaa sekunnit vuorokauden alusta (Digitransit-muoto) 
 * luettavaksi kellonajaksi (esim. 53100 -> "14:45")
 */
export const formatDigitransitTime = (secondsSinceMidnight) => {
  const hours = Math.floor(secondsSinceMidnight / 3600) % 24;
  const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};