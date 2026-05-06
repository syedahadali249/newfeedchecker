
import { fetchUnified } from "./core/fetchUnified.js";

export const processFeeds = async (input) => {
  const feeds = input.feeds || [input.url];

  const results = await Promise.all(
    feeds.map(async (url) => {
      const valid = await fetchUnified(url);
      return { url, valid };
    })
  );

  return {
    success: results.some(r => r.valid),
    results
  };
};