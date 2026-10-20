import axios from 'axios';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CITIES } from './src/config/cityConfig.js';
import 'dotenv/config';

// ES-moduulien __dirname-ratkaisu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.DIGITRANSIT_API_KEY;

if (!apiKey) {
  console.error("VIRHE: DIGITRANSIT_API_KEY puuttuu!");
  process.exit(1);
}

// 2. Lista tiedostoista, jotka halutaan poimia kunkin kaupungin zipistä
const filesToExtract = ['stops.txt', 'trips.txt', 'transfers.txt', 'routes.txt'];

async function downloadAndExtractAll() {
  // Käydään kaupungit läpi yksi kerrallaan
  Object.values(CITIES).forEach(async (cityConfig) => {
    console.log(`\n--- Aloitetaan kaupunki: ${cityConfig.id.toUpperCase()} ---`);
    
    const url = cityConfig.gtfsUrl || `https://api.digitransit.fi/routing-data/v3/waltti/${cityConfig.gtfsFolder}-gtfs.zip`;
    
    // Määritetään oma alikansio tälle kaupungille (esim. public/data/tampere)
    const cityDir = path.join(__dirname, 'dist', 'data', cityConfig.gtfsFolder);

    try {
      console.log(`Ladataan pakettia osoitteesta: ${url}`);
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: { "digitransit-subscription-key": apiKey }
      });

      console.log(`Puretaan ${cityConfig.gtfsFolder} zip-pakettia muistissa...`);
      const zip = new AdmZip(response.data);
      const zipEntries = zip.getEntries();

      // Varmistetaan, että kyseisen kaupungin alikansio on olemassa (luo jos puuttuu)
      if (!fs.existsSync(cityDir)) {
        fs.mkdirSync(cityDir, { recursive: true });
      }

      // Etsitään ja tallennetaan kaikki pyydetyt tiedostot
      for (const fileName of filesToExtract) {
        const entry = zipEntries.find(e => e.entryName === fileName);

        if (entry) {
          const outputFile = path.join(cityDir, fileName);
          fs.writeFileSync(outputFile, entry.getData());
          console.log(` Tallennettu: dist/data/${cityConfig.gtfsFolder}/${fileName}`);
        } else {
          console.log(`X Varoitus: Tiedostoa ${fileName} ei löytynyt ${cityConfig.gtfsFolder}-paketista.`);
        }
      }
      console.log(`Kaupunki ${cityConfig.gtfsFolder} valmis!`);
    } catch (error) {
      // Käytetään try-catchia silmukan sisällä, jotta yhden kaupungin virhe (esim. väärä url/nimi)
      // ei kaada koko ajoa, vaan skripti jatkaa muiden kaupunkien lataamista.
      console.error(`❌ Virhe kaupungin ${cityConfig.id} - ${cityConfig.gtfsFolder} kohdalla:`, error.message);
    }
  });
  
  console.log("\n Kaikki kaupungit käyty läpi!");
}

downloadAndExtractAll();