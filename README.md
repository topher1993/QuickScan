<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13wql6LMBuYX4hM5nNTwajmukt85ILMC_

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env](.env) to your Google Gemini API key
3. Run both servers:
   `npm run dev:full`

## Backend API

The server provides endpoints to store and retrieve scan data:

- `GET /api/scans` - Retrieve all stored scans
- `POST /api/scans` - Save a new scan (body: { phoneNumber, amount, name })
- `POST /api/extract` - Extract data from image (body: { base64Image, mimeType })
