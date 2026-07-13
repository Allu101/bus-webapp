import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import mqtt from 'mqtt';

const WalttiAlerts = () => {
  const [vehicles, setvehicles] = useState([]);
  const [error, setError] = useState(null);

  const [bussit, setBussit] = useState({});
  const [yhteysAuki, setYhteysAuki] = useState(false);

  useEffect(() => {
    // Digitransitin WSS-osoite toimii suoraan selaimessa viteseillä
    //const MQTT_URL = 'wss://mqtt.hsl.fi:443/';
    const MQTT_URL = 'wss://mqtt.digitransit.fi:443/';
    
    console.log('Yhdistetään MQTT-palvelimeen...');
    const client = mqtt.connect(MQTT_URL);

    client.on('connect', () => {
      setYhteysAuki(true);
      // Tilataan haluttu kanava. Voit käyttää esim. /hfp/v2/journey/ongoing/vp/bus/#
      // Jos haluat säästää kaistaa, voit korvata 'bus' -> 'tram' tai rajata tarkemmin.
      //const topic = '/hfp/v2/journey/ongoing/vp/bus/#';
      const topic = '/gtfsrt/vp/tampere/#'
      
      client.subscribe(topic, (err) => {
        if (!err) console.log(`Tilattu kanava: ${topic}`);
      });
    });

    client.on('message', (topic, message) => {
      try {
        // TÄRKEÄÄ: Pura viesti Protobuf-formaatista tekstin sijaan!
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(message));
        
        // Digitransit lähettää jokaisen päivityksen "entity"-listana
        feed.entity.forEach((entity) => {
          if (entity.vehicle) {
            const v = entity.vehicle;
            const reitti = v.trip?.routeId; // Linjan tunnus, esim. "8A"
            const bussiId = v.vehicle?.id;  // Bussin oma ID
            const label = v.vehicle?.label;
            
            // Suodatetaan vain linja 8A
            if (bussiId) {
              setBussit((prev) => ({
                ...prev,
                [bussiId]: {
                  linja: reitti,
                  lat: v.position.latitude,
                  lng: v.position.longitude,
                  nopeus: v.position.speed ? (v.position.speed * 3.6).toFixed(0) : 0, // m/s -> km/h
                  suunta: v.position.bearing,
                  paivitetty: new Date().toLocaleTimeString(),
                  label: label
                }
              }));
            }
          }
        });
      } catch (error) {
        console.error("Virhe Protobuf-purussa:", error);
      }
    });

    // CLEANUP: Kun komponentti poistuu ruudulta, suljetaan yhteys
    // muuten taustalle jää ikuisia yhteyksiä syömään selainmuistia.
    return () => {
      console.log('Suljetaan MQTT-yhteys...');
      if (client) {
        client.end();
      }
    };
  }, []);

  if (error) return <p>Virhe datan latauksessa: {error}</p>;

// Apufunktio kääntämään occupancyStatus ihmisluettavaksi
  const getOccupancyText = (status) => {
    const statuses = {
      0: 'Tyhjä',
      1: 'Tilaa on (Monia vapaita paikkoja)',
      2: 'Vähän tilaa (Vain seisomapaikkoja)',
      3: 'Täynnä'
    };
    return statuses[status] || 'Ei tiedossa';
  };

  //if (loading) return <p style={{ padding: '20px' }}>Ladataan ajoneuvojen sijainteja...</p>;
  if (error) return <p style={{ padding: '20px', color: 'red' }}>Virhe: {error}</p>;

  return (
    <div style={{display: 'flex', flexDirection: 'row'}}>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>Bussien Live-seuranta (MQTT)</h2>
        <p>Yhteyden tila: {yhteysAuki ? '🟢 Yhdistetty' : '🔴 Yhdistetään...'}</p>
        
        <div style={{ display: 'grid', gap: '10px' }}>
          {Object.keys(bussit).length === 0 ? (
            <p>Odotetaan l bussien signaaleja...</p>
          ) : (
            Object.entries(bussit).map(([id, bussi]) => (
              <div key={id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                <strong>Bussi #{id} (Linja {bussi.linja} {bussi.label})</strong>
                <br />
                Sijainti: {bussi.lat}, {bussi.lng}
                <br />
                Nopeus: {bussi.nopeus} km/h | Suunta: {bussi.suunta}°
                <br />
                <small style={{ color: 'gray' }}>Päivitetty viimeksi: {bussi.paivitetty}</small>
              </div>
            ))
          )}
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        <h2>Tampere (GTFS-RT MQTT)</h2>
        <ul>
          {Object.entries(bussit).map(([id, bussi]) => (
            <li key={id}>
              Bussi {id}: {bussi.lat}, {bussi.lng} ({bussi.nopeus} km/h) - Päivitetty: {bussi.paivitetty}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WalttiAlerts;
