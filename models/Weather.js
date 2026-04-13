const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    feelsLike: {
      type: Number,
    },
    humidity: {
      type: Number,
    },
    description: {
      type: String,
    },
    windSpeed: {
      type: Number,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Weather', weatherSchema);
