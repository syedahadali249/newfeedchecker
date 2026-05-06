import { processFeeds } from "./src/index.js";

const run = async () => {
  const res = await processFeeds({
    feeds: [
      "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
      "https://app.realvision.com",
      "https://invalid-site-xyz.com"
    ]
  });

  console.log(JSON.stringify(res, null, 2));
};

run();
