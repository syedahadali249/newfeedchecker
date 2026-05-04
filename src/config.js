function createConfig(userConfig = {}) {
  const config = {
    rssEndpoint: userConfig.rssEndpoint,
    smartcursorBase: userConfig.smartcursorBase,
    apiKey: userConfig.apiKey,
    timeout: userConfig.timeout || 60000,
    retries: userConfig.retries || 3,
  };

  if (!config.smartcursorBase) {
    throw new Error("smartcursorBase is required");
  }

  if (!config.apiKey) {
    throw new Error("apiKey is required");
  }

  return config;
}

module.exports = { createConfig };