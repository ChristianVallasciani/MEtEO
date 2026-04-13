require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const Weather = require('./models/Weather');

const app = express();
app.use(express.json());

const weatherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const PORT = process.env.PORT || 3000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

if (!OPENWEATHER_API_KEY) {
  console.error('Error: OPENWEATHER_API_KEY is not set in the environment.');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in the environment.');
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// GET /weather?city=<cityName>
// Fetches current weather from OpenWeatherMap, stores it in DB, and returns it
app.get('/weather', weatherLimiter, async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'Query parameter "city" is required' });
  }

  try {
    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          q: city,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          lang: 'it',
        },
      }
    );

    const data = response.data;

    const weatherRecord = await Weather.create({
      city: data.name,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      fetchedAt: new Date(),
    });

    return res.json(weatherRecord);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: `City "${city}" not found` });
    }
    console.error('Error fetching weather data:', err.message);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// GET /weather/history?city=<cityName>
// Returns the last 10 stored weather records for a city
app.get('/weather/history', weatherLimiter, async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'Query parameter "city" is required' });
  }

  try {
    const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const records = await Weather.find({ city: new RegExp(`^${escapedCity}$`, 'i') })
      .sort({ fetchedAt: -1 })
      .limit(10);

    return res.json(records);
  } catch (err) {
    console.error('Error retrieving weather history:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve weather history' });
  }
});

app.listen(PORT, () => {
  console.log(`MEtEO server running on port ${PORT}`);
});
