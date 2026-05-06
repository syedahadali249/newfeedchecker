import { fetchRSS } from "./rss.js";
import { smartBrowserFetch } from "./smartBrowserFetch.js";

export const fetchUnified = async (url) => {
  console.log(`Checking: ${url}`);

  try {
    // 1️⃣ RSS FIRST
    const rss = await fetchRSS(url);
    if (rss.length > 0) {
      console.log("✅ RSS works");
      return true;
    }

    console.log("⚠️ RSS failed → Smart Browser");

    // 2️⃣ SMART BROWSER
    const browser = await smartBrowserFetch(url);
    if (browser.length > 0) {
      console.log("✅ Smart Browser works");
      return true;
    }

    console.log("❌ No content found");
    return false;

  } catch (err) {
    console.log("❌ Error:", err.message);
    return false;
  }
};
