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
    vehColors: {
      bus: '#007ac9',     // HSL Sininen (bussit)
      tram: '#00985f',    // HSL Vihreä (ratikat)
      metro: '#ff6319',  // HSL Oranssi (metro)
      ferry: '#00b9e4',   // HSL Vaaleansininen (lautta)
      train: '#8c4799'     // HSL Violetti (lähijunat)
    }
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
  joensuu: {
    id: 'joensuu',
    displayName: 'Joensuu (JOJO)',
    center: [62.6010, 29.7636],
    zoom: 13,
    gtfsFolder: 'Joensuu',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Joensuu/#'
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
  kajaani: {
    id: 'kajaani',
    displayName: 'Kajaani',
    center: [64.2272, 27.7285],
    zoom: 13,
    gtfsFolder: 'Kajaani',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Kajaani/#'
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
  kouvola: {
    id: 'kouvola',
    displayName: 'Kouvola',
    center: [60.8679, 26.7042],
    zoom: 13,
    gtfsFolder: 'Kouvola',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Kouvola/#'
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
  mikkeli: {
    id: 'mikkeli',
    displayName: 'Mikkeli',
    center: [61.6887, 27.2721],
    zoom: 13,
    gtfsFolder: 'Mikkeli',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Mikkeli/#'
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
  rauma: {
    id: 'rauma',
    displayName: 'Rauma',
    center: [61.1272, 21.5113],
    zoom: 13,
    gtfsFolder: 'Rauma',
    gtfsUrl: 'https://api.digitransit.fi/routing-data/v3/finland/Rauma-gtfs.zip',
    routingEndpoint: 'finland',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Rauma/#'
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
  salo: {
    id: 'salo',
    displayName: 'Salo (Paikku)',
    center: [60.3831, 23.1299],
    zoom: 13,
    gtfsFolder: 'Salo',
    mqtt_url: 'wss://mqtt.digitransit.fi:443/',
    mqtt_topic: '/gtfsrt/vp/Salo/#'
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