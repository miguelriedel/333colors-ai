const AGENT_ID = "C_Ik_1lsioL-HkkHIy10W";
const UPSTREAM_ORIGIN = "https://www.chatbase.co";

function isAllowedPath(pathname) {
  return (
    pathname === `/${AGENT_ID}/help` ||
    pathname.startsWith(`/${AGENT_ID}/help/`) ||
    pathname.startsWith("/__cb/") ||
    pathname === `/api/chat/${AGENT_ID}` ||
    pathname.startsWith(`/api/chat/${AGENT_ID}/`)
  );
}

function appendOriginalQuery(target, query) {
  for (const [key, value] of Object.entries(query || {})) {
    if (key === "path" || value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) target.searchParams.append(key, String(item));
    } else {
      target.searchParams.append(key, String(value));
    }
  }
}

function prepareRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD" || req.body == null) {
    return undefined;
  }

  if (Buffer.isBuffer(req.body) || typeof req.body === "string") {
    return req.body;
  }

  const contentType = String(req.headers["content-type"] || "");
  if (contentType.includes("application/json")) {
    return JSON.stringify(req.body);
  }

  return typeof req.body === "object" ? JSON.stringify(req.body) : String(req.body);
}

function rewriteTextBody(text, publicOrigin) {
  const encodedAgent = AGENT_ID.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return text
    .replaceAll("https://www.chatbase.co/__cb", `${publicOrigin}/__cb`)
    .replaceAll("https://chatbase.co/__cb", `${publicOrigin}/__cb`)
    .replaceAll(
      `https://www.chatbase.co/api/chat/${AGENT_ID}`,
      `${publicOrigin}/api/chat/${AGENT_ID}`
    )
    .replaceAll(
      `https://chatbase.co/api/chat/${AGENT_ID}`,
      `${publicOrigin}/api/chat/${AGENT_ID}`
    )
    .replace(
      new RegExp(`https://(?:www\\.)?chatbase\\.co/${encodedAgent}/help`, "g"),
      `${publicOrigin}/help`
    );
}

module.exports = async function handler(req, res) {
  try {
    const rawPath = Array.isArray(req.query.path)
      ? req.query.path.join("/")
      : String(req.query.path || "");

    const pathname = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

    if (!isAllowedPath(pathname)) {
      res.status(403).json({ error: "Proxy path not allowed." });
      return;
    }

    const target = new URL(pathname, UPSTREAM_ORIGIN);
    appendOriginalQuery(target, req.query);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (
        value === undefined ||
        ["host", "content-length", "connection", "accept-encoding"].includes(
          key.toLowerCase()
        )
      ) {
        continue;
      }

      headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
    }

    headers.set("host", "www.chatbase.co");
    headers.set(
      "user-agent",
      req.headers["user-agent"] ||
        "Mozilla/5.0 (compatible; 333ColorsHelpProxy/1.0)"
    );
    headers.set("accept-encoding", "identity");

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: prepareRequestBody(req),
      redirect: "follow"
    });

    const blockedResponseHeaders = new Set([
      "content-length",
      "content-encoding",
      "transfer-encoding",
      "connection",
      "keep-alive"
    ]);

    upstream.headers.forEach((value, key) => {
      if (
        !blockedResponseHeaders.has(key.toLowerCase()) &&
        key.toLowerCase() !== "set-cookie"
      ) {
        res.setHeader(key, value);
      }
    });

    const getSetCookie = upstream.headers.getSetCookie;
    if (typeof getSetCookie === "function") {
      const cookies = getSetCookie.call(upstream.headers).map((cookie) =>
        cookie.replace(/;\s*Domain=[^;]+/gi, "")
      );
      if (cookies.length) res.setHeader("set-cookie", cookies);
    }

    const contentType = upstream.headers.get("content-type") || "";
    const publicOrigin = `https://${req.headers.host}`;

    res.status(upstream.status);

    if (
      contentType.includes("text/") ||
      contentType.includes("javascript") ||
      contentType.includes("json") ||
      contentType.includes("xml")
    ) {
      const text = await upstream.text();
      res.send(rewriteTextBody(text, publicOrigin));
      return;
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    res.send(body);
  } catch (error) {
    console.error("Chatbase proxy error:", error);
    res.status(502).json({
      error: "Unable to load the 333Colors assistant.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
