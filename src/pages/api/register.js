export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { gameId, password, name, styles } = req.body || {};

    if (!gameId || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const baseUrl = "https://try-maze-runner.up.railway.app/api/v1";
    const endpoint = `${baseUrl}/game/${encodeURIComponent(
      gameId
    )}/player/register/${encodeURIComponent(password)}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, styles: styles || {} }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res
        .status(response.status || 500)
        .json({ error: data?.error || "Registration failed", details: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
