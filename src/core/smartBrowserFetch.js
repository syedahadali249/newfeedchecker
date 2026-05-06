import axios from "axios";
import dotenv from "dotenv";
import { extractFromHtml, extractFromJsonLd } from "./extractors.js";

dotenv.config();

const SB_KEY = process.env.SCRAPINGBEE_API_KEY;
const OXY_USER = process.env.OXYLABS_USERNAME;
const OXY_PASS = process.env.OXYLABS_PASSWORD;

export const smartBrowserFetch = async (url) => {

  // 1️⃣ Direct HTML
  try {
    const res = await axios.get(url, { timeout: 10000 });

    let items = extractFromJsonLd(res.data, url);
    if (items.length) return items;

    items = extractFromHtml(res.data, url);
    if (items.length) return items;

  } catch {}

  // 2️⃣ ScrapingBee (JS rendering)
  try {
    const res = await axios.get("https://app.scrapingbee.com/api/v1/", {
      params: {
        api_key: SB_KEY,
        url,
        render_js: true,
        wait: 3000,
      },
      timeout: 15000,
    });

    let items = extractFromJsonLd(res.data, url);
    if (items.length) return items;

    items = extractFromHtml(res.data, url);
    if (items.length) return items;

  } catch {}

  // 3️⃣ Oxylabs fallback (LAST RESORT)
  try {
    const res = await axios.post(
      "https://realtime.oxylabs.io/v1/queries",
      {
        source: "universal",
        url: url,
        render: "html"
      },
      {
        auth: {
          username: OXY_USER,
          password: OXY_PASS,
        },
        timeout: 20000,
      }
    );

    const html = res.data?.results?.[0]?.content || "";

    let items = extractFromJsonLd(html, url);
    if (items.length) return items;

    items = extractFromHtml(html, url);
    return items;

  } catch {}

  return [];
};
