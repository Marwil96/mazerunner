export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { gameId } = req.query || {};
  if (!gameId) return res.status(400).json({ error: "Missing gameId" });

  try {
    const baseUrl = "https://try-maze-runner.up.railway.app/api/v1";
    const endpoint = `${baseUrl}/game/${encodeURIComponent(gameId)}/start`;
    const upstream = await fetch(endpoint, { method: "GET" });
    const text = await upstream.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {}
    if (!upstream.ok) {
      const message =
        (data && (data.error || data.message)) || text || "Start failed";
      return res
        .status(upstream.status || 500)
        .json({ error: message, details: data || text });
    }
    if (!text) return res.status(200).json({ ok: true });
    return res.status(200).json(data || {});
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
