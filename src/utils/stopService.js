const DIGITRANSIT_API_KEY = "cda4855c4e444f38804af3c43e8f3c66";
const API_URL = "https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/";

export const fetchStopSchedule = async (stopCode) => {
  // Digitransit käyttää Waltti-alueella pysäkkikoodeissa etuliitettä, esim. "Tampere:3022"
  // Jos stopCode on pelkkä numero, lisätään etuliite automaattisesti
  const cleanCode = String(stopCode).trim();
  const fullStopId = stopCode.includes(':') ? cleanCode : `tampere:${cleanCode}`;

  const query = `
    query GetStopSchedule($id: String!) {
      stop(id: $id) {
        name
        code
        vehicleMode
        routes {
          shortName
          mode
        }
        stoptimesWithoutPatterns(numberOfDepartures: 35) {
          scheduledDeparture
          realtimeDeparture
          realtime
          realtimeState
          headsign
          trip {
            gtfsId
            route {
              shortName
              mode
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'digitransit-subscription-key': DIGITRANSIT_API_KEY
      },
      body: JSON.stringify({
        query,
        variables: { id: fullStopId }
      })
    });

    const json = await response.json();

    const stop = json.data?.stop || null;
    return ({
      name: stop.name,
      routes: (stop.routes || []).map(r => ({
        shortName: r.shortName,
        mode: r.mode
      })),
      stoptimesWithoutPatterns: stop.stoptimesWithoutPatterns.map(s => ({
        scheduledDeparture: s.scheduledDeparture,
        realtimeDeparture: s.realtimeDeparture,
        realtime: s.realtime,
        realtimeState: s.realtimeState,
        headsign: s.headsign,
        line: s.trip?.route?.shortName,
        mode: s.trip?.route?.mode,
        tripId: s.trip?.gtfsId
      }))
    });
  } catch (error) {
    console.error("Virhe haettaessa pysäkin aikatauluja:", error);
    return null;
  }
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