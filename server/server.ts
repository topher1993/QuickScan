import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for images

// Database setup
const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT,
    amount REAL,
    name TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Gemini AI setup
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set!');
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Routes
app.get('/api/scans', (_req, res) => {
  db.all('SELECT * FROM scans ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/scans', (req, res) => {
  const { phoneNumber, amount, name } = req.body;
  db.run('INSERT INTO scans (phoneNumber, amount, name) VALUES (?, ?, ?)', [phoneNumber, amount, name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

app.post('/api/extract', async (req, res) => {
  try {
    console.log('Extract request received');
    const { base64Image, mimeType } = req.body;
    console.log('Request body:', { mimeType, base64ImageLength: base64Image?.length });

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.0-pro-vision',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Extract 'name', 'phoneNumber', and 'amount' for a payment receipt. Focus on mobile numbers. IMPORTANT: Format phoneNumber as a pure string of digits starting with 09 (e.g., 09171234567). If the image shows +639..., convert it to 09... Remove any spaces or dashes. The amount should be a pure number. If a field is missing, use 'Unknown' or 0.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The name of the person or entity",
            },
            phoneNumber: {
              type: Type.STRING,
              description: "The mobile phone number found (e.g., 09xxxxxxxxx)",
            },
            amount: {
              type: Type.NUMBER,
              description: "The monetary amount found",
            },
          },
          required: ["name", "phoneNumber", "amount"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      res.json(data);
    } else {
      res.status(500).json({ error: "No text returned from API" });
    }
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for Vercel
export default app;