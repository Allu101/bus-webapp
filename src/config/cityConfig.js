export const CITIES = {
  helsinki: {
    id: 'helsinki',
    displayName: 'Helsinki (HSL)',
    center: [60.1699, 24.9384],
    zoom: 13,
    gtfsFolder: 'HSL',
    gtfsUrl: 'https://infopalvelut.storage.hsldev.com/gtfs/hsl.zip',
    mqtt_url:   'wss://mqtt.hsl.fi:443/',
    mqtt_topic: '/hfp/v2/journey/ongoing/vp/#',
    mqtt_format: 'hfp',
  },
  hameenlinna: {
    id: 'hameenlinna',
    displayName: 'Hämeenlinna',
    center: [60.9944, 24.4667],
    zoom: 13,
    gtfsFolder: 'Hameenlinna',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Hameenlinna/#'
  },
  jyvaskyla: {
    id: 'jyvaskyla',
    displayName: 'Jyväskylä (Linkki)',
    center: [62.242600, 25.747300],
    zoom: 13,
    gtfsFolder: 'LINKKI',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/LINKKI/#'
  },
  kotka: {
    id: 'kotka',
    displayName: 'Kotka',
    center: [60.4664, 26.9458],
    zoom: 13,
    gtfsFolder: 'Kotka',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Kotka/#'
  },
  kuopio: {
    id: 'kuopio',
    displayName: 'Kuopio',
    center: [62.8924, 27.6782],
    zoom: 13,
    gtfsFolder: 'Kuopio',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Kuopio/#'
  },
  lahti: {
    id: 'lahti',
    displayName: 'Lahti',
    center: [60.9817, 25.6590],
    zoom: 13,
    gtfsFolder: 'Lahti',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Lahti/#'
  },
  lappeenranta: {
    id: 'lappeenranta',
    displayName: 'Lappeenranta/Imatra',
    center: [61.0587, 28.1887],
    zoom: 13,
    gtfsFolder: 'Lappeenranta',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Lappeenranta/#'
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
  pori: {
    id: 'pori',
    displayName: 'Pori',
    center: [61.4833, 21.8000],
    zoom: 13,
    gtfsFolder: 'Pori',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Pori/#'
  },
  rovaniemi: {
    id: 'rovaniemi',
    displayName: 'Rovaniemi',
    center: [66.5039, 25.7294],
    zoom: 13,
    gtfsFolder: 'Rovaniemi',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Rovaniemi/#'
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
  turku: {
    id: 'turku',
    displayName: 'Turku (Föli)',
    center: [60.4518, 22.2666],
    zoom: 13,
    gtfsFolder: 'FOLI',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/FOLI/#'
  },
  vaasa: {
    id: 'vaasa',
    displayName: 'Vaasa',
    center: [63.0951, 21.6165],
    zoom: 13,
    gtfsFolder: 'Vaasa',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Vaasa/#'
  },
};