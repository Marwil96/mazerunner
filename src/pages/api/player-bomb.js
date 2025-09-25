export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { gameId } = req.query || {};
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  if (!gameId) return res.status(400).json({ error: "Missing gameId" });
  if (!authHeader)
    return res.status(401).json({ error: "Missing Authorization header" });

  try {
    const baseUrl = "https://try-maze-runner.up.railway.app/api/v1";
    const endpoint = `${baseUrl}/game/${encodeURIComponent(
      gameId
    )}/player/ability/bomb`;
    const upstream = await fetch(endpoint, {
      method: "GET",
      headers: { Authorization: authHeader },
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return res
        .status(upstream.status || 500)
        .json({ error: data?.error || "Bomb failed", details: data });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
