import { fetchRSS } from "./rss.js";
import { extractFromHtml } from "./extractors.js";

import { axiosProvider } from "../providers/axiosProvider.js";
import { scrapingBeeProvider } from "../providers/scrapingBeeProvider.js";
import { oxylabsProvider } from "../providers/oxylabsProvider.js";

export const fetchUnified = async (url) => {

  console.log(`Checking: ${url}`);

  const providers = [
    {
      name: "axios",
      handler: axiosProvider
    },
    {
      name: "scrapingbee",
      handler: scrapingBeeProvider
    },
    {
      name: "oxylabs",
      handler: oxylabsProvider
    }
  ];

  for (const provider of providers) {

    try {

      console.log(`Trying provider: ${provider.name}`);

      const html = await provider.handler(url);

      // RSS CHECK
      const rss = await fetchRSS(url);

      if (rss.length > 0) {

        return {
          success: rss.length > 1,
          classification: "rss",
          source: provider.name,
          itemsFound: rss.length
        };

      }

      // HTML CHECK
      const items = extractFromHtml(html, url);

      if (items.length > 0) {

        return {
          success: items.length > 1,
          classification: "webpage",
          source: provider.name,
          itemsFound: items.length
        };

      }

    } catch (err) {

      console.log(`${provider.name} failed`);

    }

  }

  return {
    success: false,
    classification: "invalid",
    source: null,
    itemsFound: 0
  };
};