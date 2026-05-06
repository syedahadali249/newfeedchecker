import * as cheerio from "cheerio";
import { normalizeUrl, cleanText } from "./helpers.js";

export const extractFromHtml = (html, baseUrl) => {
  const $ = cheerio.load(html);
  const items = [];

  $("a[href]").each((_, el) => {
    const href = normalizeUrl($(el).attr("href"), baseUrl);
    const title = cleanText($(el).text());

    if (href && title.length > 25) {
      items.push({ url: href, title });
    }
  });

  return items.slice(0, 25);
};

export const extractFromJsonLd = (html, baseUrl) => {
  const $ = cheerio.load(html);
  const items = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());

      const title = json.headline || json.name;
      const url = normalizeUrl(json.url, baseUrl);

      if (title && url) {
        items.push({ title, url });
      }
    } catch {}
  });

  return items;
};