import * as cheerio from "cheerio";

export const extractFromHtml = (html, url) => {

  const $ = cheerio.load(html);

  const title = $("title").text().trim();

  if (!title) return [];

  return [{
    title,
    url
  }];
};

export const extractFromJsonLd = (html, url) => {

  const $ = cheerio.load(html);

  const scripts = $('script[type="application/ld+json"]');

  const items = [];

  scripts.each((_, el) => {

    try {

      const json = JSON.parse($(el).html());

      if (json.headline || json.name) {

        items.push({
          title: json.headline || json.name,
          url
        });

      }

    } catch {}

  });

  return items;
};