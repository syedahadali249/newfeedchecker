# 📡 Fetch Data HTTP Server

A Node.js HTTP server that fetches content from any URL by first trying an RSS feed, then falling back to a SmartCursor browser automation job. All configuration is loaded from a `.env` file.

---

## 🗂️ Project Structure

```
project/
├── server.js        # Main HTTP server & pipeline logic
├── .env             # Environment variables (do not commit)
├── .env.example     # Example env file (safe to commit)
├── package.json     # Dependencies
└── README.md
```

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
RSS_ENDPOINT=https://genie-rss-5i00.onrender.com/api/rss/fetch
SMARTCURSOR_BASE=https://smartcursorbrowser.onrender.com
API_KEY=your_api_key_here
PORT=3000
```

| Variable          | Description                              | Default |
|-------------------|------------------------------------------|---------|
| `RSS_ENDPOINT`    | URL of the RSS fetch API                 | —       |
| `SMARTCURSOR_BASE`| Base URL of the SmartCursor browser API  | —       |
| `API_KEY`         | Shared API key for both services         | —       |
| `PORT`            | Port the HTTP server listens on          | `3000`  |

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

### 3. Start the server

```bash
node server.js
```

You should see:

```
✅ Server running on http://localhost:3000
   POST /fetch   { "url": "...", "since": "..." }
   GET  /health
```

---

## 🚀 API Reference

### `POST /fetch`

Fetches content from a given URL. Tries RSS first; falls back to SmartCursor browser automation if RSS returns nothing.

**Request Body (JSON):**

| Field   | Type   | Required | Description                                           |
|---------|--------|----------|-------------------------------------------------------|
| `url`   | string | ✅ Yes   | The URL to fetch content from                         |
| `since` | string | ❌ No    | ISO 8601 timestamp. Defaults to last 24 hours if omitted |

**Example Request:**

```bash
curl -X POST http://localhost:3000/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.cnbc.com/finance",
    "since": "2026-04-29T00:00:00Z"
  }'
```

**Example Response (RSS source):**

```json
{
  "source": "rss",
  "data": { ... },
  "debug": [ ... ]
}
```

**Example Response (SmartCursor source):**

```json
{
  "source": "smartcursor",
  "data": { ... },
  "debug": [ ... ]
}
```

| Field    | Description                                              |
|----------|----------------------------------------------------------|
| `source` | Either `"rss"` or `"smartcursor"` — which pipeline was used |
| `data`   | The fetched content                                      |
| `debug`  | Full log of every internal step with timestamps          |

---

### `GET /health`

Quick liveness check to confirm the server is running.

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-30T10:00:00.000Z"
}
```

---

## 🔄 How the Pipeline Works

```
POST /fetch
    │
    ▼
┌─────────────┐
│  Try RSS    │ ──► RSS returns data? ──► Return { source: "rss", data }
└─────────────┘
    │ (no data)
    ▼
┌──────────────────┐
│ Warmup SmartCursor│  (wakes up the render server)
└──────────────────┘
    │
    ▼
┌──────────────┐
│  Create Job  │  POST /jobs  →  jobId
└──────────────┘
    │
    ▼
┌──────────────┐
│  Poll Job    │  GET /jobs/:jobId  (up to 4 min)
└──────────────┘
    │ (completed)
    ▼
┌──────────────┐
│  Get Result  │  GET /jobs/:jobId/result
└──────────────┘
    │
    ▼
Return { source: "smartcursor", data }
```

---

## 🛠️ Error Handling

| Scenario                     | Behaviour                                      |
|------------------------------|------------------------------------------------|
| Missing `url` in body        | `400` — `{ "error": "Missing required field: url" }` |
| Invalid JSON body            | `500` — `{ "error": "Invalid JSON body" }`     |
| RSS fails silently           | Falls through to SmartCursor automatically     |
| SmartCursor job times out    | `500` — `{ "error": "Job timeout" }`           |
| Network error (with retries) | Retries up to 3 times with 3s delay, then `500`|
| Unknown route                | `404` — `{ "error": "Not found..." }`          |

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "dotenv": "^16.0.0",
    "node-fetch": "^2.7.0"
  }
}
```

Install with:

```bash
npm install dotenv node-fetch
```

> **Note:** Use `node-fetch` v2 (CommonJS). v3+ is ESM-only and requires `import` syntax.

---

## 🔒 Security Notes

- Keep your `API_KEY` secret — store it only in `.env`
- Add `.env` to your `.gitignore`:
  ```
  .env
  ```
- Create a `.env.example` with placeholder values for teammates:
  ```env
  RSS_ENDPOINT=
  SMARTCURSOR_BASE=
  API_KEY=
  PORT=3000
  ```

---
