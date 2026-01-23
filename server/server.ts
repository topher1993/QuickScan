import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Gemini AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Function to extract data from receipt using Gemini AI
const extractReceiptData = async (base64Image: string, mimeType: string) => {
  try {
    const prompt = `Analyze this receipt image and extract the following information:
- Merchant/Store Name
- Phone Number (if visible)
- Payment Amount (the total amount paid)

Return the information in valid JSON format with these exact keys:
{
  "name": "merchant name",
  "phoneNumber": "phone number or 'Unknown'",
  "amount": number (just the number, no currency symbols)
}

If any information is not found, use "Unknown" for strings or 0 for amount.`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || 'Unknown',
        phoneNumber: parsed.phoneNumber || 'Unknown',
        amount: typeof parsed.amount === 'number' ? parsed.amount : 0
      };
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('Gemini extraction error:', error);
    throw error;
  }
};

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
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Use Gemini AI to extract data from the image
    const extractedData = await extractReceiptData(base64Image, mimeType);
    console.log('Extracted data:', extractedData);

    res.json(extractedData);
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