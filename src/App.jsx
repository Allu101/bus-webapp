import React, { useState, useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './styles/App.css';
import mqtt from 'mqtt';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import Map from './components/Map';
import LineFilterBar from './components/LineFilterBar';
import VehicleSidebar from './components/VehicleSidebar';
import StopSidebar from './components/StopSidebar';
import { fetchStops, fetchLines } from './utils/httpRequests';
import { initStaticData, getRouteShortName } from './utils/fileManager';
import { CITIES } from './config/cityConfig';
import { calculateBearing, getApproxDistanceMeters } from './utils/geoUtils';

function App() {
  const [city, setCity] = useState(() => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    
    for (const c of Object.values(CITIES)) {
      if (c.id.toLowerCase() === path) {
        return c.id;
      }
    }
    return 'tampere';
  });
  
  const bufferRef = useRef({});
  const vehicleHistoryRef = useRef({});

  const [vehicles, setVehicles] = useState({});
  const [stops, setStops] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedLines, setSelectedLines] = useState(new Set());

  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [compactIcons, setCompactIcons] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);

  const [activeStopLines, setActiveStopLines] = useState([]);
  const [coloredVehicles, setColoredVehicles] = useState({});
  const [mapBounds, setMapBounds] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '').toLowerCase();
      const foundCity = Object.values(CITIES).find((c) => c.id.toLowerCase() === path);
      if (foundCity) {
        setCity(foundCity.id);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const loadCityData = async (cityConfig) => {
      await initStaticData(cityConfig);
      const stopsData = await fetchStops(cityConfig);
      setStops(stopsData);
      fetchLines(cityConfig).then(setLines).catch(err => console.error("Linjavirhe:", err));

      setSelectedStop(null);
      setVehicles({});
      setSelectedLines(new Set())
      bufferRef.current = {};
      vehicleHistoryRef.current = {};
    };

    const cityConfig = CITIES[city];
    loadCityData(cityConfig);

    const currentPath = window.location.pathname.replace('/', '').toLowerCase();
    const citySlug = city.toLowerCase().trim();

    // Päivitetään osoiterivi vain jos se on muuttunut
    if (currentPath !== citySlug) {
      window.history.pushState({}, '', `/${citySlug}`);
    }

    // Päivitetään Hakukoneille näkyvä sivun otsikko ja meta-kuvaus dynaamisesti!
    document.title = `Bussikartta ${cityConfig?.displayName || ''} – Reaaliaikaiset bussit ja aikataulut.`;
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://bussikartta.koodauslahtinen.fi/${citySlug}`);
    }

    // Päivitetään meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content', 
        `Bussikartta näyttää ${cityConfig?.possessiveName} bussit kartalla ja sekä pysäkkien aikataulut reaaliajassa.`
      );
    }

    // Luodaan ajastin, joka tyhjentää puskurin Reactin tilaan (state) esim. x ms välein
    const flushInterval = setInterval(() => {
      // Tarkistetaan, onko puskuriin kertynyt uusia bussipäivityksiä
      if (Object.keys(bufferRef.current).length > 0) {
        
        // Otetaan kertyneet bussit talteen ja tyhjennetään puskuri heti
        const kertyneetBussit = bufferRef.current;
        bufferRef.current = {};

        setVehicles((prevBussit) => {
          return {
            ...prevBussit,
            ...kertyneetBussit
          };
        });
      }
    }, 400);

    // Digitransitin WSS-osoite toimii suoraan selaimessa viteseillä
    //const MQTT_URL = 'wss://mqtt.hsl.fi:443/';
    //const MQTT_URL = 'wss://mqtt.digitransit.fi:443/';
    
    console.log('Yhdistetään MQTT-palvelimeen...');
    const client = mqtt.connect(cityConfig.mqtt_url);

    client.on('connect', () => {
      const topic = cityConfig.mqtt_topic;
      
      client.subscribe(topic, (err) => {
        if (!err) console.log(`Tilattu kanava: ${topic}`);
      });
    });

    client.on('message', (topic, message) => {
      try {
        if (cityConfig.mqtt_format === 'hfp') {
          parseHfpMessage(message, topic, vehicleHistoryRef, bufferRef);
        } else {
          parseGtfsRtMessage(message, vehicleHistoryRef, bufferRef);
        }
      } catch (error) {
        console.error('Virhe viestin purussa:', error);
      }
    });

    return () => {
      console.log('Suljetaan MQTT-yhteys...');
      if (client) {
        client.removeAllListeners();
        client.end(true);
      }
      clearInterval(flushInterval);
    };
  }, [city]);

  function parseHfpMessage(message, topic, vehicleHistoryRef, bufferRef) {
    const payload = JSON.parse(message.toString());
    const vp = payload.VP;
  
    // Hylkää viestit joissa ei ole sijaintia tai ne ovat ns. deadrun/signoff
    if (!vp || vp.lat == null || vp.long == null) return;
  
    // Ajoneuvon yksilöivä ID: "0012/01306" (operator 4 dig / vehicle 5 dig)
    const bussiId = `${String(vp.oper).padStart(4, '0')}/${String(vp.veh).padStart(5, '0')}`;
  
    // Synteettinen tripID koska trip_id:t eivät ole pysyviä HSL:ssä
    const tripID = `${vp.route}_${vp.dir}_${vp.oday}_${vp.start}`;
  
    if (!bussiId || !tripID) return;
  
    const newLat = vp.lat;
    const newLng = vp.long;   // Huom: HFP käyttää "long" eikä "lng"
  
    const prevVeh = vehicleHistoryRef.current[bussiId];
    let bearing = vp.hdg || 0;
  
    if (prevVeh) {
      const distMeters = getApproxDistanceMeters(prevVeh.lat, prevVeh.lng, newLat, newLng);
      if (distMeters >= 2) {
        // HFP:ssä hdg on yleensä luotettava, lasketaan vain jos puuttuu
        if (!bearing) {
          bearing = calculateBearing(prevVeh.lat, prevVeh.lng, newLat, newLng);
        }
      } else {
        // Ajoneuvo ei liiku – pidetään edellinen suunta
        bearing = bearing || prevVeh.bearing || 0;
      }
    }

    const topicParts = topic.split('/');
    const vehType = topicParts[6] ? topicParts[6] : 'bus';
  
    vehicleHistoryRef.current[bussiId] = {
      lat: newLat,
      lng: newLng,
      bearing: bearing,
      timestampMs: Date.now(),
    };
  
    bufferRef.current[bussiId] = {
      id: bussiId,
      vehType: vehType,
      tripID: `${vp.route}_${vp.dir}_${vp.oday}_${vp.start}`, // Synteettinen tripID koska trip_id:t eivät ole pysyviä HSL:ssä
      lineNumber: vp.desi || vp.route,   // "550" tai fallback "2550"
      lat: newLat,
      lng: newLng,
      speed: vp.spd != null ? Math.round(vp.spd * 3.6) : 0,
      bearing: bearing,
      label: vp.desi || bussiId,
      // ── HFP-lisädata tulevaa varten ──────────────────────────────────────
      //doorOpen:   vp.drst === 1,         // true = ovet auki
      //delayS:     vp.dl ?? null,         // null jos tieto puuttuu
      //occupancy:  vp.occu ?? null,       // 0–100, null jos ei saatavilla
      routeId:    vp.route,              // GTFS route_id ("2550")
      // ─────────────────────────────────────────────────────────────────────
    };
  }

  function parseGtfsRtMessage(message, vehicleHistoryRef, bufferRef) {
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(message));
  
    feed.entity.forEach((entity) => {
      if (!entity.vehicle) return;
  
      const v = entity.vehicle;
      const tripID = v.trip?.tripId;
      const bussiId = v.vehicle?.id;
      const newLat = v.position.latitude;
      const newLng = v.position.longitude;
  
      if (!bussiId || !tripID || !newLat || !newLng) return;
  
      const prevVeh = vehicleHistoryRef.current[bussiId];
      let bearing = v.position.bearing;
  
      if (prevVeh) {
        const distMeters = getApproxDistanceMeters(prevVeh.lat, prevVeh.lng, newLat, newLng);
        if (distMeters >= 2) {
          if (!bearing || bearing === 0) {
            bearing = calculateBearing(prevVeh.lat, prevVeh.lng, newLat, newLng);
          }
        } else {
          bearing = bearing || prevVeh.bearing || 0;
        }
      } else {
        bearing = bearing || 0;
      }
  
      vehicleHistoryRef.current[bussiId] = {
        lat: newLat,
        lng: newLng,
        bearing: bearing,
        timestampMs: Date.now(),
      };
  
      bufferRef.current[bussiId] = {
        id: bussiId,
        tripID: tripID,
        lineNumber: getRouteShortName(tripID),
        lat: newLat,
        lng: newLng,
        speed: v.position.speed ? Math.round(v.position.speed * 3.6) : 0,
        bearing: bearing,
        label: v.vehicle?.label || tripID,
      };
    });
  }

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
    setSelectedStop(null);
    setSelectedVehicle(vehicle);
    setColoredVehicles({});
    // Tähän voi lisätä myös kartan keskittämisen kyseiseen autoon jos haluaa!
  };

  const toggleLineVisibility = (lineRef) => {
    setSelectedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineRef)) {
        next.delete(lineRef);
      } else {
        next.add(lineRef);
      }
      return next;
    });
  };

  const toggleAllLines = () => {
    setSelectedLines(new Set());
  };

  const getFilteredVehicles = () => {
    let list = Object.values(vehicles);

    if (mapBounds) {
      list = list.filter(
        v => v.lat != null && v.lng != null && mapBounds.contains([v.lat, v.lng])
      );
    }

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
    if (selectedLines.size > 0) {
      return list.filter(v => selectedLines.has(v.lineNumber));
    }

    // 3. Oletuksena näytetään kaikki
    return list;
  };

  return (
    <div className="app-layout">
      {/* Yläpalkki navigaatiolle */}
      <div className="top-nav">
        <button 
          className={`nav-btn ${showFilters ? 'active' : ''}`}
          onClick={() => { setShowFilters(!showFilters); setShowSettings(false); }}
        >
          {showFilters ? 'Suodata Linjoja' : 'Suodata Linjoja'}
        </button>

        <div className="city-selector">
          <label htmlFor="city-select" className="city-label"></label>
          <select
            id="city-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="city-dropdown"
          >
            {Object.values(CITIES).map((city) => (
              <option key={city.id} value={city.id}>
                {city.displayName}
              </option>
            ))}
          </select>
          
          <nav className="seo-city-links" style={{ display: 'none' }}>
            {Object.values(CITIES).map((c) => (
              <a key={c.id} href={`/${c.id}`}>
                Bussit {c.displayName}
              </a>
            ))}
          </nav>
        </div>
        
        <button 
          className={`nav-btn ${showSettings ? 'active' : ''}`}
          onClick={() => { setShowSettings(!showSettings); setShowFilters(false); }}
        >
          Asetukset / Info
        </button>
      </div>

      <h1 className="sr-only">Bussikartta {CITIES[city]?.displayName || 'Tampere'} bussit ja aikataulut</h1>

      {/* Asetuspaneeli */}
      {showSettings && (
        <div className="settings-panel">
          {/* 1. ASETUKSET - OMA OSIO */}
          <div className="settings-section">
            <h4 className="settings-title">Asetukset</h4>
            
            <div className="setting-item">
              <label className="setting-label">
                <input 
                  type="checkbox" 
                  checked={!compactIcons} 
                  onChange={(e) => setCompactIcons(!e.target.checked)} 
                />
                <span>Näytä enemmän tietoja ajoneuvoissa ja aikatauluissa</span>
              </label>
            </div>

            {/* Tähän on helppo lisätä uusia asetuksia tulevaisuudessa:
            <div className="setting-item">
              <label className="setting-label">
                <input type="checkbox" ... />
                <span>Seuraava asetus</span>
              </label>
            </div> 
            */}
          </div>

          <div className="settings-divider" />

          {/* 2. PERUSTIEDOT - OMA OSIO */}
          <div className="settings-section info-section">
            <h4 className="settings-title">Tietoa palvelusta</h4>
            <p className="info-description">
              Reaaliaikainen joukkoliikenteen kartta- ja aikataulupalvelu.
            </p>
            
            <div className="info-details">
              <div className="info-row">
                <span className="info-label">Reaaliaikainen data:</span>
                 <span className="info-value">Digitransit</span>
              </div>
              <div className="info-row">
                <span></span>
                <span className="info-value">{CITIES[city].mqtt_url}{CITIES[city].mqtt_topic}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Päivitystila:</span>
                <span className="info-value live-status">🟢 Reaaliaikainen</span>
              </div>
            </div>
            <span className="info-description-center">
              Sivuston ylläpito: Koodaus Lahtinen
            </span>
            <span className="info-description-center">
              2026
            </span>
          </div>
        </div>
      )}

      {/* Suodatinpaneeli */}
      {showFilters && (
        <LineFilterBar
          activeLines={lines}
          selectedLines={selectedLines}
          toggleLineVisibility={toggleLineVisibility}
          toggleAllLines={toggleAllLines}
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
          city={CITIES[city]}
          setMapBounds={setMapBounds}
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
              selectedCityConfig={CITIES[city]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;