// animationRegistry.js
const registry = new Map();
let animFrameId = null;
let sharedMap = null;

const ANIM_KESTO = 1100;

function tick(now) {
  let aktiivisia = 0;

  for (const entry of registry.values()) {
    const { markerRef, startPosRef, targetPosRef, currentPosRef, animStartTimeRef } = entry;

    // Ohitetaan bussit joilla ei ole käynnissä olevaa animaatiota
    if (animStartTimeRef.current === null) continue;

    aktiivisia++;
    const progress = Math.min((now - animStartTimeRef.current) / ANIM_KESTO, 1);
    const [sLat, sLng] = startPosRef.current;
    const [tLat, tLng] = targetPosRef.current;

    const lat = sLat + (tLat - sLat) * progress;
    const lng = sLng + (tLng - sLng) * progress;
    currentPosRef.current = [lat, lng];

    const marker = markerRef.current;
    const icon = marker?._icon;
    if (icon && sharedMap) {
      const p = sharedMap.project([lat, lng]);
      const o = sharedMap.getPixelOrigin();
      const tx = `translate3d(${p.x - o.x}px, ${p.y - o.y}px, 0px)`;
      icon.style.transform = tx;
      if (marker._shadow) marker._shadow.style.transform = tx;
      marker._latlng = L.latLng(lat, lng);
    }

    // Animaatio valmis – pysäytetään tämän bussin työ
    if (progress >= 1) animStartTimeRef.current = null;
  }

  // Jos yksikään bussi ei animoi, pysäytetään koko silmukka
  if (aktiivisia === 0) {
    animFrameId = null;
    return;
  }

  animFrameId = requestAnimationFrame(tick);
}

function kaynnista() {
  if (!animFrameId) {
    animFrameId = requestAnimationFrame(tick);
  }
}

export function rekisteroiBussi(id, entry, map) {
  sharedMap = map;
  registry.set(id, entry);
}

export function poistaBussi(id) {
  registry.delete(id);
}

// Kutsutaan kun bussille saapuu uudet koordinaatit
export function kaynnistaBussiAnimaatio(id) {
  if (registry.has(id)) kaynnista();
}