# URL Shortener (MERN)

Simple URL shortener with a React frontend and an Express + MongoDB backend.
Submission-ready and minimal. Built 2025-08-24.

## Features
- Shorten long URLs into compact codes.
- Redirect from `/:shortCode` to the original URL with 302.
- Admin list shows all URLs and click counts. Protected by a static admin key.

## API
- `POST /api/shorten` body `{ "longUrl": "https://example.com" }`
  - Returns `{ shortCode, shortUrl, longUrl }`
- `GET /:shortCode` 302 redirect to original
- `GET /api/admin/urls` requires header `x-admin-key: <ADMIN_KEY>`

## Local setup

Prereq: Node 18+, npm, and a MongoDB connection string (Atlas works).

1. Clone or extract this folder.
2. Server
   ```bash
   cd server
   cp .env.example .env
   # edit .env with MONGO_URI and ADMIN_KEY
   npm install
   npm run dev
   ```
   Server runs on http://localhost:5000

3. Client
   ```bash
   cd ../client
   npm install
   # optional: echo "VITE_ADMIN_KEY=<your_admin_key>" > .env
   npm run dev
   ```
   Frontend runs on http://localhost:5173 and proxies `/api` to the server.

## Test flow
1. Open the client at http://localhost:5173
2. Paste a long URL and click Shorten.
3. Click or copy the returned `shortUrl`.
4. Visit `shortUrl` in the browser to confirm redirect.
5. Open Admin section, enter your admin key, load URLs, confirm clicks.

## Deployment hints
- Host server on Render/Railway/Fly with `npm start`. Set env vars `PORT`, `MONGO_URI`, `ADMIN_KEY`.
- Host client on Vercel/Netlify. Set `VITE_API_BASE` only if you change API path. By default, the frontend uses relative `/api` which works if you reverse proxy through the client domain. Otherwise replace fetch URL with your server base.
- For a quick demo, you can deploy only the server and use its `shortUrl` directly.

## Video
Record a 30 to 60 second screen capture:
- Shorten a URL
- Open the short URL to show redirect
- Show the Admin table updating the click count

## Notes
- Codes are 7 chars from [0-9a-zA-Z].
- Duplicate long URLs return the first existing code.
- Input is normalized to have a scheme if missing.
