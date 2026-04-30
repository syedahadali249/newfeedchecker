require("dotenv").config();
const http = require("http");
const fetch = require("node-fetch");

// ---------------- CONFIG ----------------
const RSS_ENDPOINT = process.env.RSS_ENDPOINT;
const SMARTCURSOR_BASE = process.env.SMARTCURSOR_BASE;
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

// ---------------- HELPERS ----------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function createState() {
  return { jobId: null, status: null, debug: [] };
}

function log(state, stage, data) {
  const entry = { stage, data, time: new Date().toISOString() };
  state.debug.push(entry);
  console.log(`\n[${stage}]`, data);
}

// ---------------- FETCH WITH TIMEOUT ----------------
async function fetchWithTimeout(url, options = {}, timeout = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ---------------- SAFE FETCH (RETRY) ----------------
async function safeFetch(state, url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (err) {
      log(state, "fetch_retry", { attempt: i + 1, error: err.message });
      if (i === retries - 1) throw err;
      await sleep(3000);
    }
  }
}

// ---------------- WARMUP ----------------
async function warmup(state) {
  try {
    log(state, "warmup_start", SMARTCURSOR_BASE);
    await fetchWithTimeout(SMARTCURSOR_BASE, {}, 60000);
    log(state, "warmup_success", "Server awake");
  } catch (err) {
    log(state, "warmup_fail", err.message);
  }
}

// ---------------- CREATE JOB ----------------
async function createJob(state, url, since) {
  const res = await safeFetch(state, `${SMARTCURSOR_BASE}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      url,
      since,
      goal: "Extract latest content",
      maxSteps: 20,
    }),
  });

  const data = await res.json().catch(() => null);
  log(state, "job_created", data);

  if (!res.ok || !data?.jobId) throw new Error("Job creation failed");

  return data.jobId;
}

// ---------------- WAIT FOR JOB ----------------
async function waitForJob(state, jobId, timeout = 240000) {
  const start = Date.now();
  const successStates = ["completed", "succeeded", "done"];
  const failureStates = ["failed", "error"];

  while (Date.now() - start < timeout) {
    try {
      const res = await safeFetch(state, `${SMARTCURSOR_BASE}/jobs/${jobId}`, {
        headers: { "X-API-Key": API_KEY },
      });

      const data = await res.json().catch(() => null);

      if (!data) {
        log(state, "poll_invalid", "No JSON");
        await sleep(3000);
        continue;
      }

      state.status = data.status;
      log(state, "poll", {
        status: data.status,
        step: data.progress?.step,
        message: data.progress?.message,
      });

      if (successStates.includes(data.status)) {
        log(state, "job_done", data.status);
        return;
      }

      if (failureStates.includes(data.status)) {
        throw new Error(data.error || "Job failed");
      }
    } catch (err) {
      log(state, "poll_error", err.message);
    }

    await sleep(4000);
  }

  throw new Error("Job timeout");
}

// ---------------- GET RESULT ----------------
async function getResult(state, jobId) {
  await sleep(2000);

  const res = await safeFetch(
    state,
    `${SMARTCURSOR_BASE}/jobs/${jobId}/result`,
    { headers: { "X-API-Key": API_KEY } }
  );

  const data = await res.json().catch(() => null);
  log(state, "result", data);

  if (!res.ok) throw new Error("Failed to fetch result");

  return data;
}

// ---------------- RSS ----------------
async function fetchRSS(state, url, since) {
  try {
    const res = await safeFetch(state, RSS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({ url, since }),
    });

    const data = await res.json().catch(() => null);
    log(state, "rss", data);

    if (res.ok && data && Object.keys(data).length > 0) return data;

    return null;
  } catch (err) {
    log(state, "rss_error", err.message);
    return null;
  }
}

// ---------------- CORE PIPELINE ----------------
async function fetchData(url, since) {
  const state = createState();

  // 1️⃣ Try RSS
  const rss = await fetchRSS(state, url, since);
  if (rss) {
    return { source: "rss", data: rss, debug: state.debug };
  }

  log(state, "fallback", "Using SmartCursor");

  // 2️⃣ Warmup
  await warmup(state);

  // 3️⃣ Create job
  const jobId = await createJob(state, url, since);
  state.jobId = jobId;

  // 4️⃣ Wait
  await waitForJob(state, jobId);

  // 5️⃣ Get result
  const result = await getResult(state, jobId);

  return { source: "smartcursor", data: result, debug: state.debug };
}

// ---------------- PARSE REQUEST BODY ----------------
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// ---------------- HTTP SERVER ----------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // POST /fetch  →  { "url": "...", "since": "..." }
  if (req.method === "POST" && url.pathname === "/fetch") {
    try {
      const body = await parseBody(req);

      if (!body.url) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Missing required field: url" }));
      }

      const since = body.since || new Date(Date.now() - 86400000).toISOString(); // default: last 24h

      console.log(`\n[request] url=${body.url} since=${since}`);

      const result = await fetchData(body.url, since);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result, null, 2));

    } catch (err) {
      console.error("[error]", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }

  // GET /health  →  quick liveness check
  } else if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));

  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use POST /fetch or GET /health" }));
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`   POST /fetch   { "url": "...", "since": "..." }`);
  console.log(`   GET  /health\n`);
});