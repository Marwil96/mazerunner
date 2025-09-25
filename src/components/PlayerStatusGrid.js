import { useEffect, useMemo, useState } from "react";

const TILE = {
  FLOOR: 0,
  WALL: 1,
  OOB: 2,
  PLAYER: 3,
};

export default function PlayerStatusGrid() {
  const [gameId, setGameId] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mazePlayer");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token) setToken(String(parsed.token));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    if (!gameId || !token) return;

    let cancelled = false;
    const controller = new AbortController();

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/player-status?gameId=${encodeURIComponent(gameId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch status");
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) setErrorMessage(err?.message || "Network error");
      }
    };

    poll();
    const id = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, [isRunning, gameId, token]);

  const grid = useMemo(() => {
    return Array.isArray(status?.maze) ? status.maze : null;
  }, [status]);

  const colorForTile = (value) => {
    if (value === TILE.WALL) return "bg-zinc-800";
    if (value === TILE.OOB) return "bg-zinc-400";
    if (value === TILE.PLAYER) return "bg-green-500";
    return "bg-white"; // floor
  };

  return (
    <section className="w-full rounded-[12px] border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="text-lg font-medium mb-3">Player Status</h2>
      <form
        className="grid gap-3"
        aria-label="Player status settings"
        onSubmit={(e) => e.preventDefault()}
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(true)}
            disabled={!gameId || !token || isRunning}
            className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={!gameId || !token || isRunning}
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => setIsRunning(false)}
            disabled={!isRunning}
            className="px-4 py-2 rounded-md bg-zinc-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={!isRunning}
          >
            Stop
          </button>
        </div>
      </form>

      {errorMessage ? (
        <div role="alert" className="mt-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      {grid ? (
        <div className="mt-4">
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${
                grid?.[0]?.length || 0
              }, minmax(0, 1fr))`,
            }}
            aria-label="Maze grid"
            role="grid"
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  role="gridcell"
                  aria-label={`r${rowIndex} c${colIndex} v${cell}`}
                  className={`aspect-square ${colorForTile(
                    cell
                  )} border border-zinc-200 dark:border-zinc-800`}
                  tabIndex={0}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-zinc-500">No data yet</div>
      )}
    </section>
  );
}
