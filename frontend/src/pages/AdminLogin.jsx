import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep this page out of search engines even though it isn't linked
  // anywhere — belt and braces, doesn't reveal the path to anyone who
  // hasn't already loaded it.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(phone, password);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <h1 className="font-display text-3xl text-ink mb-2">Team sign-in</h1>
      <p className="text-ink/60 mb-8">Restricted access. Unauthorized attempts are logged.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-ink/70">Phone number</label>
          <input
            type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink/70">Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet"
          />
        </div>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button
          disabled={loading}
          className="w-full py-3 rounded-full bg-ink text-parchment font-semibold hover:bg-ink/80 transition-colors disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
