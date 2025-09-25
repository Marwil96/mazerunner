import { useEffect, useMemo, useState } from "react";

export default function RegisterPlayer() {
  const [gameId, setGameId] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [color, setColor] = useState("#ff0000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [playerToken, setPlayerToken] = useState("");
  const [playerId, setPlayerId] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mazePlayer");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed?.id) setPlayerId(String(parsed.id));
      if (parsed?.token) setPlayerToken(String(parsed.token));
      if (parsed?.name) setTeamName(String(parsed.name));
    } catch {}
  }, []);

  const isFormValid = useMemo(() => {
    return (
      gameId.trim() !== "" && password.trim() !== "" && teamName.trim() !== ""
    );
  }, [gameId, password, teamName]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: Number(gameId),
          password,
          name: teamName,
          styles: { color },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data?.error || "Registration failed");
        return;
      }
      if (data?.id && data?.token) {
        setPlayerId(String(data.id));
        setPlayerToken(String(data.token));
        setSuccessMessage("Player registered successfully");
        try {
          window.localStorage.setItem(
            "mazePlayer",
            JSON.stringify({
              id: data.id,
              token: data.token,
              name: data.name,
              color,
            })
          );
          window.dispatchEvent(new Event("maze:player-updated"));
        } catch {}
      } else {
        setErrorMessage("Unexpected response from server");
      }
    } catch (err) {
      setErrorMessage("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full rounded-[12px] border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="text-lg font-medium mb-3">Register Player</h2>
      <form
        onSubmit={handleSubmit}
        className="grid gap-3"
        aria-label="Register player form"
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
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Game Password</span>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            placeholder="game password"
            aria-label="Game password"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Team Name</span>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            placeholder="Your team name"
            aria-label="Team name"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Color</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 p-1 border rounded bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
            aria-label="Team color"
          />
        </label>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>

      {errorMessage ? (
        <div role="alert" className="mt-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div role="status" className="mt-3 text-sm text-green-600">
          {successMessage}
        </div>
      ) : null}

      {(playerId || playerToken) && (
        <section className="w-full rounded-[12px] border border-zinc-200 dark:border-zinc-800 p-4 mt-3">
          <h2 className="text-lg font-medium mb-2">Player</h2>
          <div className="text-sm grid gap-1">
            <div>
              <span className="text-zinc-500">ID:</span> {playerId || "-"}
            </div>
            <div className="break-all">
              <span className="text-zinc-500">Token:</span> {playerToken || "-"}
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
