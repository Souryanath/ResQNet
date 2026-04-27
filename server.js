import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import { UserProfile } from './models/UserProfile.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MongoDB / Local Cloud Database Setup ---
const MONGO_URI = process.env.MONGO_URI;
const LOCAL_DB_PATH = path.join(__dirname, 'developer-database.json');

// Initialize local database if it doesn't exist
if (!MONGO_URI && !fs.existsSync(LOCAL_DB_PATH)) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ profiles: [] }, null, 2));
}

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Cloud Database'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.log('⚠️ No MONGO_URI found in .env. Using Local File Database (developer-database.json)');
}

// --- Database API Endpoints for User Profiles ---

// 1. Save or Update User Profile
app.post('/api/profiles', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    if (MONGO_URI) {
      // Upsert (Update if exists, Insert if not)
      const profile = await UserProfile.findOneAndUpdate(
        { userId },
        { ...profileData, userId },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ message: 'Profile saved to cloud', profile });
    } else {
      // Local Database Fallback
      const db = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      const index = db.profiles.findIndex(p => p.userId === userId);
      
      const newProfile = { ...profileData, userId, updatedAt: new Date().toISOString() };
      if (index >= 0) db.profiles[index] = newProfile;
      else db.profiles.push(newProfile);
      
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
      return res.status(200).json({ message: 'Profile saved locally', profile: newProfile });
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// 2. Fetch User Profile
app.get('/api/profiles/:userId', async (req, res) => {
  try {
    if (MONGO_URI) {
      const profile = await UserProfile.findOne({ userId: req.params.userId });
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json(profile);
    } else {
      // Local Database Fallback
      const db = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      const profile = db.profiles.find(p => p.userId === req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json(profile);
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// --- MongoDB Schemas ---
const incidentSchema = new mongoose.Schema({
  id: String,
  category: String,
  status: String,
  timestamp: String,
  resolvedAt: String,
  description: String,
  severity: String,
  location: Object,
  userProfile: Object,
  messages: Array,
  routeETA: Number
}, { strict: false });
const Incident = mongoose.model('Incident', incidentSchema);

// 3. Fetch All Profiles (For Dispatcher Dashboard)
app.get('/api/profiles', async (req, res) => {
  try {
    if (MONGO_URI) {
      const profiles = await UserProfile.find({});
      return res.status(200).json(profiles);
    } else {
      const db = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      return res.status(200).json(db.profiles || []);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// --- Database API Endpoints for Incidents ---

// Fetch All Incidents
app.get('/api/incidents', async (req, res) => {
  try {
    if (MONGO_URI) {
      const incidents = await Incident.find({});
      return res.status(200).json(incidents);
    } else {
      const db = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      return res.status(200).json(db.incidents || []);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Create New Incident
app.post('/api/incidents', async (req, res) => {
  try {
    const incidentData = req.body;
    if (MONGO_URI) {
      const newIncident = new Incident(incidentData);
      await newIncident.save();
      return res.status(200).json(newIncident);
    } else {
      const db = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      if (!db.incidents) db.incidents = [];
      db.incidents.push(incidentData);
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
      return res.status(200).json(incidentData);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// Update Incident (Status, Messages, etc)
app.put('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (MONGO_URI) {
      const updated = await Incident.findOneAndUpdate({ id }, updateData, { new: true });
      return res.status(200).json(updated);
    } else {
      const db = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      if (!db.incidents) db.incidents = [];
      const index = db.incidents.findIndex(inc => inc.id === id);
      if (index >= 0) {
        db.incidents[index] = { ...db.incidents[index], ...updateData };
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
        return res.status(200).json(db.incidents[index]);
      }
      return res.status(404).json({ error: 'Incident not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// --- Gemini AI Endpoint ---

// Initialize Gemini with the API key from the environment (not exposed to frontend)
const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          
          if (!apiRes.statusCode || apiRes.statusCode >= 400) {
            return res.status(apiRes.statusCode || 500).json({ error: parsedData.error?.message || 'Failed to fetch from Gemini API' });
          }

          const responseText = parsedData.candidates[0].content.parts[0].text;
          res.json({ text: responseText });
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse Google API response' });
        }
      });
    });

    apiReq.on('error', (e) => {
      console.error('HTTPS request error:', e);
      res.status(500).json({ error: e.message || 'HTTPS request failed' });
    });

    apiReq.write(postData);
    apiReq.end();

  } catch (error) {
    console.error('Error calling Gemini:', error);
    res.status(500).json({ error: error.message || 'Failed to generate content' });
  }
});

// --- Serve Frontend in Production ---
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 ResQNet Backend running on port ${port} (0.0.0.0)`);
});
