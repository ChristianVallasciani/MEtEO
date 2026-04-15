const mongoose = require("mongoose");

const weatherSchema = new mongoose.Schema({
  station_id: Number,
  sensor_type: Number,

  timestamp: {
    type: Number,
    index: true
  },

  temperature: Number,
  humidity: Number,
  wind_speed: Number,
  rain_rate: Number,

  raw: Object

}, { timestamps: true });

module.exports = mongoose.model("Weather", weatherSchema);