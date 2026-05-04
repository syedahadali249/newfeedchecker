const { createConfig } = require("./config");
const { fetchData } = require("./pipeline");

class SmartFetcher {
  constructor(userConfig = {}) {
    this.config = createConfig(userConfig);
  }

  async fetch(url, options = {}) {
    if (!url) throw new Error("url is required");

    const since =
      options.since ||
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    return fetchData(this.config, url, since);
  }
}

module.exports = SmartFetcher;