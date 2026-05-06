
import axios from "axios";
import xml2js from "xml2js";
import { looksLikeXml } from "./helpers.js";

export const fetchRSS = async (url) => {
  try {
    const res = await axios.get(url, { timeout: 10000 });

    if (!looksLikeXml(res.data, res.headers["content-type"])) {
      return [];
    }

    const parsed = await xml2js.parseStringPromise(res.data, {
      explicitArray: false,
    });

    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    return Array.isArray(items) ? items : [items];
  } catch {
    return [];
  }
};