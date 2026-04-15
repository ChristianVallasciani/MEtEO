const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });
const mongoose = require("mongoose");
const axios = require("axios");
const cron = require("node-cron");

const Weather = require("./models/Weather");

const FETCH_CRON = "*/5 * * * *";
const WEATHERLINK_BASE_URL = "https://api.weatherlink.com/v2/current";
const WEATHERLINK_TIMEOUT_MS = 15000;

let isFetchRunning = false;

function tryDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sanitizeMongoUri(uri) {
  return uri.replace(/^(mongodb(?:\+srv)?:\/\/)([^@]+)@/, (match, prefix, credentials) => {
    const separatorIndex = credentials.indexOf(":");

    if (separatorIndex === -1) {
      return match;
    }

    const username = credentials.slice(0, separatorIndex);
    const password = credentials.slice(separatorIndex + 1);

    return `${prefix}${encodeURIComponent(tryDecode(username))}:${encodeURIComponent(tryDecode(password))}@`;
  });
}

const REQUIRED_ENV_VARS = ["MONGO_URI", "API_KEY", "API_SECRET", "STATION_ID"];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || !process.env[key].trim());

if (missingEnvVars.length > 0) {
  console.error(`❌ Variabili mancanti nel file .env: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

if (!/^\d+$/.test(process.env.STATION_ID)) {
  console.error("❌ STATION_ID non valido: inserisci l'ID numerico reale della stazione WeatherLink (non XXXXX)");
  process.exit(1);
}

function buildWeatherDoc(stationId, sensorType, dataRow) {
  return {
    station_id: stationId,
    sensor_type: sensorType,
    timestamp: dataRow.ts,
    temperature: dataRow.temp ?? null,
    humidity: dataRow.hum ?? null,
    wind_speed: dataRow.wind_speed ?? null,
    rain_rate: dataRow.rain_rate ?? null,
    raw: dataRow
  };
}

// -------------------
// CONNESSIONE MONGO
// -------------------
async function connectMongo() {
  try {
    const mongoUri = sanitizeMongoUri(process.env.MONGO_URI);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connesso");
  } catch (err) {
    console.error("❌ Errore Mongo:", err.message);

    if (err.message && /bad auth|authentication failed/i.test(err.message)) {
      console.error("ℹ️ Credenziali MongoDB non valide: verifica utente/password in Atlas > Database Access");
      console.error("ℹ️ Se la password contiene caratteri speciali, deve essere URL-encoded (es. @ -> %40)");
    }

    if (err.message && /whitelist|IP that isn't whitelisted|Could not connect to any servers/i.test(err.message)) {
      console.error("ℹ️ Atlas Network Access: aggiungi l'IP corrente o 0.0.0.0/0 nella whitelist del cluster");
    }

    process.exit(1);
  }
}

// -------------------
// FETCH DATI METEO
// -------------------
async function fetchWeather() {
  if (isFetchRunning) {
    console.log("⏭️ Fetch precedente ancora in corso: salto questo ciclo");
    return;
  }

  isFetchRunning = true;

  try {
    console.log("⏳ Recupero dati...");

    const response = await axios.get(
      `${WEATHERLINK_BASE_URL}/${process.env.STATION_ID}?api-key=${process.env.API_KEY}`,
      {
        headers: {
          "X-Api-Secret": process.env.API_SECRET
        },
        timeout: WEATHERLINK_TIMEOUT_MS
      }
    );

    const res = response.data;
    const stationId = Number(res.station_id) || Number(process.env.STATION_ID);
    const sensors = Array.isArray(res.sensors) ? res.sensors : [];

    if (sensors.length === 0) {
      console.log("⚠️ Nessun sensore trovato nella risposta API");
      return;
    }

    const bulkOps = [];

    for (const sensor of sensors) {
      const rows = Array.isArray(sensor.data) ? sensor.data : [];
      const sensorType = sensor.sensor_type;

      for (const d of rows) {
        if (typeof d.ts !== "number") {
          continue;
        }

        const weatherDoc = buildWeatherDoc(stationId, sensorType, d);

        bulkOps.push({
          updateOne: {
            filter: {
              station_id: stationId,
              sensor_type: sensorType,
              timestamp: d.ts
            },
            update: { $setOnInsert: weatherDoc },
            upsert: true
          }
        });
      }
    }

    if (bulkOps.length === 0) {
      console.log("⚠️ Nessun record valido da salvare");
      return;
    }

    const writeResult = await Weather.bulkWrite(bulkOps, { ordered: false });
    console.log(`✅ Salvati ${writeResult.upsertedCount || 0} nuovi dati`);

  } catch (err) {
    const status = err.response?.status;
    const apiMessage = err.response?.data?.message;

    if (status) {
      console.error(`❌ Errore fetch API (HTTP ${status}):`, apiMessage || err.message);

      if (status === 404) {
        console.error("ℹ️ Verifica STATION_ID: la stazione non risulta trovata per queste credenziali");
      }
    } else {
      console.error("❌ Errore fetch:", err.message);
    }
  } finally {
    isFetchRunning = false;
  }
}

async function start() {
  await connectMongo();

  // primo fetch immediato
  await fetchWeather();

  // fetch ogni 5 minuti
  cron.schedule(FETCH_CRON, () => {
    fetchWeather();
  });

  console.log(`🕒 Scheduler attivo: fetch ogni 5 minuti (${FETCH_CRON})`);
}

start();