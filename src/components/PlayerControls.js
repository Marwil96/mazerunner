import { useEffect, useState } from "react";

const directions = ["north", "south", "west", "east"];

export default function PlayerControls() {
  const [gameId, setGameId] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = () => {
      try {
        const saved = window.localStorage.getItem("mazePlayer");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.token) setToken(String(parsed.token));
        }
        const gameSaved = window.localStorage.getItem("mazeGame");
        if (gameSaved) {
          const parsed = JSON.parse(gameSaved);
          if (parsed?.id) setGameId(String(parsed.id));
        }
      } catch {}
    };
    load();
    const onPlayer = () => load();
    const onGame = () => load();
    window.addEventListener("maze:player-updated", onPlayer);
    window.addEventListener("maze:game-updated", onGame);
    return () => {
      window.removeEventListener("maze:player-updated", onPlayer);
      window.removeEventListener("maze:game-updated", onGame);
    };
  }, []);

  const withReq = async (path, init) => {
    try {
      setBusy(true);
      setMessage("");
      const res = await fetch(`${path}?gameId=${encodeURIComponent(gameId)}`, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type":
            init?.method === "POST" ? "application/json" : undefined,
        },
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_) {}
      if (!res.ok)
        throw new Error(
          (data && (data.error || data.message)) || text || "Action failed"
        );
      setMessage("Success");
      return data;
    } catch (err) {
      setMessage(err?.message || "Request failed");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (direction) => {
    if (!gameId || !token || busy) return;
    await withReq("/api/player-move", {
      method: "POST",
      body: JSON.stringify({ direction }),
    });
  };

  const handleBomb = async () => {
    if (!gameId || !token || busy) return;
    await withReq("/api/player-bomb", { method: "GET" });
  };

  const handleShoot = async (direction) => {
    if (!gameId || !token || busy) return;
    await withReq("/api/player-shoot", {
      method: "POST",
      body: JSON.stringify({ direction }),
    });
  };

  return (
    <section className="w-full rounded-[12px] border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="text-lg font-medium mb-3">Player Controls</h2>
      <form
        className="grid gap-3"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Player controls"
      >
        <label className="grid gap-1">
          <span className="text-sm">Game ID</span>
          <input
            type="number"
            inputMode="numeric"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            placeholder="e.g. 1"
            aria-label="Game ID"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Token</span>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            placeholder="Player token"
            aria-label="Player token"
          />
        </label>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          role="group"
          aria-label="Move"
        >
          {directions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleMove(d)}
              disabled={!gameId || !token || busy}
              className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Move ${d}`}
              aria-disabled={!gameId || !token || busy}
            >
              Move {d}
            </button>
          ))}
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          role="group"
          aria-label="Abilities"
        >
          <button
            type="button"
            onClick={handleBomb}
            disabled={!gameId || !token || busy}
            className="px-4 py-2 rounded-md bg-zinc-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Use bomb"
            aria-disabled={!gameId || !token || busy}
          >
            Bomb
          </button>
          {directions.map((d) => (
            <button
              key={`shoot-${d}`}
              type="button"
              onClick={() => handleShoot(d)}
              disabled={!gameId || !token || busy}
              className="px-4 py-2 rounded-md bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Shoot ${d}`}
              aria-disabled={!gameId || !token || busy}
            >
              Shoot {d}
            </button>
          ))}
        </div>
        {message && (
          <div role="status" className="text-sm text-zinc-600">
            {message}
          </div>
        )}
      </form>
    </section>
  );
}
