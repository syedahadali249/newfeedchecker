import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const oxylabsProvider = async (url) => {

  const username = process.env.OXYLABS_USERNAME;
  const password = process.env.OXYLABS_PASSWORD;

  const res = await axios.post(
    "https://realtime.oxylabs.io/v1/queries",
    {
      source: "universal",
      url,
      render: "html"
    },
    {
      auth: {
        username,
        password
      },
      timeout: 20000
    }
  );

  return res.data.results[0].content;
};