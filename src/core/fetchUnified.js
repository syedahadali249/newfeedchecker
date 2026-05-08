import { fetchRSS } from "./rss.js";
import { extractFromHtml } from "./extractors.js";

import { axiosProvider } from "../providers/axiosProvider.js";
import { scrapingBeeProvider } from "../providers/scrapingBeeProvider.js";
import { oxylabsProvider } from "../providers/oxylabsProvider.js";

import pLimit from "p-limit";

// ===== CONFIG =====
const MAX_CONCURRENCY = 10;        // dynamic threads
const REQUEST_TIMEOUT = 8000;    // ms
const RETRY_COUNT = 3;

// ===== TIMEOUT WRAPPER =====
const withTimeout = (promise, ms, providerName) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${providerName} timeout`)), ms)
  );

  return Promise.race([promise, timeout]);
};

// ===== RETRY WRAPPER =====
const withRetry = async (fn, retries = 1) => {
  let lastError;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
};

// ===== CORE ENGINE =====
export const fetchUnified = async (url) => {
  console.log(`🔍 Checking: ${url}`);

  const providers = [
    { name: "axios", handler: axiosProvider },
    { name: "scrapingbee", handler: scrapingBeeProvider },
    { name: "oxylabs", handler: oxylabsProvider }
  ];

  const limit = pLimit(MAX_CONCURRENCY);

  // 🚀 shared RSS fetch (runs once)
  const rssPromise = fetchRSS(url);

  // ===== PROVIDER TASK =====
  const runProvider = (provider) =>
    limit(async () => {
      const start = Date.now();

      try {
        console.log(`⚡ ${provider.name} started`);

        const html = await withRetry(
          () => withTimeout(provider.handler(url), REQUEST_TIMEOUT, provider.name),
          RETRY_COUNT
        );

        // ===== RSS CHECK (shared) =====
        const rss = await rssPromise;
        if (rss.length > 0) {
          return {
            success: rss.length > 1,
            classification: "rss",
            source: provider.name,
            itemsFound: rss.length,
            time: Date.now() - start
          };
        }

        // ===== HTML EXTRACTION =====
        const items = extractFromHtml(html, url);

        if (items.length > 0) {
          return {
            success: items.length > 1,
            classification: "webpage",
            source: provider.name,
            itemsFound: items.length,
            time: Date.now() - start
          };
        }

        throw new Error("No usable data");

      } catch (err) {
        console.log(`❌ ${provider.name} failed: ${err.message}`);

        throw {
          provider: provider.name,
          error: err.message
        };
      }
    });

  // ===== EXECUTION =====
  const tasks = providers.map(runProvider);

  try {
    // 🏆 fastest successful provider wins
    const result = await Promise.any(tasks);

    console.log(`✅ Winner: ${result.source} (${result.time}ms)`);

    return result;

  } catch (allFailed) {
    console.log("🚫 All providers failed");

    return {
      success: false,
      classification: "invalid",
      source: null,
      itemsFound: 0
    };
  }
};