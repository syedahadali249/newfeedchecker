const safeFetch = require("./utils/safeFetch");
const sleep = require("./utils/sleep");

async function warmup(config) {
  await safeFetch(
    null,
    config.smartcursorBase,
    {},
    config.retries
  );
}

async function createJob(config, url, since, logger) {
  const res = await safeFetch(
    null,
    `${config.smartcursorBase}/jobs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
      },
      body: JSON.stringify({
        url,
        since,
        goal: "Extract latest content",
        maxSteps: 20,
      }),
    },
    config.retries,
    logger
  );

  const data = await res.json();
  if (!data?.jobId) throw new Error("Job creation failed");

  return data.jobId;
}

async function waitForJob(config, jobId, logger) {
  const start = Date.now();

  while (Date.now() - start < 240000) {
    const res = await safeFetch(
      null,
      `${config.smartcursorBase}/jobs/${jobId}`,
      {
        headers: { "X-API-Key": config.apiKey },
      },
      config.retries,
      logger
    );

    const data = await res.json().catch(() => null);

    if (!data) continue;

    logger?.log("poll", data.status);

    if (["completed", "done", "succeeded"].includes(data.status)) {
      return;
    }

    if (["failed", "error"].includes(data.status)) {
      throw new Error(data.error || "Job failed");
    }

    await sleep(3000);
  }

  throw new Error("Job timeout");
}

async function getResult(config, jobId) {
  const res = await safeFetch(
    null,
    `${config.smartcursorBase}/jobs/${jobId}/result`,
    {
      headers: { "X-API-Key": config.apiKey },
    },
    config.retries
  );

  return res.json();
}

module.exports = {
  warmup,
  createJob,
  waitForJob,
  getResult,
};