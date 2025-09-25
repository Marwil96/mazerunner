import { useEffect, useState } from "react";

export default function GameControls() {
  const [gameId, setGameId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const gameSaved = window.localStorage.getItem("mazeGame");
        if (gameSaved) {
          const parsed = JSON.parse(gameSaved);
          if (parsed?.id) setGameId(String(parsed.id));
        }
      } catch {}
    };
    load();
    const onGame = () => load();
    window.addEventListener("maze:game-updated", onGame);
    return () => window.removeEventListener("maze:game-updated", onGame);
  }, []);

  const call = async (path) => {
    try {
      setBusy(true);
      setMessage("");
      const res = await fetch(`${path}?gameId=${encodeURIComponent(gameId)}`);
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

  return (
    <section className="w-full rounded-[12px] border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="text-lg font-medium mb-3">Game Controls</h2>
      <form
        className="grid gap-3"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Game controls"
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
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => call("/api/game-start")}
            disabled={!gameId || busy}
            className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={!gameId || busy}
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => call("/api/game-stop")}
            disabled={!gameId || busy}
            className="px-4 py-2 rounded-md bg-yellow-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={!gameId || busy}
          >
            Stop
          </button>
          <button
            type="button"
            onClick={() => call("/api/game-reset")}
            disabled={!gameId || busy}
            className="px-4 py-2 rounded-md bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={!gameId || busy}
          >
            Reset
          </button>
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
