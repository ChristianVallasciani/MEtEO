require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Weather = require('./models/Weather');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meteo';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window per IP
});
app.use('/weather', limiter);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET all weather records
app.get('/weather', async (req, res) => {
  try {
    const records = await Weather.find().sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET weather record by ID
app.get('/weather/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  try {
    const record = await Weather.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new weather record
app.post('/weather', async (req, res) => {
  try {
    const { city, temperature, humidity, description, date } = req.body;
    const record = new Weather({ city, temperature, humidity, description, date });
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update a weather record
app.put('/weather/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  try {
    const { city, temperature, humidity, description } = req.body;
    const record = await Weather.findByIdAndUpdate(
      req.params.id,
      { $set: { city, temperature, humidity, description } },
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a weather record
app.delete('/weather/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  try {
    const record = await Weather.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
