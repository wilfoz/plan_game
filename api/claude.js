const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";
// Delays entre retries para 529 (ms). Total < 10s para caber no timeout Vercel Hobby.
const RETRY_DELAYS = [1000, 2000, 4000];

async function callAnthropic(apiKey, body) {
  return fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Tenta o modelo solicitado com backoff. Se persistir 529, faz fallback para haiku.
async function fetchAnthropic(apiKey, body) {
  let resp;

  // Tentativas com o modelo original
  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    resp = await callAnthropic(apiKey, body);
    if (resp.status !== 529 || i === RETRY_DELAYS.length) break;
    await new Promise(r => setTimeout(r, RETRY_DELAYS[i]));
  }

  // Fallback: se ainda 529 e não é haiku, tenta com haiku
  if (resp.status === 529 && body.model !== FALLBACK_MODEL) {
    resp = await callAnthropic(apiKey, { ...body, model: FALLBACK_MODEL });
  }

  return resp;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const proxySecret = process.env.CLAUDE_PROXY_SECRET;
  if (proxySecret && req.headers["x-proxy-secret"] !== proxySecret) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
    return;
  }

  const isStream = req.body?.stream === true;

  let upstream;
  try {
    upstream = await fetchAnthropic(apiKey, req.body);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Anthropic API", details: err.message });
    return;
  }

  if (upstream.status === 529) {
    res.status(529).json({ error: { message: "API Anthropic sobrecarregada mesmo após fallback. Tente novamente em alguns segundos." } });
    return;
  }

  if (isStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.status(upstream.status);

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } else {
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  }
}
