import React, { useState, useEffect } from 'react';
import { fetchStopSchedule, formatDigitransitTime } from '../utils/stopService';
import { fetchLiveVehiclesForStop } from '../utils/httpRequests';
import { parseDelaySeconds } from '../utils/vehicleHelpers';

//const NEXT_VEHICLE_COLORS = ['#3498db', '#e67e22', '#9b59b6', '#e74c3c', '#f1c40f'];
const NEXT_VEHICLE_COLORS = ['#7cbbfa', '#4beec0', '#fae8ae', '#f5ab9b', '#a29bfe'];

const UPDATE_INTERVAL = 10000;
const TRAM_COLOR = '#da2128de';
const BUS_COLOR = '#3f6fe8de';

function StopSidebar({ stopCode, stopName, onClose, onSelectVehicle, selectedStop, setActiveStopLines, setColoredVehicles, vehicles }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  const [liveVehiclesForStop, setLiveVehiclesForStop] = useState([]);
  const [selectedLines, setSelectedLines] = useState([]);

  useEffect(() => {
    setSelectedLines([]);
  }, [stopCode]);

  useEffect(() => {
    if (!selectedStop) return;

    const fetchDeepData = async () => {
      try {
        const matchingVehicles = await fetchLiveVehiclesForStop(selectedStop.url);
        setLiveVehiclesForStop(structuredClone(matchingVehicles));
      } catch (err) {
        console.error("Syvähaku epäonnistui:", err);
      }
    };

    fetchDeepData();
    const interval = setInterval(fetchDeepData, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedStop]);

  useEffect(() => {
    if (!stopCode) return;

    const loadData = async () => {
      setLoading(true);
      const data = await fetchStopSchedule(stopCode);
      setSchedule(data);
      setLoading(false);

      if (data && data.routes) {
        const lineNames = data.routes.map(r => r.shortName);
        setActiveStopLines(lineNames);
      }
    };

    loadData();
    const interval = setInterval(loadData, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [stopCode]);

  /*useEffect(() => {
    if (!schedule?.stoptimesWithoutPatterns || liveVehiclesForStop.length === 0) {
      setColoredVehicles({});
      return;
    }

    const newColorMapping = {};
    let colorIndex = 0;

    // Käydään aikataulua läpi järjestyksessä
    for (const stoptime of schedule.stoptimesWithoutPatterns) {
      if (colorIndex >= NEXT_VEHICLE_COLORS.length) break; // 5 väriä täynnä

      const liveVehicle = findMatchingVehicle(stoptime);
      if (liveVehicle) {
        const vRef = liveVehicle.monitoredVehicleJourney.vehicleRef;
        // Jos autolle ei ole vielä annettu väriä (sama auto voi teoriassa olla kahdella rivillä)
        if (!newColorMapping[vRef]) {
          newColorMapping[vRef] = NEXT_VEHICLE_COLORS[colorIndex];
          colorIndex++;
        }
      }
    }

    setColoredVehicles(newColorMapping);
  }, [schedule, liveVehiclesForStop]);*/

  const getStopDistance = (liveVehicle) => {
    if (!liveVehicle) return null;

    const calls = liveVehicle.monitoredVehicleJourney.onwardCalls;
    if (!calls || calls.length === 0) return null;

    // Etsitään valitun pysäkin indeksi onwardCalls-taulukosta
    const targetIndex = calls.findIndex(call => call.stopPointRef === selectedStop.url);

    // Jos pysäkkiä ei löydy listalta, bussi on saattanut jo ohittaa sen
    if (targetIndex === -1) return null;

    // targetIndex kertoo suoraan kuinka monta pysäkkiä on välissä ennen tätä pysäkkiä.
    // Esim. jos targetIndex on 0, se on seuraava pysäkki (0 pysäkin päässä).
    if (targetIndex === 0) {
      return "🚌 Seuraava pysäkki";
    } else {
      return `📍 ${targetIndex} pysäkin päässä`;
    }
  };

  // Apufunktio tarkistamaan, mikä väri tälle autolle kuuluu
  const getVehicleColor = (liveVehicle) => {
    if (!liveVehicle) return null;
    const vRef = liveVehicle.monitoredVehicleJourney.vehicleRef;
    
    // Etsitään väri NEXT_VEHICLE_COLORS-listasta vertaamalla lennosta (tai suoraan objektista)
    // Koska tila päivittyy asynkronisesti, lasketaan se tässä varmuuden vuoksi suoraan:
    let colorIndex = 0;
    for (const stoptime of (schedule?.stoptimesWithoutPatterns || [])) {
      const matched = findMatchingVehicle(stoptime);
      if (matched) {
        if (matched.monitoredVehicleJourney.vehicleRef === vRef) {
          return NEXT_VEHICLE_COLORS[colorIndex];
        }
        colorIndex++;
        if (colorIndex >= NEXT_VEHICLE_COLORS.length) break;
      }
    }
    return null;
  };

  const findMatchingVehicle = (stoptime) => {
    if (!stoptime.realtime) return null;

    return Object.values(vehicles).find(v => {
      return stoptime.tripId?.split(':')[1] === v.tripID;
    })
    
    // Digitransitin aikataulun saapumisaika sekunteina (esim. 72000 = 20:00:00)
    /*const scheduleRealTimeDep = stoptime.realtimeDeparture;

    // Etsitään auto, joka täsmää linjaan JA on tulossa tälle pysäkille
    return liveVehiclesForStop.find(v => {
      const journey = v.monitoredVehicleJourney;
      
      if (journey.lineRef !== lineNum) return false;

      // Tarkistus 2: Löydetään oikea pysäkkikäynti (onwardCall)
      const call = journey.onwardCalls?.find(
        c => c.stopPointRef === selectedStop.url
      );

      if (!call) return false;
      
      // Tarkistus 3: Aikatäsmäys (onko kyseessä juuri tämä vuoro?)
      // Muutetaan ISO-aika (esim. 2026-07-05T20:15:00) sekunneiksi keskiyöstä
      const date = new Date(call.expectedDepartureTime);
      let departureSeconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

      // Jos Digitransitin aikatauluaika on yli vuorokauden (86400s) ja auton oma kello on 
      // jo pyörähtänyt aamuyön puolelle (esim. alle 6 tuntia keskiyöstä), lisätään auton aikaan 24 tuntia
      if (scheduleRealTimeDep >= 86400 && departureSeconds < 21600) {
        departureSeconds += 86400;
      }

      let vehicleScheduledSeconds = departureSeconds;

      // Jos aikataulu ja auton ennuste täsmäävät esim. 3 minuutin sisään, se on se auto!
      return Math.abs(vehicleScheduledSeconds - scheduleRealTimeDep) < 180;
    });*/
  };

  const toggleLineFilter = (lineShortName) => {
    setSelectedLines(prev => 
      prev.includes(lineShortName)
        ? prev.filter(l => l !== lineShortName) // Poistetaan suodatin jos oli jo valittu
        : [...prev, lineShortName]             // Muuten lisätään listaan
    );
  };

  const renderStopLines = (stopData) => {
    //sort lines by shortName numerically. name can contain letter on last character, so we need to sort by numeric part first, then by letter if present
    const lines = (stopData.routes || []).sort((a, b) => {
      const aNum = parseInt(a.shortName, 10);
      const bNum = parseInt(b.shortName, 10);
      if (aNum !== bNum) return aNum - bNum;
      // If numbers are equal, sort by letter (if present)
      const aLetter = a.shortName.replace(/^\d+/, '');
      const bLetter = b.shortName.replace(/^\d+/, '');
      return aLetter.localeCompare(bLetter);
    });

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '12px' }}>
        {lines.map((line) => {
          const isTram = line.mode === 'TRAM';
          const badgeColor = isTram ? TRAM_COLOR : BUS_COLOR;

          const isSelected = selectedLines.includes(line.shortName);
          
          // Jos jokin linja on valittu, muutetaan ei-valitut hieman haaleammiksi
          const hasActiveFilters = selectedLines.length > 0;
          const opacity = hasActiveFilters && !isSelected ? '0.4' : '1';

          return (
            <div
              key={line.shortName}
              onClick={() => toggleLineFilter(line.shortName)}
              style={{
                background: badgeColor,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '4px 5px', //4 ja 6 hyvä mobiili
                borderRadius: '6px', // "Kulmat hieman pyöristetty"
                minWidth: '28px',
                textAlign: 'center',
                boxShadow: isSelected ? '0 0 0 1px #fff, 0 0 0 2px #3fc93f' : '0 2px 4px rgba(0,0,0,0.15)',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer', // Muutetaan osoitin sormeksi
                opacity: opacity,
                transition: 'all 0.15s ease',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {line.shortName}
            </div>
          );
        })}

        {/* Tyhjennysnappi jos suodattimia on päällä */}
        {selectedLines.length > 0 && (
          <button 
            onClick={() => setSelectedLines([])}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#f18686', 
              fontSize: '12px', 
              cursor: 'pointer', 
              textDecoration: 'underline',
              padding: '4px'
            }}
          >
            Tyhjennä
          </button>
        )}
      </div>
    );
  };

  //Suodatetaan näytettävät aikataulut valinnan mukaan
  const departuresToRender = schedule?.stoptimesWithoutPatterns 
    ? (selectedLines.length > 0 
        ? schedule.stoptimesWithoutPatterns.filter(st => selectedLines.includes(st.line))
        : schedule.stoptimesWithoutPatterns)
    : [];
  
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box'}}>
      
      {/* Otsikko */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>{stopName || 'Pysäkki'}</h2>
          <span style={{ color: '#8eb3ff', fontSize: '14px' }}>{stopCode}</span>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
      </div>

      {/* Linjat */}
      {renderStopLines(schedule || { lines: [] })}

      {/* Skrollaava sisältö */}
      <div style={{ flex: 1, overflowY: 'scroll', height: '100%', paddingTop: '10px', paddingRight: '10px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom, 0px))' }}>
        {loading && !schedule ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Ladataan aikatauluja...</div>
        ) : departuresToRender?.length > 0 ? (
          departuresToRender.map((stoptime, idx) => {
            const lineNum = stoptime.line;
            const isRealtime = stoptime.realtime;
            const liveVehicle = findMatchingVehicle(stoptime);

            // Lasketaan viive sekunteina
            const bonusColor = null; //getVehicleColor(liveVehicle);
            const delaySeconds = stoptime.realtimeDeparture - stoptime.scheduledDeparture;

            const formattedRealTimeDep = formatDigitransitTime(stoptime.realtimeDeparture);
            const minutesDiff = getMinutesFromNow(formattedRealTimeDep);
            const formattedTimeDiffFromNow = minutesDiff + ' min';

            return (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  background: '#101f3376', 
                  padding: '12px 15px', 
                  borderRadius: '8px', 
                  marginBottom: '10px',
                  borderLeft: isRealtime ? '4px solid #3fc93f' : '4px solid #55667d',
                  borderRight: bonusColor ? `5px solid ${bonusColor}` : '6px solid transparent',
                  backdropFilter: 'blur(1px)',
                }}
              >
                {/* Linja ja Määränpää */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: stoptime.mode === 'TRAM' ? TRAM_COLOR : BUS_COLOR, padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                      {lineNum}
                    </span>
                    <strong style={{ fontSize: '15px' }}>{stoptime.headsign}</strong>
                  </div>
                  {liveVehicle && (
                    <div 
                      onClick={() => onSelectVehicle(liveVehicle.monitoredVehicleJourney)}
                      style={{ color: '#8eb3ff', fontSize: '11px', marginTop: '4px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      #{liveVehicle.id}
                      <span style={{ 
                        background: '#203a5c', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        color: '#fff',
                        fontSize: '11px',
                        marginLeft: '5px'
                      }}>
                        {liveVehicle.id}
                        {/*{getStopDistance(liveVehicle) || `${liveVehicle.monitoredVehicleJourney.speed} km/h`}*/}
                      </span>
                    </div>
                  )}
                </div>

                {/* Aika ja Ennuste */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: isRealtime ? '#3fc93f' : 'white' }}>
                    {minutesDiff <= 90 && (
                      <span style={{ marginRight: '10px', fontSize: '12px', fontWeight: 'normal', color: 'lightgray' }}>
                        {formattedTimeDiffFromNow}
                      </span>
                    )}
                    {formattedRealTimeDep}
                  </div>

                  {delaySeconds > 45 && (
                    <span style={{ color: '#f18686', fontSize: '12px' }}>
                      Myöhässä +{Math.floor(delaySeconds / 60)}m {delaySeconds % 60}s
                    </span>
                  )}
                  {delaySeconds < 30 && isRealtime && (
                    <span style={{ color: '#3fc93f', fontSize: '12px' }}>{delaySeconds} s</span>
                  )}
                  
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>Ei tulevia lähtöjä lähiaikoina.</div>
        )}
      </div>
    </div>
  );
}

function getMinutesFromNow(secondsFromMidnight) {
  let date = new Date();
  const [hours, mins] = secondsFromMidnight.split(':');
  if (hours < date.getHours()) {
    date.setDate(date.getDate() + 1)
  }
  date.setHours(hours)
  date.setMinutes(mins)
  let diffSeconds = Math.floor((date - new Date()) / 1000 );
  
  return Math.floor(diffSeconds / 60)
}

export default StopSidebar;