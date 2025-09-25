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
  const [playerColor, setPlayerColor] = useState("#ff0000");
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const saved = window.localStorage.getItem("mazePlayer");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.token) setToken(String(parsed.token));
          if (parsed?.color) setPlayerColor(String(parsed.color));
        }
        const gameSaved = window.localStorage.getItem("mazeGame");
        if (gameSaved) {
          const parsedGame = JSON.parse(gameSaved);
          if (parsedGame?.id) setGameId(String(parsedGame.id));
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

  const { grid, playersMap, claimsMap } = useMemo(() => {
    const raw = Array.isArray(status?.maze) ? status.maze : null;
    if (!raw || !Array.isArray(raw[0]))
      return { grid: raw, playersMap: new Map(), claimsMap: new Map() };
    const height = raw.length;
    const width = raw[0].length;
    // Rotate 90° counterclockwise so north maps to up visually
    const rotated = Array.from({ length: width }, (_, r) =>
      Array.from({ length: height }, (_, c) => raw[c][width - 1 - r])
    );

    // Process claims data (same structure as maze but with player IDs)
    const claimsRaw = Array.isArray(status?.claims) ? status.claims : null;
    const claimsRotated =
      claimsRaw && Array.isArray(claimsRaw[0])
        ? Array.from({ length: width }, (_, r) =>
            Array.from(
              { length: height },
              (_, c) => claimsRaw[c][width - 1 - r]
            )
          )
        : null;

    // Build overlay of other players in rotated coordinates
    const players = Array.isArray(status?.players) ? status.players : [];
    const myX = status?.pos?.x ?? status?.pos?.X ?? 0;
    const myY = status?.pos?.y ?? status?.pos?.Y ?? 0;
    const selfId = status?.id;
    const centerRowRaw = Math.floor(height / 2);
    const centerColRaw = Math.floor(width / 2);

    const playersMap = new Map();
    for (const p of players) {
      if (selfId != null && p?.id === selfId) continue;
      const pX = p?.pos?.x ?? p?.pos?.X;
      const pY = p?.pos?.y ?? p?.pos?.Y;
      if (typeof pX !== "number" || typeof pY !== "number") continue;
      const relX = pX - myX; // +x right (east)
      const relY = pY - myY; // +y ??? depends on world; flip to match matrix rows
      // Flip vertical so positive world Y maps upward in matrix (row index decreases)
      const rr = centerRowRaw - relY;
      const cc = centerColRaw + relX;
      if (rr < 0 || rr >= height || cc < 0 || cc >= width) continue;
      // raw(rr,cc) -> rotated(row,col)
      const rotRow = width - 1 - cc;
      const rotCol = rr;
      const key = `${rotRow}-${rotCol}`;
      const existing = playersMap.get(key) || [];
      existing.push(p);
      playersMap.set(key, existing);
    }

    // Build claims map from rotated claims data
    const claimsMap = new Map();
    if (claimsRotated) {
      for (let row = 0; row < claimsRotated.length; row++) {
        for (let col = 0; col < claimsRotated[row].length; col++) {
          const claimValue = claimsRotated[row][col];
          if (claimValue && claimValue !== 0) {
            const key = `${row}-${col}`;
            claimsMap.set(key, claimValue);
          }
        }
      }
    }

    return { grid: rotated, playersMap, claimsMap };
  }, [status]);

  const colorForTile = (value) => {
    if (value === TILE.WALL) return "bg-zinc-800";
    if (value === TILE.OOB) return "bg-zinc-400";
    if (value === TILE.PLAYER) return "bg-green-500"; // This will be overridden with playerColor
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
              row.map((cell, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                const others = playersMap.get(key);
                const hasOthers = Array.isArray(others) && others.length > 0;
                const firstColor = hasOthers
                  ? others.find((p) => p?.styles?.color)?.styles?.color
                  : undefined;
                const isPlayerTile = cell === TILE.PLAYER;
                const tileColor = isPlayerTile
                  ? playerColor
                  : colorForTile(cell);

                // Check for claims on this tile
                const claimValue = claimsMap.get(key);
                const hasClaim = claimValue && claimValue !== 0;

                // Get claim color - try to find the player with this ID
                let claimColor = null;
                if (hasClaim) {
                  const claimPlayer = status?.players?.find(
                    (p) => p?.id === claimValue
                  );
                  claimColor =
                    claimPlayer?.styles?.color ||
                    `hsl(${(claimValue * 137.5) % 360}, 70%, 50%)`;
                }

                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-label={`r${rowIndex} c${colIndex} v${cell}${
                      hasOthers ? ` players:${others.length}` : ""
                    }${hasClaim ? ` claimed:${claimValue}` : ""}`}
                    className={`relative aspect-square border border-zinc-200 dark:border-zinc-800 ${
                      isPlayerTile ? "" : colorForTile(cell)
                    }`}
                    style={isPlayerTile ? { backgroundColor: playerColor } : {}}
                    tabIndex={0}
                  >
                    {/* Claims overlay - semi-transparent color overlay */}
                    {hasClaim && !isPlayerTile && (
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{ backgroundColor: claimColor }}
                        aria-label={`claimed by player ${claimValue}`}
                      />
                    )}

                    {/* Other players overlay */}
                    {hasOthers && (
                      <span
                        className="absolute inset-1 rounded-full border border-white/60"
                        style={{ backgroundColor: firstColor || "#38bdf8" }}
                        aria-label={`players ${others.length}`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-zinc-500">No data yet</div>
      )}
    </section>
  );
}
