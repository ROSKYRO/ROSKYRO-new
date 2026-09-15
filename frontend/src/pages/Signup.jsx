import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      navigate("/services");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <h1 className="font-display text-3xl text-ink mb-2">Create an account</h1>
      <p className="text-ink/60 mb-8">Takes under a minute — just your name, phone and a password.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-ink/70">Full name</label>
          <input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink/70">Phone number</label>
          <input type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet"
            placeholder="98XXXXXXXX" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink/70">Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
        </div>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button disabled={loading}
          className="w-full py-3 rounded-full bg-violet text-parchment font-semibold hover:bg-magenta transition-colors disabled:opacity-60">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        Already have an account? <Link to="/login" className="text-violet font-medium">Log in</Link>
      </p>
    </div>
  );
}
