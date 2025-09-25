import { useMemo, useState } from "react";
import { registerGame } from "@/lib/api";

export default function CreateGame({ onCreated }) {
  const [size, setSize] = useState(50);
  const [distribution, setDistribution] = useState(0);
  const [timelimit, setTimelimit] = useState(60);
  const [key, setKey] = useState("SjqjcN81Shq77nqwLL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [gameId, setGameId] = useState("");
  const [password, setPassword] = useState("");

  const isFormValid = useMemo(() => {
    const inRange =
      typeof distribution === "number" &&
      distribution >= -1 &&
      distribution <= 1;
    return size > 0 && inRange && timelimit > 0 && key.trim() !== "";
  }, [size, distribution, timelimit, key]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = await registerGame({ size, distribution, timelimit, key });
      setGameId(String(result?.id || ""));
      setPassword(String(result?.password || ""));
      if (onCreated && result?.id && result?.password) onCreated(result);
    } catch (err) {
      setErrorMessage(err?.message || "Failed to create game");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full rounded-[12px] border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="text-lg font-medium mb-3">Create Game</h2>
      <form
        onSubmit={handleSubmit}
        className="grid gap-3"
        aria-label="Create game form"
      >
        <label className="grid gap-1">
          <span className="text-sm">Size</span>
          <input
            type="number"
            inputMode="numeric"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="px-3 py-2 border rounded-md bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            placeholder="e.g. 50"
            aria-label="Size"
            required
            min={5}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Distribution (-1 to 1)</span>
          <input
            type="number"
            step="0.1"
            value={distribution}
            onChange={(e) => setDistribution(Number(e.target.value))}
            className="px-3 py-2 border rounded-md bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            placeholder="0"
            aria-label="Distribution"
            min={-1}
            max={1}
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Timelimit (seconds)</span>
          <input
            type="number"
            inputMode="numeric"
            value={timelimit}
            onChange={(e) => setTimelimit(Number(e.target.value))}
            className="px-3 py-2 border rounded-md bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            placeholder="60"
            aria-label="Timelimit"
            min={10}
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Server Key</span>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            placeholder="Server key"
            aria-label="Server key"
            required
          />
        </label>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Game"}
        </button>
      </form>

      {errorMessage ? (
        <div role="alert" className="mt-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      {(gameId || password) && (
        <section className="w-full rounded-[12px] border border-zinc-200 dark:border-zinc-800 p-4 mt-3">
          <h3 className="text-base font-medium mb-2">New Game</h3>
          <div className="text-sm grid gap-1">
            <div>
              <span className="text-zinc-500">ID:</span> {gameId || "-"}
            </div>
            <div className="break-all">
              <span className="text-zinc-500">Password:</span> {password || "-"}
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
