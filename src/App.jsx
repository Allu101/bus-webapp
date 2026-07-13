import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CircleMarker, MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/App.css';
import mqtt from 'mqtt';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import Map from './components/Map';
import LineFilterBar from './components/LineFilterBar';
import VehicleMarker from './components/VehicleMarker';
import VehicleSidebar from './components/VehicleSidebar';
import StopSidebar from './components/StopSidebar';
import StopLayer from './components/StopLayer';
import { fetchVehicles, fetchStops, fetchLines } from './utils/httpRequests';
import { initTripData, getRouteId } from './utils/fileManager';

function App() {
  const [apiStreamStatus, setApiSteramStatus] = useState(false);
  const [vehicles, setVehicles] = useState({});
  const [stops, setStops] = useState([]);
  const [lines, setLines] = useState([]);
  const [hiddenLines, setHiddenLines] = useState(new Set()); // Pidetään kirjaa piilotetuista linjoista

  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [compactIcons, setCompactIcons] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);

  const [activeStopLines, setActiveStopLines] = useState([]);
  const [coloredVehicles, setColoredVehicles] = useState({});

  /* 1. Haetaan ajoneuvot 2s välein
      Päivitetään valitun ajoneuvon tiedot lennosta
      setSelectedVehicle(prevSelected => {
        if (!prevSelected) return null;
        const updated = data.find(v => v.monitoredVehicleJourney.vehicleRef === prevSelected.vehicleRef);
        return updated ? structuredClone(updated.monitoredVehicleJourney) : prevSelected; */

  useEffect(() => {
    async function init() {
      await initTripData();
    }
    init();

    // Digitransitin WSS-osoite toimii suoraan selaimessa viteseillä
    //const MQTT_URL = 'wss://mqtt.hsl.fi:443/';
    const MQTT_URL = 'wss://mqtt.digitransit.fi:443/';
    
    console.log('Yhdistetään MQTT-palvelimeen...');
    const client = mqtt.connect(MQTT_URL);

    client.on('connect', () => {
      setApiSteramStatus(true);
      // Tilataan haluttu kanava. Voit käyttää esim. /hfp/v2/journey/ongoing/vp/bus/#
      //const topic = '/hfp/v2/journey/ongoing/vp/bus/#';
      const topic = '/gtfsrt/vp/tampere/#'
      
      client.subscribe(topic, (err) => {
        if (!err) console.log(`Tilattu kanava: ${topic}`);
      });
    });

    const viimeisimmätPaivitykset = {};

    client.on('message', (topic, message) => {
      try {
        // TÄRKEÄÄ: Pura viesti Protobuf-formaatista tekstin sijaan!
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(message));
        
        const nyt = Date.now();
        const paivitettavatBussit = {};
        
        // Digitransit lähettää jokaisen päivityksen "entity"-listana
        feed.entity.forEach((entity) => {
          if (entity.vehicle) {
            const v = entity.vehicle;
            const tripID = v.trip?.tripId; //'reitti'//v.trip?.routeId; // Linjan tunnus, esim. "8A"
            const bussiId = v.vehicle?.id;  // Bussin oma ID
            const label = v.vehicle?.label;
            
            const edellinenAika = viimeisimmätPaivitykset[bussiId] || 0;
            if (bussiId) {
          
              // Bussikohtainen kuristus: päästetään tämän yksittäisen auton data läpi vain 3s välein
              /*const edellinenAika = viimeisimmätPaivitykset[bussiId] || 0;
              
              if (nyt - edellinenAika >= 2500) {
                viimeisimmätPaivitykset[bussiId] = nyt;*/ // Lukitaan tämän bussin kello
                
                paivitettavatBussit[bussiId] = {
                  id: bussiId,
                  tripID: tripID,
                  lineNumber: getRouteId(tripID),
                  lat: v.position.latitude,
                  lng: v.position.longitude,
                  speed: v.position.speed ? (v.position.speed * 3.6).toFixed(0) : 0,
                  bearing: v.position.bearing,
                  paivitetty: new Date().toLocaleTimeString(),
                  label: v.vehicle?.label || tripID
                };
              //}
            }
          }
        });

        // Jos tästä viestiryöpystä löytyi busseja, joiden päivitysaika koitti,
        // sulautetaan ne Reactin stateen muiden joukkoon.
        if (Object.keys(paivitettavatBussit).length > 0) {
          setVehicles((prevBussit) => {
            return {
              ...prevBussit,
              ...paivitettavatBussit // Korvaa vain muuttuneet, pitää vanhat tallessa
            }
          });
        }

      } catch (error) {
        console.error("Virhe Protobuf-purussa: ", error);
      }
    });

    // CRITICAL CLEANUP: Kun komponentti poistuu ruudulta, suljetaan yhteys
    return () => {
      console.log('Suljetaan MQTT-yhteys...');
      if (client) {
        client.end();
      }
    };
  }, []);

  // 2. Haetaan pysäkit kerran
  useEffect(() => {
    fetchStops().then(setStops).catch(err => console.error("Pysäkkivirhe:", err));
  }, []);

  // 3. Haetaan viralliset linjat kerran
  useEffect(() => {
    fetchLines().then(setLines).catch(err => console.error("Linjavirhe:", err));
  }, []);

  const handleCloseSidebar = () => {
    setSelectedStop(null);
    setActiveStopLines([]); // Nollataan suodatus, kun pysäkki suljetaan -> kaikki bussit palaavat kartalle
    setColoredVehicles({});
  };

  const handleStopSelect = useCallback((stop) => {
    setSelectedVehicle(null); // Suljetaan bussi
    setSelectedStop(stop);
  }, []);

  // 3. Kun pysäkkipalkista klikataan "Näytä bussi kartalla"
  const handleLinkToVehicle = (vehicle) => {
    console.log("vehicle select: ", vehicle)
    setSelectedStop(null);
    setSelectedVehicle(vehicle);
    setColoredVehicles({});
    // Tähän voi lisätä myös kartan keskittämisen kyseiseen autoon jos haluaa!
  };

  const toggleLineVisibility = (lineRef) => {
    setHiddenLines(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(lineRef)) {
        newHidden.delete(lineRef);
      } else {
        newHidden.add(lineRef);
      }
      return newHidden;
    });
  };

  const allLinesHidden = lines.length > 0 && lines.every(lineObj => hiddenLines.has(lineObj.name));

  const toggleAllLines = () => {
    if (!lines.length) return;
    if (allLinesHidden) {
      setHiddenLines(new Set());
    } else {
      setHiddenLines(new Set(lines.map(l => l.name).filter(Boolean)));
    }
  };

  const getFilteredVehicles = () => {
    const list = Object.values(vehicles);
    // 1. Jos pysäkki on valittu, sivuutetaan globaali filtteri ja näytetään vain pysäkin omat autot
    if (selectedStop) {
      if (activeStopLines?.length > 0) {
        return list.filter(v => activeStopLines.includes(v.lineNumber));
      }
      if (selectedStop.routes) {
        const fallbackLines = selectedStop.routes.map(r => r.shortName);
        return list.filter(v => fallbackLines.includes(v.lineNumber));
      }
      return list; // Varmistus, jos reittidataa ei juuri tällä millisekunnilla ole
    }

    // 2. Jos pysäkkiä EI ole valittu, sovelletaan yläpalkin linjasuodatusta
    if (hiddenLines.size > 0) {
      return list.filter(v => !hiddenLines.has(v.lineNumber));
    }

    // 3. Oletuksena näytetään kaikki
    //return vehicles;
    return vehicles;
  };

  const vehiclesToDisplay = getFilteredVehicles();

  return (
    <div className="app-layout">
      {/* Yläpalkki navigaatiolle */}
      <div className="top-nav">
        <button 
          className={`nav-btn ${showFilters ? 'active' : ''}`}
          onClick={() => { setShowFilters(!showFilters); setShowSettings(false); }}
        >
          {showFilters ? 'Sulje Linjat' : 'Suodata Linjoja'}
        </button>
        <button 
          className={`nav-btn ${showSettings ? 'active' : ''}`}
          onClick={() => { setShowSettings(!showSettings); setShowFilters(false); }}
        >
          Asetukset ⚙️
        </button>
      </div>

      {/* Asetuspaneeli */}
      {showSettings && (
        <div className="settings-panel">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={!compactIcons} 
              onChange={(e) => setCompactIcons(!e.target.checked)} 
              style={{ transform: 'scale(1.2)' }}
            />
            Näytä enemmän tietoja ajoneuvoissa ja aikataluissa.
          </label>
        </div>
      )}

      {/* Suodatinpaneeli */}
      {showFilters && (
        <LineFilterBar
          activeLines={lines}
          hiddenLines={hiddenLines}
          toggleLineVisibility={toggleLineVisibility}
          toggleAllLines={toggleAllLines}
          allLinesHidden={allLinesHidden}
        />
      )}

      {/* Pääalue (Kartta + Sivupalkki) */}
      <div className="main-content">
        <Map 
          stops={stops}
          onStopSelect={handleStopSelect}
          selectedStop={selectedStop}
          vehiclesToDisplay={getFilteredVehicles()}
          coloredVehicles={coloredVehicles}
          compactIcons={compactIcons}
          onVehicleSelect={handleLinkToVehicle}
        />

        {/* Bussi Sivupalkki */}
        {selectedVehicle && (
          <div className="sidebar-container">
            <VehicleSidebar 
              vehicle={selectedVehicle} 
              onClose={() => setSelectedVehicle(null)} 
            />
          </div>
        )}

        {/* Pysäkin sivupalkki/alapalkki */}
        {selectedStop && (
          <div className="sidebar-container">
            <StopSidebar 
              stopCode={selectedStop.code || selectedStop.shortName} // riippuen siitä millä nimellä koodi on datassasi
              stopName={selectedStop.name}
              onClose={() => handleCloseSidebar()}
              onSelectVehicle={handleLinkToVehicle}
              selectedStop={selectedStop}
              setActiveStopLines={setActiveStopLines}
              setColoredVehicles={setColoredVehicles}
              vehicles={vehicles}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;