const fetchWithTimeout = require("./fetchWithTimeout");
const sleep = require("./sleep");

async function safeFetch(state, url, options = {}, retries = 3, logger) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (err) {
      logger?.log("fetch_retry", {
        attempt: i + 1,
        error: err.message,
      });

      if (i === retries - 1) throw err;

      await sleep(2000);
    }
  }
}

module.exports = safeFetch;