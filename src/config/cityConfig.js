export const CITIES = {
  jyvaskyla: {
    id: 'jyvaskyla',
    displayName: 'Jyväskylä (Linkki)',
    center: [62.242600, 25.747300],
    zoom: 13,
    gtfsFolder: 'LINKKI',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/LINKKI/#'
  },
  oulu: {
    id: 'oulu',
    displayName: 'Oulu',
    center: [65.021545, 25.469885],
    zoom: 13,
    gtfsFolder: 'OULU',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/OULU/#'
  },
  tampere: {
    id: 'tampere',
    displayName: 'Tampere (Nysse)',
    center: [61.4978, 23.7610],
    zoom: 13,
    gtfsFolder: 'tampere',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/tampere/#'
  },
  /*helsinki: {
    id: 'helsinki',
    displayName: 'Helsinki (HSL)',
    center: [60.1699, 24.9384],
    zoom: 12,
    gtfsFolder: 'helsinki',
    mqtt_url: 'https://api.digitransit.fi/realtime/vehicle-positions/v2/hsl',
  },*/
  turku: {
    id: 'turku',
    displayName: 'Turku (Föli)',
    center: [60.4518, 22.2666],
    zoom: 13,
    gtfsFolder: 'FOLI',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/FOLI/#'
  }
};