export const looksLikeXml = (data, contentType = "") => {

  if (!data) return false;

  const text = typeof data === "string"
    ? data
    : JSON.stringify(data);

  return (
    contentType.includes("xml") ||
    text.includes("<rss") ||
    text.includes("<feed") ||
    text.includes("<?xml")
  );
};