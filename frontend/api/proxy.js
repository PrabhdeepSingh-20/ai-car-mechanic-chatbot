const BACKEND_ORIGIN = "http://51.21.160.45:8000";

const FORWARDED_REQUEST_HEADERS = [
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

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
];

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const requestedPath = incomingUrl.searchParams.get("path") || "";
    const normalizedPath = requestedPath.replace(/^\/+|\/+$/g, "");
    const validPath = /^(chat|diagnosis|upload|booking)(\/[^/]+)?$/.test(
      normalizedPath,
    );

    if (!validPath) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const targetUrl = new URL(
      `/api/${normalizedPath}/`,
      BACKEND_ORIGIN,
    );
    for (const [key, value] of incomingUrl.searchParams) {
      if (key !== "path") targetUrl.searchParams.append(key, value);
    }

    const headers = new Headers();
    for (const name of FORWARDED_REQUEST_HEADERS) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    try {
      const upstream = await fetch(targetUrl, init);
      const responseHeaders = new Headers(upstream.headers);
      for (const name of HOP_BY_HOP_HEADERS) responseHeaders.delete(name);

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("API proxy request failed:", error);
      return Response.json(
        { error: "Backend service is unavailable" },
        { status: 502 },
      );
    }
  },
};
