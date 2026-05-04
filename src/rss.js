const safeFetch = require("./utils/safeFetch");

async function fetchRSS(config, logger, url, since) {
  if (!config.rssEndpoint) return null;

  try {
    const res = await safeFetch(
      null,
      config.rssEndpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
        },
        body: JSON.stringify({ url, since }),
      },
      config.retries,
      logger
    );

    const data = await res.json().catch(() => null);

    logger?.log("rss", data);

    if (res.ok && data && Object.keys(data).length) {
      return data;
    }

    return null;
  } catch (err) {
    logger?.log("rss_error", err.message);
    return null;
  }
}

module.exports = { fetchRSS };