import { fetchUnified } from "./core/fetchUnified.js";

export const processFeeds = async (input) => {

  const feeds = input.feeds || [input.url];

  const results = await Promise.all(
    feeds.map(async (url) => {

      const result = await fetchUnified(url);

      return {
        url,
        ...result
      };

    })
  );

  return {
    success: results.some(r => r.success),
    results
  };
};