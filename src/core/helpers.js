import crypto from "crypto";

export const hashId = (...parts) =>
  crypto.createHash("md5").update(parts.join("")).digest("hex");

export const cleanText = (value = "") =>
  String(value).replace(/\s+/g, " ").trim();

export const normalizeUrl = (href, baseUrl) => {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return "";
  }
};

export const looksLikeXml = (text = "", contentType = "") => {
  const t = text.toLowerCase();
  const ct = contentType.toLowerCase();

  return (
    ct.includes("xml") ||
    t.includes("<rss") ||
    t.includes("<feed")
  );
};
