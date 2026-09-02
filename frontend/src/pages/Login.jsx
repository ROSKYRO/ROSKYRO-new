import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
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
      const data = await login(phone, password);
      navigate(data.role === "admin" ? "/admin" : "/my-bookings");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not log in. Check your phone number and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <h1 className="font-display text-3xl text-ink mb-2">Log in</h1>
      <p className="text-ink/60 mb-8">Use your phone number to access your bookings.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-ink/70">Phone number</label>
          <input
            type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet"
            placeholder="98XXXXXXXX"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink/70">Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet"
          />
        </div>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button
          disabled={loading}
          className="w-full py-3 rounded-full bg-violet text-parchment font-semibold hover:bg-magenta transition-colors disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        New here? <Link to="/signup" className="text-violet font-medium">Create an account</Link>
      </p>
    </div>
  );
}
