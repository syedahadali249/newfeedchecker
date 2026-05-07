import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const scrapingBeeProvider = async (url) => {

  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  const endpoint =
    `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=true`;

  const res = await axios.get(endpoint, {
    timeout: 20000
  });

  return res.data;
};