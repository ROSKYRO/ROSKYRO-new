import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HospitalLogin() {
  const { hospitalLogin } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await hospitalLogin(phone, password);
      navigate("/hospital/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <div className="text-3xl mb-2">🏥</div>
      <h1 className="font-display text-3xl text-ink mb-2">Hospital Console</h1>
      <p className="text-ink/60 mb-8">
        Sign in to manage today's patients, active journeys, and family updates for your hospital.
      </p>

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
          className="w-full py-3 rounded-full bg-violet text-parchment font-semibold hover:bg-magenta transition-colors disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in to Console"}
        </button>
      </form>
      <p className="text-xs text-ink/40 mt-6">
        Don't have Console access yet? Ask your ROSKYRO partnerships contact to issue a login.
      </p>
    </div>
  );
}
