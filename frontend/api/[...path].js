const BACKEND_ORIGIN = "http://51.21.160.45:8000";

const REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-csrftoken",
  "x-requested-with",
];

const RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-type",
  "etag",
  "expires",
  "last-modified",
  "location",
  "set-cookie",
  "vary",
  "www-authenticate",
];

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const path = req.url || "/api/";
  const headers = new Headers();

  for (const name of REQUEST_HEADERS) {
    const value = req.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }

  const init = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    init.body = Buffer.concat(chunks);
  }

  try {
    const upstream = await fetch(`${BACKEND_ORIGIN}${path}`, init);
    res.statusCode = upstream.status;

    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value !== null) res.setHeader(name, value);
    }

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.end(responseBody);
  } catch (error) {
    console.error("API proxy request failed:", error);
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Backend service is unavailable" }));
  }
}
