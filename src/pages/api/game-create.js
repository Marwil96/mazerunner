export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { size, distribution, timelimit, key } = req.body || {};
    if (
      typeof size !== "number" ||
      typeof distribution !== "number" ||
      typeof timelimit !== "number" ||
      typeof key !== "string"
    ) {
      return res.status(400).json({ error: "Invalid or missing fields" });
    }

    const baseUrl = "https://try-maze-runner.up.railway.app/api/v1";
    const endpoint = `${baseUrl}/game/create`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ size, distribution, timelimit, key }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res
        .status(response.status || 500)
        .json({ error: data?.error || "Game create failed", details: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
