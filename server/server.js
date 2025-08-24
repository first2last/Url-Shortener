const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { customAlphabet } = require('nanoid');
const ShortUrl = require('./models/ShortUrl');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// DB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment');
  process.exit(1);
}
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Helpers
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 7);

function normalizeUrl(url) {
  try {
    // If it parses, great. If scheme missing, add http://
    let u;
    try {
      u = new URL(url);
    } catch {
      u = new URL('http://' + url);
    }
    return u.toString();
  } catch {
    return null;
  }
}

// Routes


app.get("/", (req, res) => {
  res.send("URL Shortener API is running ✅");
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Admin list route (optional bonus)
app.get('/api/admin/urls', async (req, res) => {
  try {
    const key = req.header('x-admin-key');
    if (!key || key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const urls = await ShortUrl.find().sort({ createdAt: -1 });
    res.json(urls.map(u => ({
      id: u._id,
      shortCode: u.shortCode,
      longUrl: u.longUrl,
      clicks: u.clicks,
      createdAt: u.createdAt,
      shortUrl: `${req.protocol}://${req.get('host')}/${u.shortCode}`
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a short code
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body || {};
    if (!longUrl) {
      return res.status(400).json({ message: 'longUrl is required' });
    }

    const normalized = normalizeUrl(longUrl);
    if (!normalized) {
      return res.status(400).json({ message: 'Invalid URL' });
    }

    // Optionally reuse existing mapping
    const existing = await ShortUrl.findOne({ longUrl: normalized });
    if (existing) {
      return res.json({
        shortCode: existing.shortCode,
        shortUrl: `${req.protocol}://${req.get('host')}/${existing.shortCode}`,
        longUrl: existing.longUrl
      });
    }

    let code;
    // Ensure uniqueness
    for (let i = 0; i < 5; i++) {
      code = nanoid();
      const clash = await ShortUrl.findOne({ shortCode: code });
      if (!clash) break;
      code = null;
    }
    if (!code) {
      return res.status(500).json({ message: 'Failed to generate unique code' });
    }

    const doc = await ShortUrl.create({ shortCode: code, longUrl: normalized });
    return res.status(201).json({
      shortCode: doc.shortCode,
      shortUrl: `${req.protocol}://${req.get('host')}/${doc.shortCode}`,
      longUrl: doc.longUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Redirect route
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const doc = await ShortUrl.findOne({ shortCode });
    if (!doc) {
      return res.status(404).send('Short URL not found');
    }
    // Increment clicks but don't block redirect on failure
    ShortUrl.updateOne({ _id: doc._id }, { $inc: { clicks: 1 } }).catch(() => {});
    return res.redirect(302, doc.longUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
