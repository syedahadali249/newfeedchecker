import axios from "axios";

export const axiosProvider = async (url) => {

  const res = await axios.get(url, {
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  return res.data;
};