Here is your clean, properly formatted `README.md` file (ready to copy-paste into your project):

---

```md
# SmartCursor RSS Hybrid SDK

A lightweight Node.js SDK that provides a hybrid data-fetching system using **RSS first**, and **SmartCursor fallback when RSS has no results**.

It is designed to unify multiple data sources behind a single simple API.

---

## 📁 Project Architecture

```

src/
├── SmartFetcher.js     # Main SDK class (public API)
├── core.js             # Reserved (currently unused)
├── config.js           # Configuration validation & defaults
├── pipeline.js         # Orchestrates RSS → SmartCursor flow
├── rss.js              # RSS fetching implementation
├── smartcursor.js      # SmartCursor job-based workflow
└── utils/
├── fetchWithTimeout.js
├── safeFetch.js
├── logger.js
└── sleep.js

index.js                # SDK entry point (exports SmartFetcher)
package.json            # Package metadata & dependencies

````

---

## ⚙️ Installation

```bash
npm install
````

> Uses `node-fetch@^2.7.0`

---

## 🚀 Usage

### Import SDK

```js
const SmartFetcher = require("./index");
```

---

### Create Instance

```js
const fetcher = new SmartFetcher({
  smartcursorBase: "https://api.smartcursor.io",
  apiKey: "YOUR_API_KEY",
  rssEndpoint: "https://your-rss-endpoint.com",
  timeout: 60000,
  retries: 3,
});
```

---

## 📥 Fetch Data

```js
const result = await fetcher.fetch("https://example.com/feed");

console.log(result);
```

---

## 🔧 Fetch Options

```js
fetch(url, {
  since: Date.now() - 24 * 60 * 60 * 1000 // optional
});
```

### Default behavior:

* If `since` is not provided → SDK automatically uses **last 24 hours**

---

## 🔄 How It Works (Pipeline Flow)

The SDK uses a smart fallback pipeline:

### 1. RSS First

* `pipeline.js` calls `rss.js`
* Sends:

  * `url`
  * `since`
* If RSS returns data → return immediately

---

### 2. SmartCursor Fallback

If RSS returns no data:

Workflow:

```
warmup(config)
→ createJob(config, url, since)
→ waitForJob(jobId)
→ getResult(jobId)
```

---

## 📤 Response Format

All responses are normalized:

```js
{
  source: "rss" | "smartcursor",
  data: { ... }
}
```

---

## 🧠 SmartCursor Workflow Details

The SmartCursor module:

* Prepares environment (`warmup`)
* Creates a job for URL processing
* Polls job status until completion
* Fetches final result

---

## 🌐 RSS Module

* Uses `rssEndpoint`
* Sends POST request with:

  * `url`
  * `since`

Returns:

* Parsed JSON data OR `null`

---

## 🔁 Retry & Timeout System

### safeFetch

* Automatically retries failed requests
* Controlled by `retries` config

### fetchWithTimeout

* Uses `AbortController`
* Prevents hanging requests

---

## 🧰 Utilities

| File                | Purpose               |
| ------------------- | --------------------- |
| logger.js           | Debug logging         |
| sleep.js            | Delay/pause execution |
| safeFetch.js        | Retry wrapper         |
| fetchWithTimeout.js | Timeout-safe fetch    |

---

## ⚙️ Configuration

### Required

* `smartcursorBase`
* `apiKey`

### Optional

* `rssEndpoint` → RSS service URL
* `timeout` → default `60000ms`
* `retries` → default `3`

---

## 📦 Entry Point Flow

```
index.js
   ↓
SmartFetcher.js
   ↓
pipeline.js
   ↓
rss.js → (success)
   ↓
smartcursor.js → (fallback)
```

---

## 📌 Notes

* `core.js` is currently unused (reserved for future expansion)
* RSS is always the primary data source
* SmartCursor is only used when RSS fails
* Fully modular design for easy extension

---

## 🧪 Example Output

### RSS Success

```js
{
  source: "rss",
  data: { items: [...] }
}
```

### SmartCursor Fallback

```js
{
  source: "smartcursor",
  data: { results: [...] }
}
```
