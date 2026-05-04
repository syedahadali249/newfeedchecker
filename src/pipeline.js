const { fetchRSS } = require("./rss");
const {
  warmup,
  createJob,
  waitForJob,
  getResult,
} = require("./smartcursor");

const { createLogger } = require("./utils/logger");

async function fetchData(config, url, since) {
  const logger = createLogger(true);

  // 1. RSS first
  const rss = await fetchRSS(config, logger, url, since);
  if (rss) {
    return {
      source: "rss",
      data: rss,
    };
  }

  logger.log("fallback", "smartcursor");

  // 2. SmartCursor flow
  await warmup(config);

  const jobId = await createJob(config, url, since, logger);

  await waitForJob(config, jobId, logger);

  const result = await getResult(config, jobId);

  return {
    source: "smartcursor",
    data: result,
  };
}

module.exports = { fetchData };