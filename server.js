import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import KlaviyoService from './services/klaviyoService.js';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const KLAVIYO_API_KEY = process.env.VITE_KLAVIYO_API_KEY;

app.use(cors());
app.use(express.json());

const klaviyo = new KlaviyoService(KLAVIYO_API_KEY);

// ==================== List Management ====================

// Get all lists
app.get('/api/klaviyo/lists', async (req, res) => {
  try {
    const lists = await klaviyo.getLists();
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list by ID
app.get('/api/klaviyo/lists/:listId', async (req, res) => {
  try {
    const list = await klaviyo.getListById(req.params.listId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe user to list
app.post('/api/klaviyo/subscribe', async (req, res) => {
  try {
    const { email, firstName, lastName, listId, phoneNumber, properties } = req.body;
    const result = await klaviyo.subscribeToList(email, listId, {
      firstName,
      lastName,
      phoneNumber,
      properties,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe user from list
app.post('/api/klaviyo/unsubscribe', async (req, res) => {
  try {
    const { email, listId } = req.body;
    const result = await klaviyo.unsubscribeFromList(email, listId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Flow Triggers ====================

// Get all flows
app.get('/api/klaviyo/flows', async (req, res) => {
  try {
    const flows = await klaviyo.getFlows();
    res.json(flows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger a flow via a metric event (Klaviyo has no direct flow trigger REST endpoint).
// In Klaviyo, set up a metric-triggered flow that listens for the event name you send.
app.post('/api/klaviyo/trigger-flow', async (req, res) => {
  try {
    const { eventName, email, properties } = req.body;
    const result = await klaviyo.triggerFlowViaEvent(email, eventName, properties);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Event Tracking ====================

// Track a custom event
app.post('/api/klaviyo/track-event', async (req, res) => {
  try {
    const { email, eventName, properties } = req.body;
    const result = await klaviyo.trackEvent(email, eventName, properties);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Profiles ====================

// Get profile by email
app.get('/api/klaviyo/profile/:email', async (req, res) => {
  try {
    const profile = await klaviyo.getProfileByEmail(req.params.email);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update profile (upsert)
app.post('/api/klaviyo/profile', async (req, res) => {
  try {
    const { email, properties, firstName, lastName, phoneNumber } = req.body;
    const attrs = {};
    if (firstName) attrs.first_name = firstName;
    if (lastName) attrs.last_name = lastName;
    if (phoneNumber) attrs.phone_number = phoneNumber;
    if (properties) attrs.properties = properties;
    const result = await klaviyo.createOrUpdateProfile(email, attrs);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all segments
app.get('/api/klaviyo/segments', async (req, res) => {
  try {
    const segments = await klaviyo.getSegments();
    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Health Check ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Klaviyo server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${KLAVIYO_API_KEY ? '✓' : '✗'}`);
});
