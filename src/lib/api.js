export const registerGame = async ({ size, distribution, timelimit, key }) => {
  const res = await fetch("/api/game-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ size, distribution, timelimit, key }),
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error || "Failed to create game";
    throw new Error(message);
  }
  return data;
};
